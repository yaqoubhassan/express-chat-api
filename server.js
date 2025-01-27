const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const messageRoutes = require("./routes/messageRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const userRoutes = require("./routes/userRoutes");

dotenv.config({ path: "./config.env" });
const app = express();

app.use(express.json());
app.use(cors({ origin: "*" })); // Replace with actual frontend URL

// Database Connection
mongoose
  .connect(process.env.LOCAL_CONN_STR)
  .then(() => console.log("MongoDB Connected!"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/public", express.static(path.join(__dirname, "public")));

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/users", userRoutes);

const port = process.env.PORT || 3000;
const server = app.listen(port, "0.0.0.0", () =>
  console.log(`Server running on port ${port}!`)
);

// Socket.IO Setup
const io = require("socket.io")(server, {
  cors: {
    origin: "*", // Replace with actual frontend URL
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("New WebSocket connection:", socket.id);

  // Join a room based on user ID
  socket.on("joinRoom", (userId) => {
    console.log(`User ${userId} joined room`);
    socket.join(userId);
  });

  // Handle new messages
  socket.on("sendMessage", (data) => {
    io.to(data.receiverId).emit("message", data); // Emit to receiver
    // io.to(data.senderId).emit("message", data); // Emit to sender
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("WebSocket disconnected:", socket.id);
  });
});

app.set("socketio", io);

// Graceful Shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down server...");
  await mongoose.connection.close();
  server.close(() => {
    console.log("Server closed!");
    process.exit(0);
  });
});
