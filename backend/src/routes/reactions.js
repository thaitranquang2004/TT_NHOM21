import express from "express";
import { authJWT } from "../middleware/auth.js";
import { addReaction, markSeen } from "../controllers/reactionController.js";

const router = express.Router();

// Add reaction
router.post("/:messageId/reaction", authJWT, addReaction);

// Mark seen
router.put("/:messageId/seen", authJWT, markSeen);

export default router;
