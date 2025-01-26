const express = require("express");
const {
  getConversations,
  getMessagesByConversationId,
} = require("../controllers/conversationController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/").get(authMiddleware, getConversations);
//   .post(authMiddleware, createConversation);
router
  .route("/:conversationId/messages")
  .get(authMiddleware, getMessagesByConversationId);

module.exports = router;
