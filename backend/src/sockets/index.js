// backend/sockets/index.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Chat from "../models/Chat.js";

export default (io) => {
  // ==================== MIDDLEWARE VERIFY JWT ====================
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const bearerToken = token.startsWith("Bearer ") ? token.slice(7) : token;

      const decoded = jwt.verify(bearerToken, process.env.JWT_SECRET);
      
      // Fetch full user from DB to ensure we have username, avatar, etc.
      const user = await User.findById(decoded.id).select("-password");
      
      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      socket.user = user; // Attach full mongoose document
      next();
    } catch (err) {
      console.error("Socket auth failed:", err.message);
      next(new Error("Authentication error: Invalid token"));
    }
  });

  // ==================== CONNECTION ====================
  io.on("connection", async (socket) => {
    console.log(`✅ User connected: ${socket.user.username} (${socket.id})`);

    try {
      // Join user room
      socket.join(`user_${socket.user._id.toString()}`);

      // Update online status
      await User.findByIdAndUpdate(socket.user._id, { onlineStatus: true });
      io.emit("userOnline", { userId: socket.user._id, online: true });

      // ==================== JOIN CHATS ====================
      socket.on("joinMyChats", async () => {
        try {
          const userChats = await Chat.find({ participants: socket.user._id }).select("_id");
          userChats.forEach((chat) => {
            socket.join(`chat_${chat._id}`);
          });
        } catch (err) {
          console.error("Error joining chats:", err);
        }
      });

      // ==================== NEW MESSAGE ====================
      socket.on("newMessage", (data) => {
        const { chatId, message } = data;
        
        const messageData = {
          ...message,
          sender: {
            _id: socket.user._id,
            username: socket.user.username,
            fullName: socket.user.fullName,
            avatar: socket.user.avatar,
          },
        };

        // Broadcast to others in room
        socket.to(`chat_${chatId}`).emit("newMessage", messageData);
        
        // Emit back to sender (optional, if frontend doesn't optimistically update)
        socket.emit("newMessage", messageData);
      });

      // ==================== TYPING ====================
      socket.on("typing", ({ chatId, isTyping }) => {
        socket.to(`chat_${chatId}`).emit("userTyping", {
          userId: socket.user._id,
          username: socket.user.username,
          isTyping,
        });
      });

      // ==================== DISCONNECT ====================
      socket.on("disconnect", async () => {
        console.log(`User disconnected: ${socket.user.username}`);
        try {
          await User.findByIdAndUpdate(socket.user._id, { 
            onlineStatus: false,
            lastSeen: new Date()
          });
          io.emit("userOffline", { userId: socket.user._id, online: false });
        } catch (err) {
          console.error("Disconnect error:", err);
        }
      });

    } catch (err) {
      console.error("Socket connection error:", err);
      socket.disconnect();
    }
  });
};