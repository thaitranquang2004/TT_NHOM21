import React, { useState, useEffect } from "react";
import api from "../utils/api";
import { useSocket } from "../context/SocketContext";
import "./Chats.css";

import { Trash2 } from "lucide-react";

const Chats = ({ onSelectChat, activeChatId }) => {
  const [chats, setChats] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const { socket } = useSocket();

  const fetchData = async () => {
    try {
      // Still fetch user profile via API for now, or could use socket too
      const userRes = await api.get("/users/profile");
      setCurrentUser(userRes.data.user);
      
      // Fetch chats via socket
      if (socket) {
          socket.emit("getChats");
      }
    } catch (error) {
      console.error("Profile load failed", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [socket]); // Add socket dependency to ensure we emit getChats when connected

  useEffect(() => {
    if (socket) {
      const handleChatsFetched = (data) => {
          setChats(data.chats || []);
      };

      const handleRefresh = () => {
          socket.emit("getChats");
          // Update profile too to get fresh unread counts
          api.get("/users/profile").then(res => setCurrentUser(res.data.user)).catch(console.error);
      };
      
      const handleChatDeleted = (data) => {
          // Refresh chat list
          socket.emit("getChats");
          api.get("/users/profile").then(res => setCurrentUser(res.data.user)).catch(console.error);
          
          // If the deleted chat is the active one, reset to null
          if (data?.chatId && data.chatId === activeChatId) {
              onSelectChat(null);
          }
      };
      
      socket.on("chatsFetched", handleChatsFetched);
      socket.on("newMessage", handleRefresh);
      socket.on("chatDeleted", handleChatDeleted); // Use separate handler
      socket.on("unreadCountsUpdated", handleRefresh);
      socket.on("chatCreated", handleRefresh);
      
      return () => {
        socket.off("chatsFetched", handleChatsFetched);
        socket.off("newMessage", handleRefresh);
        socket.off("chatDeleted", handleChatDeleted);
        socket.off("unreadCountsUpdated", handleRefresh);
        socket.off("chatCreated", handleRefresh);
      };
    }
  }, [socket, activeChatId, onSelectChat]);

  const handleDeleteChat = (e, chatId) => {
      e.stopPropagation();
      if(window.confirm("Delete this chat? This will remove all messages permanently.")) {
          if(socket) {
              socket.emit("deleteChat", { chatId });
              // If deleting the active chat, reset immediately
              if (chatId === activeChatId) {
                  onSelectChat(null);
              }
          }
      }
  };

  if (!currentUser) return null;

  return (
    <div className="chats-sidebar">
      <div className="chats-header">
        <h2 style={{ marginLeft: "10px", textIndent: "15px" }}>Chats</h2>
      </div>

      <ul className="chat-list">
        {chats.length === 0 && (
          <p className="no-chats-placeholder" style={{ textAlign: "center" }}>
            No chats yet. <br /> Start a new conversation!
          </p>
        )}

        {chats.map((chat) => {
          const chatId = chat._id || chat.id;
          const isDirect =
            chat.type === "direct" || chat.participants.length === 2;
          const otherUser = isDirect
            ? chat.participants.find((p) => p._id !== currentUser?._id)
            : null;

          const chatName =
            chat.name ||
            (otherUser ? otherUser.fullName || otherUser.username : "Chat");
          const avatar = isDirect ? otherUser?.avatar : chat.avatar;
          const initials = (chatName || "?")[0].toUpperCase();

          // Unread Count
          const unreadCount = currentUser.unreadCounts?.[chatId] || 0;

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
                  {unreadCount > 0 && (
                      <span className="unread-badge">{unreadCount}</span>
                  )}
                </div>
              </div>
              <button 
                className="delete-chat-btn"
                onClick={(e) => handleDeleteChat(e, chatId)}
                title="Delete Chat"
              >
                  <Trash2 size={16} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Chats;
