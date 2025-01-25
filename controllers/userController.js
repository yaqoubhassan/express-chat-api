const User = require("../models/userModel");
const fs = require("fs");
const path = require("path"); // Import the 'path' module for path operations

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const userData = user.toObject();

    // Fix the avatar path
    if (userData.avatar) {
      // Extract the relative path by removing the base directory
      const relativePath = path.relative(
        path.join(__dirname, ".."), // Adjust this to match your public/uploads directory
        userData.avatar
      );
      console.log("relative path: ", relativePath);

      // Construct the URL with the relative path
      userData.avatar = `${baseUrl}/${relativePath.replace(/\\/g, "/")}`;
    }

    res.json({
      status: "success",
      data: {
        id: userData._id,
        name: userData.name,
        email: userData.email,
        avatar: userData.avatar,
        createdAt: userData.createdAt,
      },
    });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res
      .status(500)
      .json({ status: "error", message: "An unexpected error occurred" });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email } = req.body;

    // Find the user to check for an existing profile picture
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Delete the old profile picture if it exists
    if (user.avatar) {
      const oldProfilePicturePath = path.join(__dirname, "..", user.avatar);
      fs.unlink(oldProfilePicturePath, (err) => {
        if (err) {
          console.error("Error deleting old profile picture:", err.message);
        }
      });
    }

    // Update user details
    const updatedUser = {
      name: name || user.name,
      email: email || user.email,
    };

    // Add the new profile picture if uploaded
    if (req.file) {
      updatedUser.avatar = req.file.path;
    }

    const updatedUserData = await User.findByIdAndUpdate(userId, updatedUser, {
      new: true,
    });

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    res.status(200).json({
      status: "success",
      data: {
        id: updatedUserData._id,
        name: updatedUserData.name,
        email: updatedUserData.email,
        avatar: updatedUserData.avatar
          ? `${baseUrl}/${updatedUserData.avatar.replace(/\\/g, "/")}`
          : null,
        createdAt: updatedUserData.createdAt,
      },
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({
      status: "failed",
      message: error.message,
    });
  }
};

module.exports = { getUserProfile, updateUserProfile };
