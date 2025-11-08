import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    fullName: "",
    email: "",
    phone: "",
    dob: "",
  });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/auth/register", formData);
      alert("Register success! Please login.");
      navigate("/");
    } catch (error) {
      alert(
        "Register failed: " + (error.response?.data?.message || error.message)
      );
    }
  };

  return (
    <div style={{ padding: "50px", maxWidth: "400px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
        Band M Register
      </h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={formData.username}
          onChange={(e) =>
            setFormData({ ...formData, username: e.target.value })
          }
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
          placeholder="Password (min 8)"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "10px",
            border: "1px solid #ccc",
          }}
          required
        />
        <input
          type="text"
          placeholder="Full Name"
          value={formData.fullName}
          onChange={(e) =>
            setFormData({ ...formData, fullName: e.target.value })
          }
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "10px",
            border: "1px solid #ccc",
          }}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "10px",
            border: "1px solid #ccc",
          }}
          required
        />
        <input
          type="tel"
          placeholder="Phone (optional)"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "10px",
            border: "1px solid #ccc",
          }}
        />
        <input
          type="date"
          placeholder="DOB (optional)"
          value={formData.dob}
          onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
          style={{
            width: "100%",
            padding: "10px",
            marginBottom: "10px",
            border: "1px solid #ccc",
          }}
        />
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "10px",
            background: "#28a745",
            color: "white",
            border: "none",
          }}
        >
          Register
        </button>
      </form>
    </div>
  );
};

export default Register;
