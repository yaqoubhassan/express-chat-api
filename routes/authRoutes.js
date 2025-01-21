const express = require("express");
const {
  registerUser,
  verifyEmail,
  resendOtp,
  login,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendOtp);
router.post("/login", login);

module.exports = router;
