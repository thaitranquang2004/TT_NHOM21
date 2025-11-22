// frontend/src/utils/socket.js
import io from "socket.io-client";

let socket = null;

const getSocketUrl = () => {
  const url = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";
  if (url.startsWith("http") || url.startsWith("ws")) return url;
  return process.env.NODE_ENV === "production" ? `https://${url}` : `http://${url}`;
};

export const initSocket = (token) => {
  if (!token) {
    console.log("Band M: No token → disconnect socket");
    disconnectSocket();
    return null;
  }

  if (socket?.connected) {
    socket.disconnect();
  }

  const socketUrl = getSocketUrl();
  console.log("Band M: Đang kết nối socket tới →", socketUrl);

  socket = io(socketUrl, {
    auth: { token: `Bearer ${token}` },
    transports: ["websocket"],
    upgrade: false,                    // Quan trọng: không cho phép fallback polling
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    timeout: 30000,
    forceNew: true,
    withCredentials: true,
    path: "/socket.io/",
  });

  socket.on("connect", () => {
    console.log("✅ BAND M SOCKET CONNECTED MƯỢT MÀ:", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.error("Socket connect_error:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};

export { socket };