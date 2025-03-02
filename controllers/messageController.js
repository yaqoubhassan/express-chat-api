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

module.exports = { sendMessage, markMessageAsRead };
