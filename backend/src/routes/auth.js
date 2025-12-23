import express from "express";
import { body, validationResult } from "express-validator";
import { authJWT } from "../middleware/auth.js";
import {
  register,
  login,
  logout,
  refreshToken,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.post("/logout", authJWT, logout);

router.post("/refresh", refreshToken);

export default router;
