const express = require("express");
const {
  registerUser,
  verifyEmail,
  resendOtp,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-email", verifyEmail);
router.post("/resend-otp", resendOtp);

module.exports = router;
