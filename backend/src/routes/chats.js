import express from "express";
import { authJWT } from "../middleware/auth.js";
import {
  createChat,
  listChats,
  getChatDetails,
} from "../controllers/chatController.js";

const router = express.Router();

// Create chat
router.post("/create", authJWT, createChat);

// List chats
router.get("/", authJWT, listChats);

// Get chat details
router.get("/:chatId", authJWT, getChatDetails);

export default router;
