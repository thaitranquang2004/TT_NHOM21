import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Friends from "./pages/Friends";
import Chats from "./pages/Chats";
import ChatWindow from "./pages/ChatWindow";
import Profile from "./pages/Profile";
// Import utils sau

// Protected Route (JWT check)
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/" />;
};

function App() {
  return (
    <Router>
      <div className="app">
        {/* Navbar cơ bản */}
        <nav style={{ padding: "10px", background: "#333", color: "white" }}>
          <Link to="/" style={{ color: "white", marginRight: "20px" }}>
            Login
          </Link>
          <Link to="/register" style={{ color: "white", marginRight: "20px" }}>
            Register
          </Link>
          <Link to="/friends" style={{ color: "white", marginRight: "20px" }}>
            Friends
          </Link>
          <Link to="/chats" style={{ color: "white", marginRight: "20px" }}>
            Chats
          </Link>
          <Link to="/profile" style={{ color: "white" }}>
            Profile
          </Link>
        </nav>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/friends"
            element={
              <ProtectedRoute>
                <Friends />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chats"
            element={
              <ProtectedRoute>
                <Chats />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:chatId"
            element={
              <ProtectedRoute>
                <ChatWindow />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
