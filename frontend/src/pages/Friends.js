import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import socket from "../utils/socket";
import "./Friends.css";

const Friends = ({ onSelectChat }) => {
  const [friends, setFriends] = useState([]);
  const [myFriendIds, setMyFriendIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        navigate("/");
        return;
      }
    };
    checkAuth();
  }, [navigate]);

  useEffect(() => {
    const fetchFriends = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get("/friends/list");
        setFriends(response.data.friends || []);
        const friendIds = new Set(
          response.data.friends?.map((f) => f._id) || []
        );
        setMyFriendIds(friendIds);
      } catch (error) {
        console.error("Friends fetch error:", error);
        setError("Failed to load friends.");
      } finally {
        setLoading(false);
      }
    };
    fetchFriends();

    if (socket) {
      const handleFriendRequest = (data) => {
        // Ideally we should show a notification or pending request list
        // For now, if we auto-accept or just want to show them in search, we might not need to do much here
        // unless we have a "Pending Requests" tab.
        // Let's just log for now as this view is mainly "My Friends" + "Search"
        console.log("New friend request", data);
      };
      socket.on("friendRequest", handleFriendRequest);

      return () => {
        if (socket) socket.off("friendRequest", handleFriendRequest);
      };
    }
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim() === "") {
      window.location.reload();
      return;
    }
    setLoading(true);
    try {
      const response = await api.get(
        `/users/search?query=${encodeURIComponent(searchQuery)}`
      );
      setFriends(response.data.users || []);
    } catch (error) {
      console.error("Search error:", error);
      setError("Search failed.");
    } finally {
      setLoading(false);
    }
  };

  const sendRequest = async (userId) => {
    try {
      await api.post("/friends/request", { receiverId: userId });
      alert("Friend request sent!");
    } catch (error) {
      console.error("Request error:", error);
      alert("Request failed: " + (error.response?.data?.message || "Unknown error"));
    }
  };

  if (loading && friends.length === 0) {
    return (
      <div className="page-container loading-container">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="page-container friends-page">
      <div className="friends-header">
        <h1 className="page-title">Friends</h1>
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Find friends..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            disabled={loading}
          />
          <button type="submit" className="search-button" disabled={loading}>
            <i className="fas fa-search"></i>
          </button>
        </form>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="friends-grid">
        {friends.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👋</div>
            <h3>No friends found</h3>
            <p>Try searching for people to add!</p>
          </div>
        ) : (
          friends.map((friend) => (
            <div key={friend._id || friend.id} className="friend-card">
              <div className="friend-card-header">
                <div className="friend-avatar-large">
                  {friend.avatar ? (
                    <img src={friend.avatar} alt={friend.fullName} />
                  ) : (
                    <span>{friend.username?.[0]?.toUpperCase()}</span>
                  )}
                </div>
                {friend.onlineStatus && <span className="online-badge"></span>}
              </div>
              
              <div className="friend-card-body">
                <h3 className="friend-name">{friend.fullName}</h3>
                <p className="friend-username">@{friend.username}</p>
              </div>

              <div className="friend-card-actions">
                {myFriendIds.has(friend._id || friend.id) ? (
                  <button
                    onClick={() => onSelectChat(friend._id || friend.id)}
                    className="button button-primary button-full"
                  >
                    Message
                  </button>
                ) : (
                  <button
                    onClick={() => sendRequest(friend._id || friend.id)}
                    className="button button-secondary button-full"
                    disabled={loading}
                  >
                    Add Friend
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Friends;
