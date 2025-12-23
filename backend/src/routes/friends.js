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

router.post("/request", authJWT, sendRequest);

router.get("/requests/incoming", authJWT, getIncomingRequests);

router.put("/request/:requestId/accept", authJWT, acceptRequest);

router.put("/request/:requestId/decline", authJWT, declineRequest);

router.get("/list", authJWT, listFriends);

export default router;
