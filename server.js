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
app.use(cors());

//Database Connection
mongoose
  .connect(process.env.LOCAL_CONN_STR)
  .then(() => console.log("MongoDB Connected!"))
  .catch((err) => console.log(err));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/public", express.static(path.join(__dirname, "public")));

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/users", userRoutes);

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () =>
  console.log(`Server running on port ${port}!`)
);
