import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { useSocket } from "../context/SocketContext";
import "./Friends.css";
import { UserMinus } from "lucide-react";

const Friends = ({ onSelectChat }) => {
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [myFriendIds, setMyFriendIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { socket, onlineUsers } = useSocket();

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

  // Socket: Initial Load & Listeners
  useEffect(() => {
    if (!socket) return;

    setLoading(true);

    // Initial Fetch
    socket.emit("getFriendsList");
    socket.emit("getIncomingRequests");

    // Listeners
    const handleFriendsListFetched = ({ friends }) => {
        setFriends(friends || []);
        const ids = new Set(friends?.map(f => f._id) || []);
        setMyFriendIds(ids);
        setLoading(false);
    };

    const handleIncomingRequestsFetched = ({ requests }) => {
        setIncomingRequests(requests || []);
        setLoading(false);
    };

    // Updates
    const handleFriendRequestReceived = (data) => {
        // Refresh requests
        socket.emit("getIncomingRequests");
    };

    const handleFriendRequestAccepted = () => {
         // Refresh both
         socket.emit("getFriendsList");
         socket.emit("getIncomingRequests");
    };

    const handleFriendRequestDeclined = () => {
        socket.emit("getIncomingRequests");
    };

    const handleFriendRemoved = () => {
         socket.emit("getFriendsList");
    };

    const handleChatCreated = ({ chatId }) => {
        onSelectChat(chatId);
    };

    const handleError = (data) => {
        setError(data.message || "An error occurred");
    };


    socket.on("friendsListFetched", handleFriendsListFetched);
    socket.on("incomingRequestsFetched", handleIncomingRequestsFetched);
    socket.on("friendRequestReceived", handleFriendRequestReceived);
    socket.on("friendRequestAccepted", handleFriendRequestAccepted);
    socket.on("friendRequestDeclined", handleFriendRequestDeclined);
    socket.on("friendRemoved", handleFriendRemoved);
    socket.on("chatCreated", handleChatCreated);
    socket.on("error", handleError);

    return () => {
        socket.off("friendsListFetched", handleFriendsListFetched);
        socket.off("incomingRequestsFetched", handleIncomingRequestsFetched);
        socket.off("friendRequestReceived", handleFriendRequestReceived);
        socket.off("friendRequestAccepted", handleFriendRequestAccepted);
        socket.off("friendRequestDeclined", handleFriendRequestDeclined);
        socket.off("friendRemoved", handleFriendRemoved);
        socket.off("chatCreated", handleChatCreated);
        socket.off("error", handleError);
    };
  }, [socket, onSelectChat]);


  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim() === "") {
       if (socket) socket.emit("getFriendsList");
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

  const sendRequest = (userId) => {
    if (socket) {
        socket.emit("sendFriendRequest", { receiverId: userId });
    }
  };

  const acceptRequest = (requestId) => {
    if (socket) {
        socket.emit("acceptFriendRequest", { requestId });
    }
  };

  const declineRequest = (requestId) => {
     if (socket) {
        socket.emit("declineFriendRequest", { requestId });
     }
  };

  const handleRemoveFriend = (friendId) => {
      if(window.confirm("Are you sure you want to remove this friend?")) {
          if (socket) {
              socket.emit("removeFriend", { friendId });
          }
      }
  };

  const handleMessage = (friendId) => {
    if (socket) {
        socket.emit("createChat", {
            type: "direct",
            participants: [friendId]
        });
    }
  };

  if (loading && friends.length === 0 && incomingRequests.length === 0) {
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

      {/* Incoming Requests Section */}
      {incomingRequests.length > 0 && !searchQuery && (
        <div className="requests-section">
          <h2 className="section-title">
            Friend Requests ({incomingRequests.length})
          </h2>
          <div className="friends-grid">
            {incomingRequests.map((req) => (
              <div key={req._id} className="friend-card request-card">
                <div className="friend-card-header">
                  <div className="friend-avatar-large">
                    {req.sender?.avatar ? (
                      <img src={req.sender.avatar} alt={req.sender.fullName} />
                    ) : (
                      <span>{req.sender?.username?.[0]?.toUpperCase()}</span>
                    )}
                  </div>
                </div>
                <div className="friend-card-body">
                  <h3 className="friend-name">{req.sender?.fullName}</h3>
                  <p className="friend-username">@{req.sender?.username}</p>
                </div>
                <div className="friend-card-actions">
                  <button
                    onClick={() => acceptRequest(req._id)}
                    className="button button-primary button-half"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => declineRequest(req._id)}
                    className="button button-secondary button-half"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
          <hr className="section-divider" />
        </div>
      )}

      {/* Friends List / Search Results */}
      <div className="friends-list-section">
        <h2 className="section-title">
          {searchQuery ? "Search Results" : `My Friends (${friends.length})`}
        </h2>
        <div className="friends-grid">
          {friends.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👋</div>
              <h3>{searchQuery ? "No users found" : "No friends yet"}</h3>
              <p>
                {searchQuery
                  ? "Try a different search term"
                  : "Search for people to add!"}
              </p>
            </div>
          ) : (
            friends.map((friend) => {
              const isOnline =
                onlineUsers.includes(friend._id || friend.id) ||
                friend.onlineStatus;
              return (
                <div key={friend._id || friend.id} className="friend-card">
                  <div className="friend-card-header">
                    <div className="friend-avatar-large">
                      {friend.avatar ? (
                        <img src={friend.avatar} alt={friend.fullName} />
                      ) : (
                        <span>{friend.username?.[0]?.toUpperCase()}</span>
                      )}
                    </div>
                    {isOnline && <span className="online-badge"></span>}
                  </div>

                  <div className="friend-card-body">
                    <h3 className="friend-name">{friend.fullName}</h3>
                    <p className="friend-username">@{friend.username}</p>
                  </div>

                  <div className="friend-card-actions">
                    {myFriendIds.has(friend._id || friend.id) ? (
                     <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                      <button
                        onClick={() => handleMessage(friend._id || friend.id)}
                        className="button button-primary"
                        style={{ flex: 1 }}
                      >
                        Message
                      </button>
                      <button 
                        onClick={() => handleRemoveFriend(friend._id || friend.id)}
                        className="button button-secondary"
                        style={{ padding: '0 12px' }}
                        title="Remove Friend"
                      >
                         <UserMinus size={18} />
                      </button>
                     </div>
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
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Friends;
