import React from "react";
import { MessageCircle, Users, User, LogOut } from "lucide-react";
import "./Sidebar.css";

const Sidebar = ({ activeTab, setActiveTab }) => {
  return (
    <div className="sidebar">
      <div
        className={`sidebar-item ${activeTab === "chats" ? "active" : ""}`}
        onClick={() => setActiveTab("chats")}
        title="Chats"
      >
        <MessageCircle size={24} />
      </div>
      <div
        className={`sidebar-item ${activeTab === "friends" ? "active" : ""}`}
        onClick={() => setActiveTab("friends")}
        title="Friends"
      >
        <Users size={24} />
      </div>
      <div
        className={`sidebar-item ${activeTab === "profile" ? "active" : ""}`}
        onClick={() => setActiveTab("profile")}
        title="Profile"
      >
        <User size={24} />
      </div>

      <div className="sidebar-footer">
        <div
          className="sidebar-item logout-button"
          onClick={() => {
            localStorage.clear();
            window.location.href = "/";
          }}
          title="Logout"
        >
          <LogOut size={24} />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
