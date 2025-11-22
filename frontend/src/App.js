import React, { useEffect, useState } from "react"; // Thêm useEffect, useState
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useNavigate, // Thêm useNavigate cho redirect
  useLocation,
} from "react-router-dom";
import { jwtDecode } from "jwt-decode"; // npm install jwt-decode nếu chưa (cho expiry check)
import { initSocket } from "./utils/socket"; // Import initSocket
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

// Protected Route (check accessToken & expiry)
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("accessToken"); // Thống nhất key với Login.js
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true }); // Không token → login
      return;
    }
    try {
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) {
        // Token expire
        localStorage.clear(); // Clear token & user
        navigate("/", { replace: true });
      }
    } catch (err) {
      console.error("Invalid token in ProtectedRoute:", err);
      localStorage.clear();
      navigate("/", { replace: true });
    }
  }, [token, navigate]);

  if (!token) return <Navigate to="/login" replace />; // Block nếu không token
  return children; // OK → render
};

// MainLayout: Chứa Navbar + Routes + Auto-redirect logic
const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          setIsAuthenticated(true);
          initSocket(token); // Initialize socket
          if (window.socket) {
            window.socket.emit("joinUser", decoded.id || decoded.userId);
          }
          // If at login page but authenticated, go to dashboard
          if (location.pathname === "/login" || location.pathname === "/register") {
            navigate("/", { replace: true });
          }
        } else {
          localStorage.clear();
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error("Invalid token on load:", err);
        localStorage.clear();
        setIsAuthenticated(false);
      }
    }
  }, [location.pathname, navigate]);

  return (
    <div className="app">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
};

// App: Chỉ bọc Router
function App() {
  return (
    <Router>
      <MainLayout />
    </Router>
  );
}

export default App;
