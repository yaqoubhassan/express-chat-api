const Conversation = require("../models/conversationModel");
const Message = require("../models/messageModel");
const path = require("path");
const User = require("../models/userModel");

const getConversations = async (req, res) => {
  const userId = req.user.id; // Authenticated user's ID

  try {
    // Extract query parameters for pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Base URL for constructing avatar paths
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    // Fetch conversations with pagination and populate participants
    const conversations = await Conversation.find({
      participants: userId,
    })
      .sort({ lastMessageAt: -1 }) // Sort by recent activity
      .skip(skip)
      .limit(limit)
      .populate("participants", "name email avatar") // Populate participant details
      .lean(); // Convert MongoDB documents to plain objects

    // Format participant avatars
    const formattedConversations = conversations.map((conversation) => {
      conversation.participants = conversation.participants.map(
        (participant) => {
          if (participant.avatar) {
            // Extract relative path and construct the full URL
            const relativePath = path.relative(
              path.join(__dirname, ".."), // Adjust this path to match your `public/uploads` directory
              participant.avatar
            );
            participant.avatar = `${baseUrl}/${relativePath.replace(
              /\\/g,
              "/"
            )}`;
          } else {
            // Use default avatar if no avatar exists
            participant.avatar = `${baseUrl}/public/default-avatar.png`;
          }
          return participant;
        }
      );
      return conversation;
    });

    // Get total count of conversations for pagination metadata
    const totalConversations = await Conversation.countDocuments({
      participants: userId,
    });
    const totalPages = Math.ceil(totalConversations / limit);

    // Return paginated response
    res.status(200).json({
      success: true,
      data: formattedConversations,
      meta: {
        currentPage: page,
        totalPages,
        totalConversations,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching conversations:", error); // Log the error for debugging
    res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
      error: error.message,
    });
  }
};

const getMessagesByUserId = async (req, res) => {
  try {
    const { userId } = req.params; // ID of the chat participant
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Get the logged-in user ID
    const loggedInUserId = req.user.id; // Assuming authentication middleware

    // Find the conversation between logged-in user and the given userId
    const conversation = await Conversation.findOne({
      participants: { $all: [loggedInUserId, userId] },
    });

    if (!conversation) {
      return res.status(404).json({
        status: "failed",
        message: "No conversation found",
      });
    }

    // Fetch messages for the found conversation
    const messages = await Message.find({ conversationId: conversation._id })
      .populate("sender", "name email")
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(Number(limit));

    const totalMessages = await Message.countDocuments({
      conversationId: conversation._id,
    });

    // Fetch the receiver's active status
    const receiver = await User.findById(userId).select("activeStatus");

    res.status(200).json({
      status: "success",
      data: messages,
      conversationId: conversation._id, // Send back conversationId for reference
      total: totalMessages,
      hasMore: skip + messages.length < totalMessages,
      activeStatus: receiver?.activeStatus || null, // Include user's active status
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "failed", message: "Server Error" });
  }
};

module.exports = { getConversations, getMessagesByUserId };
