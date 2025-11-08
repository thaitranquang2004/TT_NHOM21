import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";

const Chats = () => {
  const [chats, setChats] = useState([]);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await api.get("/chats"); // List chats with unread count
        setChats(response.data.chats);
      } catch (error) {
        alert("Chats load failed");
      }
    };
    fetchChats();
  }, []);

  const createChat = async () => {
    try {
      const response = await api.post("/chats/create", {
        type: "direct",
        participants: ["userId1"],
      }); // Example
      setChats((prev) => [...prev, response.data.chat]);
    } catch (error) {
      alert("Create chat failed");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ marginBottom: "20px" }}>Band M Chats</h1>
      <button
        onClick={createChat}
        style={{
          padding: "10px",
          background: "#28a745",
          color: "white",
          border: "none",
          marginBottom: "20px",
        }}
      >
        Create New Chat
      </button>
      <ul>
        {chats.map((chat) => (
          <li
            key={chat.id}
            style={{ padding: "10px", borderBottom: "1px solid #eee" }}
          >
            {chat.name} (Unread: {chat.unreadCount})
            <Link
              to={`/chat/${chat.id}`}
              style={{ marginLeft: "10px", color: "#007bff" }}
            >
              Open
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Chats;
