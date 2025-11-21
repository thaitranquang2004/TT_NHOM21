import express from "express";
import { authJWT } from "../middleware/auth.js";
import {
  createChat,
  inviteToGroup,
  listChats,
} from "../controllers/chatController.js";

const router = express.Router();

// Create chat
router.post("/create", authJWT, createChat);

// Invite to group
router.post("/:chatId/invite", authJWT, inviteToGroup);

// List chats (preview)
router.get("/", authJWT, listChats);

export default router;
