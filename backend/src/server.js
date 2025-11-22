import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { v2 as cloudinaryV2 } from "cloudinary";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import cookieParser from "cookie-parser";

dotenv.config();

// Cloudinary config
cloudinaryV2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// ==================== FIX CORS & SOCKET.IO TRIỆT ĐỂ CHO LOCAL + RENDER ====================
const allowedOrigins = [
  "http://localhost:3000",                    // Local dev
  "http://localhost:5000",                    // Local prod (served by backend)
  "https://band-m-chat.onrender.com",         // Frontend Render
];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
};

// Áp dụng CORS cho Express
app.use(cors(corsOptions));

// Socket.io config HOÀN HẢO (fix transport close forever)
const io = new Server(server, {
  path: "/socket.io/",                        // BẮT BUỘC PHẢI CÓ!
  cors: corsOptions,                          // Đồng bộ với Express CORS
  transports: ["websocket"],                  // Chỉ dùng websocket (Render yêu cầu)
  pingTimeout: 60000,
  pingInterval: 25000,
});

console.log("Socket.io khởi tạo thành công với path: /socket.io/");

// Connect MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB error:", err);
    process.exit(1);
  });

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Tắt helmet CSP vì frontend tự handle
}));
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import friendRoutes from "./routes/friends.js";
import chatRoutes from "./routes/chats.js";
import messageRoutes from "./routes/messages.js";
import reactionRoutes from "./routes/reactions.js";

app.use("/api/auth", limiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", limiter, messageRoutes);
app.use("/api/reactions", reactionRoutes);

// Socket setup
import("./sockets/index.js").then(({ default: setupSockets }) => {
  setupSockets(io);
});

// Error Handler
import { errorHandler } from "./middleware/errorHandler.js";
app.use(errorHandler);

// Production serve frontend
if (process.env.NODE_ENV === "production") {
  const frontendDistPath = path.join(__dirname, "../../frontend/build");
  
  if (fs.existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath));
    
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api") || req.path.startsWith("/socket.io")) {
        return res.status(404).json({ message: "Not found" });
      }
      res.sendFile(path.join(frontendDistPath, "index.html"));
    });
  } else {
    console.error("Frontend build not found! Run: cd frontend && npm run build");
  }
}

// 404 cuối cùng
app.use((req, res) => {
  res.status(404).json({ message: "API Route Not Found" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Band M Backend chạy mượt trên port ${PORT}`);
  console.log(`   Local: http://localhost:${PORT}`);
  if (process.env.RENDER_EXTERNAL_URL) {
    console.log(`   Render: ${process.env.RENDER_EXTERNAL_URL}`);
  }
});