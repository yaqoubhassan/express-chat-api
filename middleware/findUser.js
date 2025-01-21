const User = require("../models/userModel");

const findUserByEmail = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("User not found.");
  }
  return user;
};

module.exports = findUserByEmail;
