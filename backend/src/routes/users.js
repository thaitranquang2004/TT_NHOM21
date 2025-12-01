import express from "express";
import multer from "multer";
import { authJWT } from "../middleware/auth.js";
import {
  validateProfileUpdate,
  validateUserSearch,
} from "../middleware/validate.js";
import {
  getProfile,
  updateProfile,
  searchUsers,
} from "../controllers/userController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Get profile
router.get("/profile", authJWT, getProfile);

// Update profile
router.put(
  "/profile",
  authJWT,
  upload.single("avatar"),
  validateProfileUpdate,
  updateProfile
);

// Search users
router.get("/search", authJWT, validateUserSearch, searchUsers);

export default router;
