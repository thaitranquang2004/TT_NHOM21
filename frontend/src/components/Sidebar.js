import React from "react";
import "./Sidebar.css";

const Sidebar = ({ activeTab, setActiveTab }) => {
  return (
    <div className="sidebar">
      <div
        className={`sidebar-item ${activeTab === "chats" ? "active" : ""}`}
        onClick={() => setActiveTab("chats")}
      >
        <i className="fas fa-comment-alt"></i>
        <span>Chats</span>
      </div>
      <div
        className={`sidebar-item ${activeTab === "friends" ? "active" : ""}`}
        onClick={() => setActiveTab("friends")}
      >
        <i className="fas fa-user-friends"></i>
        <span>Friends</span>
      </div>
      <div
        className={`sidebar-item ${activeTab === "profile" ? "active" : ""}`}
        onClick={() => setActiveTab("profile")}
      >
        <i className="fas fa-user"></i>
        <span>Profile</span>
      </div>

      <div className="sidebar-footer">
        <div
          className="sidebar-item"
          onClick={() => {
            localStorage.clear();
            window.location.href = "/";
          }}
        >
          <i className="fas fa-sign-out-alt"></i>
          <span>Logout</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
