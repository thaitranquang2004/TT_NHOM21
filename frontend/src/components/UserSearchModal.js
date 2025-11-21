import React, { useState } from 'react';
import api from '../utils/api';
import './UserSearchModal.css';

const UserSearchModal = ({ isOpen, onClose, onSelectUser, title = "Search Users", searchMode = "all" }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e) => {
    e.preventDefault();
    // If searching friends, we might want to show all initially or filter
    // For now, let's require query unless it's friends mode where we might show all?
    // Let's stick to query for consistency, or fetch all friends if query is empty in friend mode.
    
    setLoading(true);
    try {
      if (searchMode === "friends") {
        // Fetch all friends and filter client-side or use a search endpoint for friends if available
        // The friendController has listFriends. Let's assume it returns all friends.
        const response = await api.get("/friends");
        // response.data.friends is the list.
        // Filter by query
        const allFriends = response.data.friends;
        const filtered = allFriends.filter(f => 
          f.username.toLowerCase().includes(query.toLowerCase()) || 
          f.fullName.toLowerCase().includes(query.toLowerCase())
        );
        setResults(filtered);
      } else {
        if (!query.trim()) {
            setLoading(false);
            return;
        }
        const response = await api.get(`/users/search?query=${encodeURIComponent(query)}`);
        setResults(response.data.users);
      }
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-load friends when opening in friend mode?
  // For simplicity, let's just use the form submit or maybe useEffect if we want auto-load.
  // Let's stick to manual search for now to keep it simple, or maybe auto-load if query is empty?
  // Let's add a useEffect to load friends if mode is friends and query is empty?
  // No, let's keep it manual or user triggers it. But "Show all friends" is better.
  // Let's modify handleSearch to allow empty query for friends.

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSearch} className="modal-search-form">
          <input
            type="text"
            placeholder="Search by name or username..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        <div className="modal-results">
          {results.length === 0 && query && !loading && (
            <p className="no-results">No users found.</p>
          )}
          
          {results.map(user => (
            <div key={user.id || user._id} className="modal-user-item" onClick={() => onSelectUser(user)}>
              <div className="user-avatar-placeholder">
                {user.username[0].toUpperCase()}
              </div>
              <div className="user-info">
                <span className="user-fullname">{user.fullName}</span>
                <span className="user-username">@{user.username}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserSearchModal;
