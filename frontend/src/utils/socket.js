// frontend/src/utils/socket.js
import io from "socket.io-client";

let socket = null; // Singleton instance – global để reuse

const getSocketUrl = () => {
  return process.env.REACT_APP_SOCKET_URL || "http://localhost:5000"; // Hoặc REACT_APP_BACKEND_URL nếu unify
};

// Init hoặc re-init socket với token mới (gọi khi login/refresh token)
export const initSocket = (token) => {
  if (!token) {
    console.log("Band M: No token, skipping Socket init");
    disconnectSocket(); // Cleanup nếu token hết hạn
    return null;
  }

  // Nếu socket đã connect với token cũ, disconnect trước
  if (socket && socket.connected) {
    disconnectSocket();
  }

  socket = io(getSocketUrl(), {
    auth: { token }, // JWT cho Socket auth (backend verify ở middleware)
    transports: ["websocket"], // Force WS only – Tránh polling CSP block trên Render
    timeout: 20000, // Handle Render cold start delay
    upgrade: false, // Không upgrade từ polling (force WS pure)
  });

  socket.on("connect", () => {
    console.log("Band M Socket connected via WS:", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.error("Band M Socket connect_error (CSP/WS fail?):", err.message);
    // Optional fallback: Re-init với polling nếu WS fail (uncomment nếu cần)
    // disconnectSocket();
    // socket = io(getSocketUrl(), { ... , transports: ['polling'] });
  });

  socket.on("disconnect", (reason) => {
    console.log("Band M Socket disconnected:", reason);
  });

  return socket; // Return instance để dùng ngay nếu cần
};

// Disconnect và cleanup
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log("Band M Socket fully disconnected & cleaned");
  }
};

// Getter để export default instance (singleton) – Khớp với import default ở components
export default socket; // Default export: import socket from '../utils/socket'; sẽ lấy instance này
