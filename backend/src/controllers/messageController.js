import Message from "../models/Message.js";
import Chat from "../models/Chat.js";
import User from "../models/User.js";
import cloudinary from "cloudinary";
import { v2 as cloudinaryV2 } from "cloudinary";
import fs from "fs";
import CryptoJS from "crypto-js";

// Helper to decrypt
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

// Load messages
export const getMessages = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const chat = await Chat.findById(req.params.chatId);
    if (!chat || !chat.participants.includes(req.user._id))
      return res.status(404).json({ message: "Chat not found" });

    const messages = await Message.find({
      chat: req.params.chatId,
      deletedAt: null,
    })
      .populate("sender", "username fullName avatar")
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));

    // Decrypt messages
    const decryptedMessages = messages.map((msg) => {
      const msgObj = msg.toObject();
      if (msgObj.type === "text") {
        msgObj.content = decryptMessage(msgObj.content);
      }
      return msgObj;
    });

    const hasMore = messages.length === parseInt(limit);
    res.json({ messages: decryptedMessages.reverse(), hasMore });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Send message
export const sendMessage = async (req, res) => {
  try {
    const { chatId, content, type = "text" } = req.body;
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(req.user._id))
      return res.status(400).json({ message: "Invalid chat" });

    let mediaUrl;
    if (req.file && type === "media") {
      const result = await cloudinaryV2.uploader.upload(req.file.path, {
        folder: "bandm/media",
      });
      mediaUrl = result.secure_url;
      // Xóa file temp
      fs.unlinkSync(req.file.path);
    }

    const message = new Message({
      chat: chatId,
      sender: req.user._id,
      content, // Will be encrypted by pre-save hook
      type,
      mediaUrl,
    });
    await message.save();

    // Update unread for others
    chat.participants.forEach(async (participant) => {
      if (participant.toString() !== req.user._id.toString()) {
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

    // Emit real-time (Use ORIGINAL content, not encrypted one from DB)
    req.io?.to(`chat_${chatId}`).emit("newMessage", {
      id: message._id,
      content: content, // Use plain text content from request
      sender: populatedMessage.sender,
      type,
      mediaUrl,
      createdAt: message.createdAt,
    });

    res.json({ messageId: message._id, message: "Sent" });
  } catch (err) {
    // Cleanup
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: "Server error" });
  }
};

// Edit message
export const editMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message || message.sender.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not owner" });

    message.content = req.body.content; // Will be re-encrypted on save
    message.isEdited = true;
    await message.save();

    req.io?.to(`chat_${message.chat}`).emit("messageEdited", {
      messageId: message._id,
      content: req.body.content, // Emit plain text
    });

    res.json({ message: "Edited" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// Delete message
export const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message || message.sender.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not owner" });

    message.deletedAt = new Date();
    await message.save();

    req.io
      ?.to(`chat_${message.chat}`)
      .emit("messageDeleted", { messageId: message._id });

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
