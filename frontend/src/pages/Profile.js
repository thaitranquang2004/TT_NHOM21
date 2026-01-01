import React, { useState, useEffect } from "react";
import api from "../utils/api";
import "./Login.css";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get("/users/profile");
        setUser(response.data.user);
      } catch (error) {
        alert(
          "Profile load failed: " +
            (error.response?.data?.message || error.message)
        );
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setImageError(false); // Reset error when new file selected
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append("fullName", user.fullName);
      formData.append("email", user.email);
      formData.append("phone", user.phone || "");
      formData.append("dob", user.dob || "");
      
      if (selectedFile) {
        formData.append("avatar", selectedFile);
      }

      await api.put("/users/profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Profile updated successfully!");
      setSelectedFile(null);
      setPreviewUrl(null); 
      setImageError(false); // Reset error state
      
      // Force re-fetch to ensure we get the latest avatar
      const profileResponse = await api.get("/users/profile");
      setUser(profileResponse.data.user);

    } catch (error) {
      alert(
        "Update failed: " + (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="login-container">
        <div className="loading-spinner">Loading profile...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="login-container">
      <form onSubmit={handleUpdate} className="login-form">
        <div className="profile-avatar-section">
            <div className="profile-avatar-placeholder" onClick={() => document.getElementById('avatar-input').click()} style={{cursor: 'pointer', overflow: 'hidden'}}>
            {previewUrl ? (
                <img src={previewUrl} alt="Preview" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
            ) : (user.avatar && !imageError) ? (
                <img 
                    key={user.avatar} 
                    src={user.avatar} 
                    alt={user.fullName} 
                    style={{width: '100%', height: '100%', objectFit: 'cover'}}
                    onError={(e) => {
                      console.error("Avatar failed to load:", user.avatar);
                      setImageError(true); // Set error state to show fallback
                    }}
                    onLoad={() => {
                      console.log("Avatar loaded successfully:", user.avatar);
                    }}
                />
            ) : (
                 <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', color: '#fff'}}>
                    {user.username ? user.username[0].toUpperCase() : "U"}
                </div>
            )}
            </div>
            <input 
                type="file" 
                id="avatar-input" 
                accept="image/*" 
                onChange={handleFileChange} 
                style={{display: 'none'}}
            />
            <p style={{textAlign: 'center', fontSize: '0.8rem', color: '#888', marginTop: '5px'}}>Click avatar to change</p>
        </div>

        <div className="input-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            className="login-input"
            value={user.username || ""}
            disabled
          />
        </div>

        <div className="input-group">
          <label htmlFor="fullName">Full Name</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            className="login-input"
            value={user.fullName || ""}
            onChange={handleChange}
          />
        </div>

        <div className="input-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            className="login-input"
            value={user.email || ""}
            onChange={handleChange}
            disabled
          />
        </div>

        <div className="input-group">
          <label htmlFor="phone">Phone</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            className="login-input"
            value={user.phone || ""}
            onChange={handleChange}
          />
        </div>

        <div className="input-group">
          <label htmlFor="dob">Date of Birth</label>
          <input
            type="date"
            id="dob"
            name="dob"
            className="login-input"
            value={
              user.dob ? new Date(user.dob).toISOString().split("T")[0] : ""
            }
            onChange={handleChange}
          />
        </div>

        <button
          type="submit"
          className="login-button"
          disabled={loading}
          style={{ backgroundColor: "#28a745" }}
        >
          {loading ? "Updating..." : "Update Profile"}
        </button>
      </form>
    </div>
  );
};

export default Profile;
