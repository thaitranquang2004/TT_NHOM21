import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import "./Chats.css"; // <--- Import file CSS mới

const Chats = () => {
  const [chats, setChats] = useState([]);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await api.get("/chats");
        setChats(response.data.chats);
      } catch (error) {
        alert("Chats load failed");
      }
    };
    fetchChats();
  }, []);

  // LƯU Ý: Chức năng này vẫn đang bị hardcode 'userId1'.
  // Bạn sẽ cần một modal/UI để chọn người tham gia sau này.
  const createChat = async () => {
    try {
      const response = await api.post("/chats/create", {
        type: "direct",
        participants: ["userId1"], // Example
      });
      setChats((prev) => [...prev, response.data.chat]);
    } catch (error) {
      alert("Create chat failed");
    }
  };

  return (
    // Dùng class 'page-container' giống như Friends.js
    <div className="page-container">
      <h1 className="page-title">Band M Chats</h1>

      {/* Tái sử dụng class 'button' và thêm class mới */}
      <button onClick={createChat} className="button button-create">
        Create New Chat
      </button>

      <ul className="chat-list">
        {chats.length === 0 && (
          <p style={{ textAlign: "center", color: "#888" }}>
            You have no chats.
          </p>
        )}

        {/* Thay vì <li> chứa <Link>, chúng ta biến <Link> thành <li>
          để toàn bộ item có thể click được.
        */}
        {chats.map((chat) => (
          <Link
            to={`/chat/${chat.id}`}
            key={chat.id}
            className="chat-item-link" // <--- Class cho Link
          >
            <li className="chat-item">
              {" "}
              {/* <--- Class cho <li> */}
              {/* Thêm Avatar placeholder */}
              <div className="chat-avatar-placeholder">
                {chat.name ? chat.name[0].toUpperCase() : "B"}
              </div>
              {/* Thêm thông tin chat */}
              <div className="chat-info">
                <span className="chat-name">{chat.name}</span>
                {/* Bạn có thể thêm "last message" ở đây nếu API trả về */}
              </div>
              {/* Thêm "badge" (huy hiệu) cho tin nhắn chưa đọc */}
              {chat.unreadCount > 0 && (
                <div className="chat-unread-badge">{chat.unreadCount}</div>
              )}
            </li>
          </Link>
        ))}
      </ul>
    </div>
  );
};

export default Chats;
