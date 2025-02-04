const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "The name field is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "The email field is required"],
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, "The password field is required"],
  },
  avatar: {
    type: String,
    default: "assets/images/avatar.png",
    get: (value) => {
      // Return null if no profile picture exists
      if (!value) return null;
      // Ensure the path uses a URL-friendly format
      return `uploads/${value.replace(/^.*[\\/]/, "")}`;
    },
  },
  verified: {
    type: Boolean,
    default: false,
  },
  otp: {
    type: String,
  },
  otpExpires: {
    type: Date,
  },
  activeStatus: { type: Date, default: Date.now },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

//Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password; // Exclude password
  return user;
};

//Compare password for login
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
