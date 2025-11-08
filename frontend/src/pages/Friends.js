import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import socket from "../utils/socket";

const Friends = () => {
  const [friends, setFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await api.get("/friends/list");
        setFriends(response.data.friends);
      } catch (error) {
        alert("Friends load failed");
      }
    };
    fetchFriends();

    // Socket real-time friend request
    socket.on("friendRequest", (data) => {
      setFriends((prev) => [...prev, data.sender]);
    });

    return () => socket.off("friendRequest");
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const response = await api.get("/users/search?query=" + searchQuery);
      setFriends(response.data.users); // Update list
    } catch (error) {
      alert("Search failed");
    }
  };

  const sendRequest = async (userId) => {
    try {
      await api.post("/friends/request", { receiverId: userId });
      alert("Request sent!");
    } catch (error) {
      alert("Request failed");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ marginBottom: "20px" }}>Band M Friends</h1>
      <form onSubmit={handleSearch} style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Search user by name"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: "10px",
            border: "1px solid #ccc",
            marginRight: "10px",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "10px",
            background: "#007bff",
            color: "white",
            border: "none",
          }}
        >
          Search
        </button>
      </form>
      <ul>
        {friends.map((friend) => (
          <li
            key={friend.id}
            style={{ padding: "10px", borderBottom: "1px solid #eee" }}
          >
            {friend.fullName} ({friend.username})
            <Link
              to={`/chat/${friend.id}`}
              style={{ marginLeft: "10px", color: "#007bff" }}
            >
              Chat
            </Link>
            <button
              onClick={() => sendRequest(friend.id)}
              style={{
                marginLeft: "10px",
                padding: "5px 10px",
                background: "#28a745",
                color: "white",
                border: "none",
              }}
            >
              Add Friend
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Friends;
