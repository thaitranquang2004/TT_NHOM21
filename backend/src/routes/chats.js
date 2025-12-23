import express from "express";
import { authJWT } from "../middleware/auth.js";
import {
  createChat,
  listChats,
  getChatDetails,
} from "../controllers/chatController.js";

const router = express.Router();

router.post("/create", authJWT, createChat);

router.get("/", authJWT, listChats);

router.get("/:chatId", authJWT, getChatDetails);

export default router;
