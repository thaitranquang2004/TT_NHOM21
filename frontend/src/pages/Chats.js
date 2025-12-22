import React, { useState, useEffect } from "react";
import api from "../utils/api";
import { useSocket } from "../context/SocketContext";
import "./Chats.css";

const Chats = ({ onSelectChat, activeChatId }) => {
  const [chats, setChats] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const { socket } = useSocket();

  const fetchData = async () => {
    try {
      const [chatsRes, userRes] = await Promise.all([
        api.get("/chats"),
        api.get("/users/profile"),
      ]);
      setChats(chatsRes.data.chats);
      setCurrentUser(userRes.data.user);
    } catch (error) {
      console.error("Data load failed", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on("newMessage", (newMessage) => {
        // Refresh list to re-order and show latest info
        fetchData();
      });
      return () => socket.off("newMessage");
    }
  }, [socket]);

  if (!currentUser) return null;

  return (
    <div className="chats-sidebar">
      <div className="chats-header">
        <h2 style={{ marginLeft: "10px", textIndent: "15px" }}>Chats</h2>
      </div>

      <ul className="chat-list">
        {chats.length === 0 && (
          <p className="no-chats-placeholder" style={{ textAlign: "center" }}>
            No chats yet. <br/> Start a new conversation!
          </p>
        )}

        {chats.map((chat) => {
          const chatId = chat._id || chat.id;
          const isDirect = chat.type === "direct" || chat.participants.length === 2;
          const otherUser = isDirect 
            ? chat.participants.find((p) => p._id !== currentUser?._id) 
            : null;
          
          const chatName = chat.name || (otherUser ? otherUser.fullName || otherUser.username : "Chat");
          const avatar = isDirect ? otherUser?.avatar : chat.avatar;
          const initials = (chatName || "?")[0].toUpperCase();

          return (
            <li
              key={chatId}
              className={`chat-item ${activeChatId === chatId ? "active" : ""}`}
              onClick={() => onSelectChat(chatId)}
            >
              <div className="chat-avatar-placeholder">
                {avatar ? (
                  <img src={avatar} alt={chatName} />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <div className="chat-info">
                <div className="chat-name-row">
                  <span className="chat-name">{chatName}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Chats;
