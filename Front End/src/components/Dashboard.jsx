//import bgImage from "/public/assets/DashboardBackground.jpg";
import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { FaUserCircle, FaBox, FaStore, FaShoppingCart } from "react-icons/fa";

const Dashboard = () => {
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (storedUser) setUserName(storedUser);
  }, []);

  const cards = [
    { title: "Total Items", value: 120, bg: "linear-gradient(135deg, #667eea, #764ba2)", icon: <FaBox size={30} /> },
    { title: "Total Retailers", value: 35, bg: "linear-gradient(135deg, #43cea2, #185a9d)", icon: <FaStore size={30} /> },
    { title: "Pending Orders", value: 15, bg: "linear-gradient(135deg, #ff512f, #dd2476)", icon: <FaShoppingCart size={30} /> },
  ];

  return (
    <div className="d-flex app-wrapper moduleBody"
      style={{
        display: "flex",
        minHeight: "100vh",
        position: "relative",
        backgroundImage: "url('/src/assets/DashBoardBackground.jpg')", // Set background image
        backgroundSize: "cover", // Make it cover the whole container
        backgroundPosition: "center", // Center the image
        backgroundRepeat: "no-repeat", // Prevent repeating
        overflow: "hidden",
  //      paddingTop: "60px",
      }}
    >
      {/* Decorative background pattern */}
      <div
        style={{
          position: "absolute",
          top: "-50px",
          left: "-50px",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background: "rgba(102, 126, 234, 0.15)",
          filter: "blur(100px)",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-80px",
          right: "-80px",
          width: "350px",
          height: "350px",
          borderRadius: "50%",
          background: "rgba(255, 99, 132, 0.15)",
          filter: "blur(120px)",
          zIndex: 0,
        }}
      />

      <Sidebar />
      <div style={{ flex: 1, marginLeft: "60px", padding: "30px", position: "relative", zIndex: 1 }}>
        {/* Greeting Card */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
            padding: "30px",
            borderRadius: "15px",
            background: "linear-gradient(90deg, rgba(47, 118, 153, 1) 0%, rgba(199, 113, 87, 1) 100%)",
            color: "#fff",
            boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            marginBottom: "30px",
            transform: "translateY(-10px)",
            animation: "slideDown 0.5s ease forwards",
          }}
        >
          <FaUserCircle size={50} style={{ opacity: 0.9 }} />
          <div>
            <h3 style={{ margin: 0, fontWeight: "600", fontSize: "1.5rem" }}>
              Hey, <span style={{ fontWeight: "700" }}>{userName}</span>
            </h3>
            <p style={{ margin: "5px 0 0", opacity: 0.9 }}>Welcome aboard</p>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          {cards.map((card, idx) => (
            <div
              key={idx}
              style={{
                flex: "1 1 250px",
                padding: "25px",
                borderRadius: "15px",
                background: card.bg,
                color: "#fff",
                boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
                transition: "all 0.3s ease",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-8px) scale(1.02)";
                e.currentTarget.style.boxShadow = "0 15px 30px rgba(0,0,0,0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)";
              }}
            >
              <div style={{ marginBottom: "15px" }}>{card.icon}</div>
              <h4 style={{ margin: 0, fontWeight: "600", fontSize: "1.2rem" }}>{card.title}</h4>
              <p style={{ fontSize: "1.8rem", fontWeight: "700", margin: "10px 0 0" }}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Slide down animation keyframes */}
        <style>
          {`
            @keyframes slideDown {
              0% { opacity: 0; transform: translateY(-20px); }
              100% { opacity: 1; transform: translateY(0); }
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default Dashboard;
