import "../styles/common.css";
import React, { useState } from "react";
import Sidebar from "./SideBar";

const Collection = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  return (
    <div className="d-flex app-wrapper moduleBody">

      <Sidebar expanded={sidebarExpanded} onToggle={setSidebarExpanded} />
      <div
        style={{
          flexGrow: 1,
          padding: "20px",
          marginLeft: sidebarExpanded ? "200px" : "60px",
          transition: "margin-left 0.3s ease",
          paddingTop: "60px",
        }}
      >
        <h2>Collection Page</h2>
        <p>This is the Collection screen.</p>
      </div>
    </div>
  );
};

export default Collection;
