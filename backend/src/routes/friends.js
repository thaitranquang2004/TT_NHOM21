import express from "express";
import { authJWT } from "../middleware/auth.js";
import {
  sendRequest,
  getIncomingRequests,
  acceptRequest,
  declineRequest,
  listFriends,
} from "../controllers/friendController.js";

const router = express.Router();

// Send request
router.post("/request", authJWT, sendRequest);

// Incoming requests
router.get("/requests/incoming", authJWT, getIncomingRequests);

// Accept
router.put("/request/:requestId/accept", authJWT, acceptRequest);

// Decline
router.put("/request/:requestId/decline", authJWT, declineRequest);

// List friends
router.get("/list", authJWT, listFriends);

export default router;
