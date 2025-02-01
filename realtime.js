module.exports = (io) => {
  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) {
      onlineUsers.set(userId, socket.id);
      io.emit("userStatusChange", Array.from(onlineUsers.keys()));
    }

    socket.on("disconnect", () => {
      onlineUsers.delete(userId);
      io.emit("userStatusChange", Array.from(onlineUsers.keys()));
    });
  });
};
