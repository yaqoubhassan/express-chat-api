const User = require("../models/userModel");

const findUserByEmail = async (email, res) => {
  const user = await User.findOne({ email });
  if (!user) {
    res.status(404).json({
      status: "error",
      message: "Invalid credentials",
    });
    // throw new Error("User not found.");
  }
  return user;
};

module.exports = findUserByEmail;
