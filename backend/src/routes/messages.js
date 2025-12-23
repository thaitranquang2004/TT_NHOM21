import express from "express";
import multer from "multer";
import { authJWT } from "../middleware/auth.js";
import {
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  reactToMessage,
} from "../controllers/messageController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.get("/:chatId", authJWT, getMessages);

router.post("/send", authJWT, upload.single("media"), sendMessage);

router.put("/:messageId", authJWT, editMessage);

router.delete("/:messageId", authJWT, deleteMessage);

router.post("/:messageId/react", authJWT, reactToMessage);

export default router;
