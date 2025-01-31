const express = require("express");
const {
  getConversations,
  getMessagesByUserId,
} = require("../controllers/conversationController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").get(authMiddleware, getConversations);
//   .post(authMiddleware, createConversation);
router.route("/:userId/messages").get(authMiddleware, getMessagesByUserId);

module.exports = router;
