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
    });
    await message.save();

    // Update conversation with the latest message details
    conversation.lastMessage = content;
    conversation.lastMessageAt = Date.now();
    await conversation.save();

    // Emit real-time event via WebSocket using rooms
    const io = req.app.get("socketio");
    // console.log("io is", io);
    const messageData = {
      conversationId: conversation._id,
      sender: senderId,
      receiver: receiverId,
      content,
      createdAt: message.createdAt,
    };

    // Notify the receiver and sender by emitting to their respective rooms
    io.to(receiverId).emit("message", messageData); // Send to receiver's room
    // io.to(senderId).emit("message", messageData); // Optionally, send to sender's room

    // Respond with the message and conversation details
    res.status(201).json({
      status: "success",
      data: {
        message,
        conversation,
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

    message.read = true;
    await message.save();

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
