import Message from "../../models/Message.js";
import Chat from "../../models/Chat.js";
import User from "../../models/User.js";
import CryptoJS from "crypto-js";

// Helper to decrypt - handle both encrypted and plain text
const decryptMessage = (content) => {
  try {
    const bytes = CryptoJS.AES.decrypt(
      content,
      process.env.ENCRYPT_SECRET || "default_secret"
    );
    return bytes.toString(CryptoJS.enc.Utf8) || content;
  } catch (e) {
    return content;
  }
};

export const chatHandler = (io, socket) => {
  const handleSendMessage = async (data) => {
    try {
      const { chatId, content, type = "text" } = data;
      const userId = socket.user._id;

      const chat = await Chat.findById(chatId);
      if (!chat || !chat.participants.includes(userId)) {
        return socket.emit("error", { message: "Invalid chat" });
      }

      const message = new Message({
        chat: chatId,
        sender: userId,
        content,
        type,
      });
      await message.save();

      // Update unread for others
      chat.participants.forEach(async (participant) => {
        if (participant.toString() !== userId.toString()) {
          await User.findByIdAndUpdate(participant, {
            $inc: { [`unreadCounts.${chatId}`]: 1 },
          });
        }
      });

      // Populate sender for emit
      const populatedMessage = await Message.findById(message._id).populate(
        "sender",
        "username fullName avatar"
      );

      const messageData = {
        _id: message._id,
        id: message._id,
        chat: chatId,
        content: content,
        sender: populatedMessage.sender,
        type,
        createdAt: message.createdAt,
      };

      // Broadcast to everyone in the room (including sender)
      io.to(`chat_${chatId}`).emit("newMessage", messageData);
      
    } catch (err) {
      console.error("Socket sendMessage error:", err);
      socket.emit("error", { message: "Failed to send message" });
    }
  };

  const handleEditMessage = async (data) => {
    try {
      const { messageId, content } = data;
      const userId = socket.user._id;

      const message = await Message.findById(messageId);
      if (!message || message.sender.toString() !== userId.toString()) {
        return socket.emit("error", { message: "Not authorized to edit this message" });
      }

      message.content = content;
      message.isEdited = true;
      await message.save();

      io.to(`chat_${message.chat}`).emit("messageEdited", {
        messageId: message._id,
        content: content,
      });
    } catch (err) {
      console.error("Socket editMessage error:", err);
      socket.emit("error", { message: "Failed to edit message" });
    }
  };

  const handleDeleteMessage = async (data) => {
    try {
      const { messageId } = data;
      const userId = socket.user._id;

      const message = await Message.findById(messageId);
      if (!message || message.sender.toString() !== userId.toString()) {
        return socket.emit("error", { message: "Not authorized to delete this message" });
      }

      message.deletedAt = new Date();
      await message.save();

      io.to(`chat_${message.chat}`).emit("messageDeleted", { messageId: message._id });
    } catch (err) {
      console.error("Socket deleteMessage error:", err);
      socket.emit("error", { message: "Failed to delete message" });
    }
  };

  const handleReactMessage = async (data) => {
    try {
      const { messageId, type } = data;
      const userId = socket.user._id;

      const message = await Message.findById(messageId);
      if (!message) {
        return socket.emit("error", { message: "Message not found" });
      }

      // Check if user already reacted with this type
      const existingReactionIndex = message.reactions.findIndex(
        (r) => r.user.toString() === userId.toString() && r.type === type
      );

      if (existingReactionIndex > -1) {
        // Remove reaction (toggle off)
        message.reactions.splice(existingReactionIndex, 1);
      } else {
        // Add reaction
        message.reactions.push({ user: userId, type });
      }

      await message.save();

      const populatedMessage = await Message.findById(messageId).populate(
        "reactions.user",
        "username fullName avatar"
      );

      const reactionData = {
        messageId,
        reactions: populatedMessage.reactions,
      };

      io.to(`chat_${message.chat}`).emit("messageReactionUpdate", reactionData);
    } catch (err) {
      console.error("Socket reactMessage error:", err);
      socket.emit("error", { message: "Failed to react to message" });
    }
  };

  const handleDeleteChat = async (data) => {
    try {
      const { chatId } = data;
      const userId = socket.user._id;

      const chat = await Chat.findById(chatId);
      if (!chat) {
        return socket.emit("error", { message: "Chat not found" });
      }

      // Check permissions (e.g., must be a participant)
      if (!chat.participants.includes(userId)) {
        return socket.emit("error", { message: "Not authorized" });
      }

      // Delete all messages
      await Message.deleteMany({ chat: chatId });
      
      // Delete the chat document
      await Chat.findByIdAndDelete(chatId);

      // Notify all participants
      chat.participants.forEach(pId => {
          io.to(`user_${pId}`).emit("chatDeleted", { chatId });
      });

    } catch (err) {
      console.error("Socket deleteChat error:", err);
      socket.emit("error", { message: "Failed to delete chat" });
    }
  };

  const handleJoinChat = (chatId) => {
      socket.join(`chat_${chatId}`);
  };

  const handleMarkChatRead = async (data) => {
    try {
      const { chatId } = data;
      const userId = socket.user._id;

      // Set unread count to 0 (or remove key)
      await User.findByIdAndUpdate(userId, {
        $unset: { [`unreadCounts.${chatId}`]: "" }
      });

      socket.emit("unreadCountsUpdated", { chatId });

    } catch (err) {
      console.error("Socket markRead error:", err);
    }
  };

  const handleCreateChat = async (data) => {
    try {
      const { type, participants } = data; // participants is array of IDs excluding current user
      const userId = socket.user._id;

      let chat;

      if (type === 'direct' && participants.length === 1) {
        const otherId = participants[0];
        // Check if direct chat already exists
        chat = await Chat.findOne({
          type: 'direct',
          participants: { $all: [userId, otherId] },
        });
      }

      if (!chat) {
        chat = new Chat({
          type: type || 'direct',
          participants: [...participants, userId], // Add current user
          admin: userId, 
        });
        await chat.save();
        
        // Notify all participants about the new chat
        chat.participants.forEach(pId => {
            io.to(`user_${pId}`).emit("chatCreated", { chatId: chat._id });
        });
      } else {
        // Chat already exists, just notify the creator
        socket.emit("chatCreated", { chatId: chat._id });
      }

    } catch (err) {
      console.error("Socket createChat error:", err);
      socket.emit("error", { message: "Failed to create/fetch chat" });
    }
  };

  const handleGetChats = async () => {
    try {
        const userId = socket.user._id;
        const chats = await Chat.find({ participants: userId })
            .populate("participants", "username fullName avatar email")
            .sort({ updatedAt: -1 });
        
        socket.emit("chatsFetched", { chats });
    } catch (err) {
        console.error("Socket getChats error:", err);
        socket.emit("error", { message: "Failed to fetch chats" });
    }
  };

  const handleGetMessages = async (data) => {
    try {
        const { chatId } = data;
        const userId = socket.user._id;
        
        // ensure user is in chat
        const chat = await Chat.findById(chatId);
        if (!chat || !chat.participants.includes(userId)) {
             return socket.emit("error", { message: "Not authorized" });
        }

        const messages = await Message.find({ chat: chatId, deletedAt: null })
            .populate("sender", "username fullName avatar")
            .sort({ createdAt: -1 })
            .limit(50);
        
        // Smart decrypt - handle both encrypted and plain text
        const processedMessages = messages.map((msg) => {
          const msgObj = msg.toObject();
          if (msgObj.type === "text" && msgObj.content) {
            const decrypted = decryptMessage(msgObj.content);
            if (decrypted && decrypted.length > 0 && decrypted !== msgObj.content) {
              msgObj.content = decrypted;
            }
          }
          return msgObj;
        });
        
        socket.emit("messagesFetched", { chatId, messages: processedMessages.reverse() });
    } catch (err) {
        console.error("Socket getMessages error:", err);
        socket.emit("error", { message: "Failed to fetch messages" });
    }
  };

  const handleGetChatDetails = async (data) => {
    try {
        const { chatId } = data;
        const userId = socket.user._id;
        
        const chat = await Chat.findById(chatId)
            .populate("participants", "username fullName avatar email");
            
        if (!chat || !chat.participants.some(p => p._id.toString() === userId.toString())) {
             return socket.emit("error", { message: "Not authorized" });
        }

        socket.emit("chatDetailsFetched", { chat });
    } catch (err) {
        console.error("Socket getChatDetails error:", err);
        socket.emit("error", { message: "Failed to fetch chat details" });
    }
  };

  socket.on("sendMessage", handleSendMessage);
  socket.on("editMessage", handleEditMessage);
  socket.on("deleteMessage", handleDeleteMessage);
  socket.on("reactMessage", handleReactMessage);
  socket.on("joinChat", handleJoinChat);
  socket.on("deleteChat", handleDeleteChat);
  socket.on("markChatRead", handleMarkChatRead);
  socket.on("createChat", handleCreateChat);
  socket.on("getChats", handleGetChats);
  socket.on("getMessages", handleGetMessages);
  socket.on("getChatDetails", handleGetChatDetails);
};