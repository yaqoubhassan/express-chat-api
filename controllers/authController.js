const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
};

const registerUser = async (req, res) => {
  const { name, email, password, passwordConfirmation } = req.body;

  try {
    if (password !== passwordConfirmation) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: "error",
        message: "User already exists",
      });
    }

    const user = new User({ name, email, password });
    await user.save();

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
    console.error(error);
    res.status(500).json({
      status: "failed",
      message: "Server error",
    });
  }
};

module.exports = { registerUser };
