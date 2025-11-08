import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/auth/login", { username, password });
      localStorage.setItem("token", response.data.accessToken); // JWT
      localStorage.setItem("user", JSON.stringify(response.data.user)); // User data
      navigate("/friends"); // Redirect to friends
    } catch (error) {
      alert(
        "Login failed: " + (error.response?.data?.message || error.message)
      );
    }
  };

  return (
    <div style={{ padding: "50px", maxWidth: "400px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
        Band M Login
      </h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "10px",
            border: "1px solid #ccc",
          }}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "10px",
            border: "1px solid #ccc",
          }}
          required
        />
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "10px",
            background: "#007bff",
            color: "white",
            border: "none",
          }}
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;
