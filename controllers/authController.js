const User = require("../models/userModel");
const sendEmail = require("../utils/sendEmail");
const generateOtp = require("../utils/generateOtp");
const generateToken = require("../utils/generateToken");
const findUserByEmail = require("../middleware/findUser");
const handleRequestAndServerErrors = require("../utils/errorHandler");
const { emailVerificationTemplate } = require("../utils/emailTemplates");

const registerUser = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  try {
    if (password !== confirmPassword) {
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

    const emailHtml = emailVerificationTemplate(otp, otpExpires);

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
      data: {
        token: generateToken(user._id),
      },
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
        null,
        res,
        400,
        "error",
        "User is already verified"
      );
    }

    // Check if the previous OTP is older than 6 minutes
    const currentTime = Date.now();
    const otpAge = (currentTime - new Date(user.otpExpires).getTime()) / 1000; // in seconds

    if (otpAge <= 240) {
      // If OTP is less than or equal to 6 minutes old
      const emailHtml = emailVerificationTemplate(user.otp, user.otpExpires);

      await sendEmail(email, "Resend Verification Code", emailHtml);

      return res.status(200).json({
        status: "success",
        message: "Verification code resent successfully.",
      });
    }

    // Generate a new OTP if the previous one is older than 6 minutes
    const { otp, otpExpires } = generateOtp();
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    const emailHtml = emailVerificationTemplate(otp, otpExpires);

    await sendEmail(email, "Resend Verification Code", emailHtml);

    res.status(200).json({
      status: "success",
      message: "Verification code resent successfully.",
    });
  } catch (error) {
    handleRequestAndServerErrors(error, res, 500, "failed", "Server Error");
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await findUserByEmail(email);
    console.log("User is: ", user);

    if (!user.verified) {
      // Check if the previous OTP is less than or equal to 6 minutes old
      const currentTime = Date.now();
      const otpAge = (currentTime - new Date(user.otpExpires).getTime()) / 1000; // in seconds

      if (otpAge <= 360) {
        // Resend the existing OTP
        const emailHtml = emailVerificationTemplate(user.otp, user.otpExpires);

        await sendEmail(email, "Resend Verification Code", emailHtml);

        return res.status(400).json({
          status: "error",
          message:
            "Please verify your email. A verification code has been resent.",
          data: {
            email: user.email,
          },
        });
      }

      // Generate a new OTP if the previous one is older than 6 minutes
      const { otp, otpExpires } = generateOtp();
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();

      const emailHtml = emailVerificationTemplate(otp, otpExpires);
      await sendEmail(email, "Verify Your Email", emailHtml);

      return res.status(400).json({
        status: "error",
        message:
          "Please verify your email. A new verification code has been sent.",
        data: {
          email: user.email,
        },
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        status: "error",
        message: "Invalid credentials.",
      });
    }

    res.status(200).json({
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

module.exports = { registerUser, verifyEmail, resendOtp, login };
