// src/components/HeaderComponent.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiLogOut, FiSettings, FiUser } from "react-icons/fi";
import { FaHome } from "react-icons/fa";
import companylogo from "/src/assets/Company Logo.png";

const HeaderComponent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [loadingPic, setLoadingPic] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const baseUrl = "http://localhost:9070/";

  // hide header on login page
  if (location.pathname === "/login") return null;

  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    const storedPic = localStorage.getItem("profilePicThumbUrl");
    if (storedUser) setUsername(storedUser);
    if (storedPic) setProfilePic(storedPic.startsWith("http") ? storedPic : baseUrl + storedPic);

    // 🔹 Listen for updates
  const handleProfileUpdate = (e) => {
      let newPic = e.detail;
      if (!newPic.startsWith("http")) newPic = baseUrl + newPic;

      // Replace .png with -thumb.png
      if (newPic.endsWith(".png")) {
        newPic = newPic.replace(".png", "-thumb.png");
      }

      setProfilePic(`${newPic}?t=${new Date().getTime()}`); // cache-busting
    };

    window.addEventListener("profilePicUpdated", handleProfileUpdate);

    return () => window.removeEventListener("profilePicUpdated", handleProfileUpdate);
  }, []);


  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("id");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    localStorage.removeItem("profilePicThumbUrl");
    localStorage.removeItem("allowedModules");

    window.location.href = "/login";
  };

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 10px",
        backgroundColor: "#1f2937",
        color: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        height: "60px",
        zIndex: 1000,
      }}
    >
      {/* Left: Home + Logo */}
      <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
        <FaHome
          size={35}
          style={{
            cursor: "pointer",
            marginRight: "10px",
            color: "#fff",
            transition: "transform 0.2s",
          }}
          onClick={() => navigate("/dashboard")}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        />
        <img
          src={companylogo}
          alt="Company Logo"
          style={{
            height: "70px",
            width: "180px",
            objectFit: "contain",
          }}
        />
      </div>

      {/* Right: Profile Dropdown */}
      <div
        style={{ position: "relative" }}
        onMouseEnter={() => setDropdownOpen(true)}
        onMouseLeave={() => setDropdownOpen(false)}
      >
        {loadingPic && (
          <div
            style={{
              height: "40px",
              width: "40px",
              borderRadius: "50%",
              backgroundColor: "#ccc",
              display: "inline-block",
            }}
          />
        )}

        {profilePic && (
          <img
            src={profilePic}
            alt="Profile"
            style={{
              height: "40px",
              width: "40px",
              borderRadius: "50%",
              cursor: "pointer",
              objectFit: "cover",
              border: "2px solid #fff",
              display: loadingPic ? "none" : "inline-block",
            }}
            onLoad={() => setLoadingPic(false)}
            onError={() => {
              setLoadingPic(false);
              setProfilePic(null); // fallback
            }}
          />
        )}

        {!profilePic && !loadingPic && (
          <img
            src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
            alt="Default Profile"
            style={{
              height: "40px",
              width: "40px",
              borderRadius: "50%",
              cursor: "pointer",
              objectFit: "cover",
              border: "2px solid #fff",
            }}
          />
        )}

        {/* Dropdown menu */}
        <div
          style={{
            position: "fixed",
            top: "60px",
            right: "0px",
            background: "#fff",
            color: "#333",
            borderRadius: "8px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            minWidth: "180px",
            overflow: "hidden",
            zIndex: 1100,
            maxHeight: dropdownOpen ? "300px" : "0",
            opacity: dropdownOpen ? 1 : 0,
            transition: "all 0.3s ease-in-out",
          }}
        >
          <div
            style={{
              padding: "10px",
              fontWeight: "bold",
              borderBottom: "1px solid #ddd",
            }}
          >
            {username}
          </div>

          <div onClick={() => navigate("/my-account")} style={menuItemStyle}>
            <FiUser size={18} /> My Account
          </div>

          <div onClick={() => navigate("/settings")} style={menuItemStyle}>
            <FiSettings size={18} /> Settings
          </div>

          <div
            onClick={handleLogout}
            style={{ ...menuItemStyle, borderTop: "1px solid #ddd", color: "red" }}
          >
            <FiLogOut size={18} /> Logout
          </div>
        </div>
      </div>
    </header>
  );
};

const menuItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "10px",
  cursor: "pointer",
  transition: "background 0.2s",
};

export default HeaderComponent;
