import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../utils/api";
import socket from "../utils/socket";

const ChatWindow = () => {
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [reaction, setReaction] = useState("");

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await api.get(`/messages/${chatId}`); // Load messages with pagination
        setMessages(response.data.messages);
      } catch (error) {
        alert("Messages load failed");
      }
    };
    fetchMessages();

    // Socket real-time
    socket.emit("joinRoom", chatId);
    socket.on("newMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("messageEdited", (msg) => {
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
    });

    socket.on("messageDeleted", (msgId) => {
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
    });

    return () => {
      socket.off("newMessage");
      socket.off("messageEdited");
      socket.off("messageDeleted");
    };
  }, [chatId]);

  const sendMessage = async () => {
    if (!content.trim()) return;
    try {
      const response = await api.post("/messages/send", { chatId, content });
      socket.emit("newMessage", response.data.message); // Emit real-time
      setContent("");
    } catch (error) {
      alert("Send failed");
    }
  };

  const addReaction = async (messageId) => {
    if (!reaction) return;
    try {
      await api.post(`/messages/${messageId}/reaction`, {
        reactionType: reaction,
      });
      socket.emit("reactionAdded", { messageId, reactionType: reaction });
      setReaction("");
    } catch (error) {
      alert("Reaction failed");
    }
  };

  const markSeen = async (messageId) => {
    try {
      await api.put(`/messages/${messageId}/seen`);
      socket.emit("messageSeen", messageId);
    } catch (error) {
      alert("Seen failed");
    }
  };

  return (
    <div style={{ display: "flex", height: "80vh", border: "1px solid #ccc" }}>
      <div style={{ width: "70%", padding: "10px", overflowY: "auto" }}>
        <h2 style={{ marginBottom: "10px" }}>Chat Window</h2>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              padding: "10px",
              borderBottom: "1px solid #eee",
              marginBottom: "10px",
            }}
          >
            <p>
              <strong>{msg.sender.username}:</strong> {msg.content}
            </p>
            <p style={{ fontSize: "12px", color: "gray" }}>
              {new Date(msg.createdAt).toLocaleTimeString()}
            </p>
            <div>
              <select
                value={reaction}
                onChange={(e) => setReaction(e.target.value)}
              >
                <option value="">Add Reaction</option>
                <option value="heart">❤️</option>
                <option value="like">👍</option>
              </select>
              <button
                onClick={() => addReaction(msg.id)}
                style={{ marginLeft: "10px", padding: "5px" }}
              >
                React
              </button>
              <button
                onClick={() => markSeen(msg.id)}
                style={{ marginLeft: "10px", padding: "5px" }}
              >
                Seen
              </button>
            </div>
          </div>
        ))}
      </div>
      <div
        style={{ width: "30%", padding: "10px", borderLeft: "1px solid #ccc" }}
      >
        <h3>Participants</h3>
        {/* Load from backend */}
      </div>
      <div
        style={{
          position: "fixed",
          bottom: "10px",
          width: "70%",
          padding: "10px",
        }}
      >
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type message..."
          style={{ width: "80%", padding: "10px", border: "1px solid #ccc" }}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          style={{
            width: "18%",
            padding: "10px",
            background: "#007bff",
            color: "white",
            border: "none",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
