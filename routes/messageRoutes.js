const express = require("express");
const {
  sendMessage,
  updateMessage,
  markMessageAsRead,
} = require("../controllers/messageController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, sendMessage);
router.patch("/:messageId", authMiddleware, updateMessage);
router.patch("/:messageId/read", authMiddleware, markMessageAsRead);

module.exports = router;
