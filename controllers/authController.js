const User = require("../models/userModel");
const sendEmail = require("../utils/sendEmail");
const generateOtp = require("../utils/generateOtp");
const generateToken = require("../utils/generateToken");
const findUserByEmail = require("../middlewares/findUser");
const handleRequestAndServerErrors = require("../utils/errorHandler");
const { emailVerificationTemplate } = require("../utils/emailTemplates");

const registerUser = async (req, res) => {
  const { name, email, password, passwordConfirmation } = req.body;

  try {
    if (password !== passwordConfirmation) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return handleRequestAndServerErrors(
        (error = null),
        res,
        400,
        "error",
        "User already exists"
      );
    }

    const user = new User({ name, email, password });

    const { otp, otpExpires } = generateOtp();
    user.otp = otp;
    user.otpExpires = otpExpires;

    await user.save();

    const emailHtml = emailVerificationTemplate(otp);

    await sendEmail(email, "Verify Your Email", emailHtml);

    res.status(201).json({
      status: "success",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    handleRequestAndServerErrors(error, res, 500, "fail", "Server Error");
  }
};

const verifyEmail = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await findUserByEmail(email);

    if (user.verified) {
      return res.status(400).json({
        status: "error",
        message: "User is already verified.",
      });
    }

    if (user.otp !== otp) {
      return res.status(400).json({
        status: "error",
        message: "Invalid verification code.",
      });
    }

    if (user.otpExpires < Date.now()) {
      return res.status(400).json({
        status: "error",
        message: "Verification code has expired",
      });
    }

    user.verified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.status(200).json({
      status: "success",
      message: "Email verified successfully",
    });
  } catch (error) {
    handleRequestAndServerErrors(error, res, 500, "failed", "Server Error");
  }
};

const resendOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await findUserByEmail(email);

    if (user.verified) {
      return handleRequestAndServerErrors(
        (error = null),
        res,
        400,
        "error",
        "User is already verified"
      );
    }

    const { otp, otpExpires } = generateOtp();
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    const emailHtml = `
      <h1>Email Verification</h1>
      <p>Your new verification code id:</p>
      <h2>${otp}</h2>
      <p>This code will expire in 10 minutes</p>
    `;

    await sendEmail(email, "Resend Verification Code", emailHtml);

    res.status(200).json({
      status: "success",
      message: "Verification code resent successfully.",
    });
  } catch (error) {
    handleRequestAndServerErrors(error, res, 500, "failed", "Server Error");
  }
};

module.exports = { registerUser, verifyEmail, resendOtp };
