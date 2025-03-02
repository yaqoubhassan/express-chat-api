const Conversation = require("../models/conversationModel");
const Message = require("../models/messageModel");
const errorHandler = require("../utils/errorHandler");

const sendMessage = async (req, res) => {
  const { receiverId, content } = req.body;
  const senderId = req.user.id;

  try {
    // Find or create the conversation between sender and receiver
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [senderId, receiverId],
        lastMessage: content,
        lastMessageAt: Date.now(),
        // Note: we'll set lastMessageId after creating the message
      });
      await conversation.save();
    }

    // Create and save the message
    const message = new Message({
      conversationId: conversation._id,
      sender: senderId,
      content,
      read: false, // Ensure the message starts as unread
    });
    await message.save();

    await message.populate("sender", "name email avatar");
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    // Update conversation with the latest message details
    conversation.lastMessage = content;
    conversation.lastMessageAt = Date.now();
    conversation.lastMessageId = message._id; // Set the lastMessageId to the newly created message
    await conversation.save();

    // Get current unread count for the receiver
    const unreadCount = await Message.countDocuments({
      conversationId: conversation._id,
      sender: senderId, // Messages from current sender
      read: false, // That are unread
    });

    // Emit real-time event via WebSocket using rooms
    const io = req.app.get("socketio");
    const messageData = {
      id: message._id,
      conversationId: conversation._id,
      sender: senderId,
      senderName: message.sender.name,
      senderEmail: message.sender.email,
      senderAvatar: message.sender.avatar
        ? `${baseUrl}/${message.sender.avatar}`
        : `${baseUrl}/public/default-avatar.png`,
      receiver: receiverId,
      content,
      createdAt: message.createdAt,
      unreadCount: unreadCount, // Include the unread count in the response
    };

    // Notify the receiver and sender by emitting to their respective rooms
    io.to(receiverId).emit("message", messageData); // Send to receiver's room
    // io.to(senderId).emit("message", messageData);

    // Respond with the message and conversation details
    res.status(201).json({
      status: "success",
      data: {
        message,
        conversation,
        unreadCount, // Include unread count in API response
      },
    });
  } catch (error) {
    errorHandler(error, res, 500, "failed", "Failed to send message");
  }
};

// Controller function for updating a message
const updateMessage = async (req, res) => {
  const { messageId } = req.params; // Message ID
  const { content } = req.body;
  const userId = req.user.id;

  if (!content || content.trim() === "") {
    return res.status(400).json({
      status: "failed",
      errors: [
        { msg: "Content is required", param: "content", location: "body" },
      ],
    });
  }

  try {
    // Find the message and ensure it belongs to the current user
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        status: "failed",
        message: "Message not found",
      });
    }

    // Check if user is the sender of the message
    if (message.sender.toString() !== userId) {
      return res.status(403).json({
        status: "failed",
        message: "You can only edit your own messages",
      });
    }

    // Check if the message is too old to edit (e.g., 24 hours)
    const messageAge = Date.now() - new Date(message.createdAt).getTime();
    const MAX_EDIT_AGE = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    if (messageAge > MAX_EDIT_AGE) {
      return res.status(400).json({
        status: "failed",
        message: "Message is too old to edit",
      });
    }

    // Update the message
    message.content = content;
    message.isEdited = true;
    message.updatedAt = Date.now();
    await message.save();

    await message.populate("sender", "name email avatar");
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    // Get the conversation
    const conversation = await Conversation.findById(message.conversationId);

    // Update the conversation's last message if this was the last message
    // Use the lastMessageId field to check if this is the last message
    if (
      conversation.lastMessageId &&
      conversation.lastMessageId.toString() === messageId
    ) {
      conversation.lastMessage = content;
      await conversation.save();
    }

    // Emit socket event to notify about the message update
    const io = req.app.get("socketio");
    const receiverId = conversation.participants.find(
      (p) => p.toString() !== userId
    );

    const updateData = {
      id: message._id,
      conversationId: message.conversationId,
      content,
      // read: false,
      edited: true,
      editedAt: message.editedAt,
      senderAvatar: message.sender.avatar
        ? `${baseUrl}/${message.sender.avatar}`
        : `${baseUrl}/public/default-avatar.png`,
    };

    // Send to both sender and receiver
    // io.to(receiverId.toString()).emit("messageUpdated", updateData);
    // io.to(userId).emit("messageUpdated", updateData);
    io.to(receiverId.toString()).emit("messageUpdated", {
      messageId: message._id, // Make sure to use messageId instead of id
      content,
      receiverId: userId, // Include who sent the update
    });

    // Respond with success
    res.status(200).json({
      status: "success",
      data: {
        message,
      },
    });
  } catch (error) {
    errorHandler(error, res, 500, "failed", "Failed to update message");
  }
};

const markMessageAsRead = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res
        .status(404)
        .json({ status: "error", message: "Message not found" });
    }

    if (message.sender.toString() === req.user.id) {
      return res
        .status(403)
        .json({ status: "error", message: "Cannot mark own message as read" });
    }

    // Mark message as read
    message.read = true;
    await message.save();

    // Emit real-time event to notify sender
    const io = req.app.get("socketio");
    io.to(message.sender.toString()).emit("messageRead", {
      messageId: message._id,
      receiverId: req.user.id, // The user who read the message
    });

    res.status(200).json({
      status: "success",
      message: "Message marked as read",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "failed", message: "Server Error" });
  }
};

module.exports = { sendMessage, updateMessage, markMessageAsRead };
