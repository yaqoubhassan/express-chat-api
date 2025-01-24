const Conversation = require("../models/conversationModel");

const getConversations = async (req, res) => {
  const userId = req.user.id; // Authenticated user's ID

  try {
    const conversations = await Conversation.find({
      participants: userId,
    })
      .sort({ lastMessageAt: -1 }) // Sort by recent activity
      .populate("participants", "name email"); // Populate participant details

    res.status(200).json({
      status: "success",
      data: conversations,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve conversations.",
    });
  }
};

const getMessagesByConversationId = async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId,
    }).populate("sender", "name email");

    res.status(200).json({
      status: "success",
      data: messages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "failed", message: "Server Error" });
  }
};

module.exports = { getConversations, getMessagesByConversationId };
