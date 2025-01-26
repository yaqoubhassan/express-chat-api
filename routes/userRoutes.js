const express = require("express");
const {
  getUserProfile,
  updateUserProfile,
  getAllUsers,
} = require("../controllers/userController");
const { authMiddleware } = require("../middleware/authMiddleware");
const upload = require("../middleware/multerConfig");

const router = express.Router();

router.get("/", authMiddleware, getAllUsers);
router.get("/profile", authMiddleware, getUserProfile);
router.put(
  "/update",
  authMiddleware,
  upload.single("avatar"),
  updateUserProfile
);

module.exports = router;
