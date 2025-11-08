import io from "socket.io-client";

const socket = io(process.env.REACT_APP_API_URL || "/"); // Relative cho Render prod

// Auth Socket với JWT
socket.auth = { token: localStorage.getItem("token") };

export default socket;
