import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Thêm import này (nếu chưa có React Router)
import api from "../utils/api"; // Giả sử api instance đã config interceptors cho token
import io from "socket.io-client"; // Nếu dùng Socket, import để disconnect (optional)

import "./Login.css"; // Tái sử dụng CSS của Login cho consistent UI

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false); // Thêm state cho loading (UX tốt hơn)
  const navigate = useNavigate(); // Hook để redirect

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
        // Optional: Nếu error 401, auto logout và redirect login
        if (error.response?.status === 401) {
          handleLogout();
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Xử lý thay đổi chung cho các input
  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      // Gửi tất cả dữ liệu có thể cập nhật (loại bỏ username vì không cho sửa)
      const updateData = {
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        dob: user.dob,
      };

      await api.put("/users/profile", updateData);
      alert("Profile updated successfully!");
      // Optional: Refetch profile sau update để sync data
      const response = await api.get("/users/profile");
      setUser(response.data.user);
    } catch (error) {
      alert(
        "Update failed: " + (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  // Thêm hàm handleLogout mới
  const handleLogout = async () => {
    try {
      setLoading(true);
      // Gọi API logout (backend sẽ invalidate nếu cần)
      await api.post("/auth/logout");

      // Clear tokens ở frontend
      localStorage.removeItem("accessToken"); // Hoặc sessionStorage nếu dùng
      localStorage.removeItem("refreshToken");

      // Clear user session data
      localStorage.removeItem("session"); // Nếu bạn lưu session object

      // Disconnect Socket.io nếu đang connect (giả sử có global socket)
      // const socket = io(); // Hoặc từ context: socket.disconnect();
      // socket.disconnect();

      // Redirect về trang login
      navigate("/"); // Thay bằng route login của bạn, ví dụ "/"
    } catch (error) {
      // Nếu API fail, vẫn clear frontend và redirect (an toàn hơn)
      localStorage.clear(); // Clear all để chắc chắn
      navigate("/login");
      alert("Logged out, but server error occurred: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Hiển thị loading
  if (loading) {
    return (
      <div className="login-container">
        <div className="loading-spinner">Processing...</div>
      </div>
    );
  }

  // Nếu chưa load user
  if (!user) {
    return (
      <div className="login-container">
        <div className="loading-spinner">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <form onSubmit={handleUpdate} className="login-form">
        <h1 className="login-title">Band M Profile</h1>

        {/* Avatar placeholder (có thể nâng cấp với Cloudinary URL sau) */}
        <div className="profile-avatar-placeholder">
          {user.username ? user.username[0].toUpperCase() : "U"}
        </div>

        {/* Username (Không cho sửa) */}
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

        {/* Full Name */}
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

        {/* Email */}
        <div className="input-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            className="login-input"
            value={user.email || ""}
            onChange={handleChange}
          />
        </div>

        {/* Phone */}
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

        {/* DOB */}
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

        {/* Nút Update Profile */}
        <button
          type="submit"
          className="login-button"
          disabled={loading}
          style={{ backgroundColor: "#28a745" }}
        >
          {loading ? "Updating..." : "Update Profile"}
        </button>

        {/* THÊM NÚT LOGOUT MỚI - Đặt ở dưới cùng, màu đỏ để nổi bật */}
        <button
          type="button" // Không submit form
          onClick={handleLogout}
          className="login-button"
          disabled={loading}
          style={{
            backgroundColor: "#dc3545", // Màu đỏ cho logout
            marginTop: "10px",
          }}
        >
          {loading ? "Logging out..." : "Logout"}
        </button>
      </form>
    </div>
  );
};

export default Profile;
