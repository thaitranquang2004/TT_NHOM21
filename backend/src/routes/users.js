import express from "express";
import multer from "multer";
import { authJWT } from "../middleware/auth.js";
import {
  getProfile,
  updateProfile,
  searchUsers,
} from "../controllers/userController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.get("/profile", authJWT, getProfile);

router.put(
  "/profile",
  authJWT,
  upload.single("avatar"),
  updateProfile
);

router.get("/search", authJWT, searchUsers);

export default router;
