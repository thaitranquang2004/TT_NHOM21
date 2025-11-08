import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation, // <--- 1. Import useLocation
} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Friends from "./pages/Friends";
import Chats from "./pages/Chats";
import ChatWindow from "./pages/ChatWindow";
import Profile from "./pages/Profile";

// Protected Route (JWT check)
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/" />;
};

// 2. Chúng ta tạo component MainLayout để chứa logic
//    (Vì useLocation phải nằm bên trong <Router>)
const MainLayout = () => {
  const location = useLocation();

  // 3. Xác định các trang KHÔNG hiển thị Navbar
  //    (Trang Login của bạn là "/")
  const hideNavbarOnPaths = ["/", "/register"];

  // 4. Kiểm tra xem có cần ẩn Navbar không
  const shouldHideNavbar = hideNavbarOnPaths.includes(location.pathname);

  return (
    <div className="app">
      {/* 5. Chỉ hiển thị <nav> nếu shouldHideNavbar là false */}
      {!shouldHideNavbar && (
        <nav style={{ padding: "10px", background: "#333", color: "white" }}>
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
      )}

      {/* Phần Routes giữ nguyên */}
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
  );
};

// 6. Component App giờ chỉ cần bọc Router bên ngoài MainLayout
function App() {
  return (
    <Router>
      <MainLayout />
    </Router>
  );
}

export default App;
