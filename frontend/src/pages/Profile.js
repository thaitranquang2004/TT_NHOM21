import React, { useState, useEffect } from "react";
import api from "../utils/api";

const Profile = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/users/profile");
        setUser(response.data.user);
      } catch (error) {
        alert("Profile load failed");
      }
    };
    fetchProfile();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put("/users/profile", { fullName: user.fullName }); // Update example
      alert("Profile updated!");
    } catch (error) {
      alert("Update failed");
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div style={{ padding: "50px", maxWidth: "400px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", marginBottom: "20px" }}>
        Band M Profile
      </h1>
      <p>
        <strong>Username:</strong> {user.username}
      </p>
      <p>
        <strong>Full Name:</strong>{" "}
        <input
          type="text"
          value={user.fullName || ""}
          onChange={(e) => setUser({ ...user, fullName: e.target.value })}
        />
      </p>
      <p>
        <strong>Email:</strong> {user.email}
      </p>
      <p>
        <strong>Phone:</strong> {user.phone}
      </p>
      <button
        onClick={handleUpdate}
        style={{
          padding: "10px",
          background: "#28a745",
          color: "white",
          border: "none",
        }}
      >
        Update
      </button>
    </div>
  );
};

export default Profile;
