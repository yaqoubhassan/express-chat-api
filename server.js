const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const messageRoutes = require("./routes/messageRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const userRoutes = require("./routes/userRoutes");
const User = require("./models/userModel");

// Load environment variables
dotenv.config({ path: "./config.env" });

const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// Database Connection
mongoose
  .connect(process.env.LOCAL_CONN_STR)
  .then(() => console.log("✅ MongoDB connected successfully!"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1); // Exit process on DB connection failure
  });

// Static File Serving
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/public", express.static(path.join(__dirname, "public")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/users", userRoutes);

// Start the server
const port = process.env.PORT || 3000;
const server = app.listen(port, "0.0.0.0", () =>
  console.log(`🚀 Server running on port ${port}!`)
);

// Socket.IO Setup
const io = require("socket.io")(server, {
  cors: {
    origin: "*", // Use environment variable for frontend URL
    methods: ["GET", "POST"],
  },
});

require("./realtime")(io);
io.on("connection", (socket) => {
  console.log(`🌐 New WebSocket connection: ${socket.id}`);

  const userId = socket.handshake.query.userId;

  if (userId) {
    console.log("userId: ", userId);
    // Mark user as online
    User.findByIdAndUpdate(userId, { activeStatus: new Date() }).exec();
  }

  // User joins a room based on user ID
  socket.on("joinRoom", (userId) => {
    if (!userId) return;
    console.log(`🔗 User ${userId} joined room`);
    socket.join(userId);
  });

  // Handle new messages
  socket.on("sendMessage", (data) => {
    if (data.receiverId && data.message) {
      console.log(`📩 Message sent to ${data.receiverId}`);
      io.to(data.receiverId).emit("message", data); // Emit to receiver
    }
  });

  // Handle typing events
  socket.on("typing", ({ senderId, receiverId }) => {
    if (receiverId) {
      io.to(receiverId).emit("typing", { senderId });
    }
  });

  socket.on("stopTyping", ({ senderId, receiverId }) => {
    if (receiverId) {
      io.to(receiverId).emit("stopTyping", { senderId });
    }
  });

  // Handle disconnection
  socket.on("disconnect", async () => {
    console.log(`❌ WebSocket disconnected: ${socket.id}`);
    if (userId) {
      await User.findByIdAndUpdate(userId, { activeStatus: new Date() }).exec();
    }
  });
});

// Attach Socket.IO instance to Express app
app.set("socketio", io);

// Graceful Shutdown
process.on("SIGINT", async () => {
  console.log("🛑 Shutting down server...");
  try {
    await mongoose.connection.close();
    console.log("✅ MongoDB connection closed!");
  } catch (err) {
    console.error("❌ Error closing MongoDB connection:", err.message);
  }
  server.close(() => {
    console.log("✅ Server closed successfully!");
    process.exit(0);
  });
});
