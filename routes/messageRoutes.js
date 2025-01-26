const express = require("express");
const { sendMessage } = require("../controllers/messageController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, sendMessage);

module.exports = router;
