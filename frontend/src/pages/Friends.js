import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import socket from "../utils/socket";
import "./Friends.css"; // <--- Import file CSS mới

const Friends = () => {
  const [friends, setFriends] = useState([]); // Danh sách hiển thị
  const [myFriendIds, setMyFriendIds] = useState(new Set()); // Chỉ lưu ID của bạn bè
  const [searchQuery, setSearchQuery] = useState("");

  // --- 1. Cập nhật logic fetch ---
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await api.get("/friends/list");
        setFriends(response.data.friends);
        // Lưu ID của những người đã là bạn
        const friendIds = new Set(response.data.friends.map((f) => f.id));
        setMyFriendIds(friendIds);
      } catch (error) {
        alert("Friends load failed");
      }
    };
    fetchFriends();

    socket.on("friendRequest", (data) => {
      // Khi có yêu cầu kết bạn, thêm họ vào cả 2 state
      setFriends((prev) => [data.sender, ...prev]);
      setMyFriendIds((prevIds) => new Set(prevIds).add(data.sender.id));
    });

    return () => socket.off("friendRequest");
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim() === "") {
      // Nếu ô tìm kiếm trống, có thể fetch lại list bạn bè
      // (Tạm thời bỏ qua, hoặc bạn có thể implement)
      return;
    }
    try {
      const response = await api.get("/users/search?query=" + searchQuery);
      setFriends(response.data.users); // Cập nhật danh sách hiển thị bằng kết quả search
      // Lưu ý: 'myFriendIds' không thay đổi, nên ta vẫn biết ai là bạn, ai là không
    } catch (error) {
      alert("Search failed");
    }
  };

  const sendRequest = async (userId) => {
    try {
      await api.post("/friends/request", { receiverId: userId });
      alert("Request sent!");
      // Bạn có thể cập nhật UI ở đây (ví dụ: đổi nút "Add" thành "Pending")
    } catch (error) {
      alert("Request failed");
    }
  };

  return (
    // --- 2. Cập nhật JSX với CSS class ---
    <div className="page-container">
      <h1 className="page-title">Band M Friends</h1>

      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="Search user by name"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input" // <--- Dùng class
        />
        <button type="submit" className="search-button">
          {" "}
          {/* <--- Dùng class */}
          Search
        </button>
      </form>

      <ul className="friend-list">
        {friends.length === 0 && (
          <p style={{ textAlign: "center", color: "#888" }}>No users found.</p>
        )}

        {friends.map((friend) => (
          <li key={friend.id} className="friend-item">
            {" "}
            {/* <--- Thẻ <li> như 1 'card' */}
            <div className="friend-info">
              <span className="friend-name">{friend.fullName}</span>
              <span className="friend-username">@{friend.username}</span>
            </div>
            {/* --- 3. Logic hiển thị nút đã được sửa --- */}
            <div className="friend-actions">
              {myFriendIds.has(friend.id) ? (
                // Nếu ĐÃ LÀ BẠN: Hiển thị nút "Chat"
                <Link
                  to={`/chat/${friend.id}`}
                  className="button button-chat" // <--- Class cho Link
                >
                  Chat
                </Link>
              ) : (
                // Nếu CHƯA LÀ BẠN: Hiển thị nút "Add Friend"
                <button
                  onClick={() => sendRequest(friend.id)}
                  className="button button-add" // <--- Class cho Button
                >
                  Add Friend
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Friends;
