const User = require("../models/userModel");

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }

    const userData = user.toObject();

    res.json({
      status: "success",
      data: {
        id: userData._id,
        name: userData.name,
        email: userData.email,
        createdAt: userData.createdAt,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ status: "error", message: "An unexpected error occurred" });
  }
};

module.exports = { getUserProfile };
