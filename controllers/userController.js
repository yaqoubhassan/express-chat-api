const User = require("../models/userModel");
const fs = require("fs").promises;
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
    const { name, email, deleteAvatar } = req.body;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const updatedUser = {
      name: name || user.name,
      email: email || user.email,
    };

    // Delete the avatar if requested
    if (deleteAvatar === "true" && user.avatar) {
      const oldProfilePicturePath = path.join(__dirname, "..", user.avatar);
      try {
        await fs.unlink(oldProfilePicturePath);
      } catch (err) {
        console.error("Error deleting old profile picture:", err.message);
      }
      updatedUser.avatar = null; // Remove avatar
    }

    // Upload a new avatar if provided
    if (req.file) {
      // Remove the old avatar if it exists
      if (user.avatar) {
        const oldProfilePicturePath = path.join(__dirname, "..", user.avatar);
        try {
          await fs.unlink(oldProfilePicturePath);
        } catch (err) {
          console.error("Error deleting old profile picture:", err.message);
        }
      }
      updatedUser.avatar = req.file.path.replace(/\\/g, "/"); // Normalize path
    }

    // Skip update if no changes
    if (!req.file && deleteAvatar !== "true" && !name && !email) {
      return res.status(400).json({
        status: "error",
        message: "No changes provided",
      });
    }

    // Update the user
    const updatedUserData = await User.findByIdAndUpdate(
      user._id,
      updatedUser,
      { new: true }
    );

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    res.status(200).json({
      status: "success",
      data: {
        id: updatedUserData._id,
        name: updatedUserData.name,
        email: updatedUserData.email,
        avatar: updatedUserData.avatar
          ? `${baseUrl}/${updatedUserData.avatar}`
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
