import React, { useState, useEffect, useRef } from "react";
import api from "../utils/api";
import socket from "../utils/socket";
import "./ChatWindow.css";

const ChatWindow = ({ chatId }) => {
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [chatInfo, setChatInfo] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch current user info for identifying 'sent' vs 'received'
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await api.get("/users/profile");
        setCurrentUser(res.data.user);
      } catch (err) {
        console.error("Failed to fetch profile", err);
      }
    };
    fetchMe();
  }, []);

  useEffect(() => {
    if (!chatId) return;

    const fetchMessages = async () => {
      try {
        const response = await api.get(`/messages/${chatId}`);
        setMessages(response.data.messages);
        scrollToBottom();
      } catch (error) {
        console.error("Messages load failed", error);
      }
    };

    // We also need chat info (name, participants) to display in header
    // Ideally backend should provide an endpoint or we extract from list
    // For now, let's assume we can get it from a separate call or passed props.
    // Since props only have chatId, let's fetch chat details if possible.
    // If not, we might show generic info.
    // Let's try to find it from the cache or fetch it.
    // Since we don't have a direct "get chat details" endpoint in the list I saw earlier (only create/list),
    // we might rely on the list in Dashboard or add an endpoint.
    // Wait, `chats.js` has `listChats` but not `getChatDetails`.
    // Let's just use a placeholder or try to fetch from list if we had context.
    // For now, I'll just fetch messages.

    fetchMessages();

    if (socket) {
        socket.emit("joinRoom", chatId);
        
        const handleNewMessage = (msg) => {
            // Check if message belongs to current chat
            // The msg object structure depends on backend emit.
            // Backend emits: { id, content, sender, type, mediaUrl, createdAt } to room `chat_${chatId}`
            // So we don't strictly need to check chatId if we trust room separation, but good to be safe if logic changes.
            setMessages((prev) => [...prev, msg]);
            scrollToBottom();
        };

        socket.on("newMessage", handleNewMessage);

        socket.on("messageEdited", (msg) => {
          setMessages((prev) => prev.map((m) => (m._id === msg.messageId ? { ...m, content: msg.content, isEdited: true } : m)));
        });

        socket.on("messageDeleted", (msg) => {
           setMessages((prev) => prev.filter((m) => m._id !== msg.messageId));
        });

        return () => {
          socket.off("newMessage", handleNewMessage);
          socket.off("messageEdited");
          socket.off("messageDeleted");
        };
    }
  }, [chatId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      const response = await api.post("/messages/send", { chatId, content });
      // Socket emit is handled in backend controller now, so we don't need to emit manually here
      // unless we want optimistic UI. Backend emits to room.
      // We just clear input.
      setContent("");
    } catch (error) {
      console.error("Send failed", error);
      alert("Failed to send message");
    }
  };

  // Helper to get chat name/avatar
  const getChatDetails = () => {
    // If we have chatInfo from props or fetched, use it.
    // Since we don't have a direct "getChat" endpoint used here yet, we rely on what we have.
    // But we need to know the "other" user for direct chats.
    // We can try to find it from the messages if we don't have chat details? No, that's unreliable.
    // Best way: Fetch chat details or pass them.
    // Since we only have chatId, let's fetch the chat details.
    // I'll add a fetchChatDetails function.
    return { name: "Chat", avatar: "#" }; 
  };

  // Fetch chat details
  useEffect(() => {
      if(!chatId) return;
      const fetchChatDetails = async () => {
          try {
              // We can reuse the list endpoint or add a specific one. 
              // But wait, the list endpoint returns all chats. We can find it there if we had the list context.
              // Or we can just call GET /chats and find it? Inefficient but works for now.
              // Better: GET /chats/:chatId (need to implement or check if exists).
              // It doesn't exist in my summary.
              // Let's use the list for now or just rely on messages for participants?
              // Actually, `api.get("/chats")` returns the list. Let's fetch it and find the chat.
              const res = await api.get("/chats");
              const found = res.data.chats.find(c => c._id === chatId || c.id === chatId);
              if(found) {
                  // Determine name
                  let name = found.name;
                  if(found.type === 'direct' || !name) {
                      const other = found.participants.find(p => p._id !== currentUser?._id);
                      name = other ? (other.fullName || other.username) : "Chat";
                  }
                  setChatInfo({ ...found, name });
              }
          } catch(err) {
              console.error("Failed to fetch chat details", err);
          }
      };
      if(currentUser) fetchChatDetails();
  }, [chatId, currentUser]);

  if (!chatId) {
    return (
      <div className="chat-window empty-chat">
        <i className="fas fa-comments"></i>
        <h3>Select a chat to start messaging</h3>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="header-user-info">
          <div className="header-avatar">
            <span>{chatInfo?.name?.[0]?.toUpperCase() || "#"}</span>
          </div>
          <div className="header-details">
            <span className="header-name">{chatInfo?.name || "Loading..."}</span>
          </div>
        </div>
        <div className="header-actions">
        </div>
      </div>

      <div className="messages-container">
        {messages.map((msg) => {
            const isSent = msg.sender._id === currentUser?._id || msg.sender === currentUser?._id;
            const senderName = msg.sender.username || msg.sender.fullName || "User";
            
            return (
                <div key={msg._id || msg.id} className={`message-group ${isSent ? 'sent' : 'received'}`}>
                    <div className="message-bubble">
                        {/* Ensure content is string */}
                        {typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)}
                    </div>
                    <div className="message-info">
                        {!isSent && <span className="sender-name">{senderName}</span>}
                        <span className="message-time">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>
            );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="message-input-area">
        <form className="input-wrapper" onSubmit={sendMessage}>
            <input
            type="text"
            className="message-input"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type a message..."
            />
            <button type="submit" className="send-button" disabled={!content.trim()}>
            <i className="fas fa-paper-plane"></i>
            </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
