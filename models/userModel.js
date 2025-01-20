const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    require: [true, "The name field is required"],
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
    required: true,
  },
  avatar: {
    type: String,
    get: (value) => {
      // Return null if no profile picture exists
      if (!value) return null;
      // Ensure the path uses a URL-friendly format
      return `/uploads/${value.replace(/^.*[\\/]/, "")}`;
    },
  },
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

//Compare password for login
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
