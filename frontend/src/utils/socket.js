// frontend/src/utils/socket.js
import io from "socket.io-client";

const getSocketUrl = () => {
  return process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";
};

export const initSocket = (token) => {
  if (!token) {
    console.log("Band M: No token, skipping Socket init"); // Debug
    return null;
  }
  const socket = io(getSocketUrl(), {
    auth: { token }, // JWT cho Socket auth
    transports: ["websocket"], // ✅ Force WS only – Tránh polling CSP block trên Render
    // Fallback nếu WS fail: transports: ['websocket', 'polling'] (nhưng test WS first)
    timeout: 20000, // Render cold start delay
    upgrade: false, // Không upgrade từ polling (force WS)
  });
  socket.on("connect", () => console.log("Band M Socket connected via WS"));
  socket.on("connect_error", (err) => {
    console.error("Band M Socket error (CSP/WS?):", err.message);
    // Fallback: Re-init với polling nếu WS fail (optional)
    // socket.io.opts.transports = ['polling'];
  });
  return socket;
};

export const disconnectSocket = (socket) => {
  if (socket) {
    socket.disconnect();
    console.log("Band M Socket disconnected");
  }
};
