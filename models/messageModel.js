const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true, // Index for faster lookup
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["text", "image", "video", "audio"], // Define message types
      default: "text",
    },
    content: {
      type: String,
      required: function () {
        return this.type === "text";
      },
    },
    media: {
      type: String, // URL for image or video
      required: function () {
        return this.type === "image" || this.type === "video";
      },
    },
    audioDuration: {
      type: String, // Duration of the audio file
      required: function () {
        return this.type === "audio";
      },
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date, // Timestamp of when the message was read
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
