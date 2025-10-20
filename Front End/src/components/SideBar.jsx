import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaStore,
  FaBox,
  FaCubes,
  FaShoppingCart,
  FaClipboardList,
  FaDollarSign,
  FaBoxOpen,
  FaUndo,
  FaMoneyBill,
  FaFileInvoice,
  FaChartBar,
  FaUserCircle,
  FaTruck,
  FaUsers,
  FaArrowLeft,
  FaCalendarAlt,
} from "react-icons/fa";
import "./Sidebar.css";

const iconMap = {
  PURCHASE: <FaClipboardList />,
  ORDER: <FaShoppingCart />,
  SALE: <FaDollarSign />,
  COLLECTION: <FaMoneyBill />,
  SALE_RETURN: <FaUndo />,
  STOCK: <FaCubes />,
  SUPPLIER: <FaTruck />,
  RETAILER: <FaStore />,
  ITEM: <FaBox />,
  PACKING: <FaBoxOpen />,
  USER_MASTER: <FaUserCircle />,
  MODULE_MASTER: <FaBox />,
  FINANCIAL_YEAR_MASTER: <FaCalendarAlt />,
  FINANCIAL_REPORT: <FaFileInvoice />,
};

// safe loader
function loadModulesFromStorage() {
  const stored = localStorage.getItem("allowedModules");
  if (!stored || stored === "undefined" || stored === "null") return [];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Failed to parse allowedModules:", e, "value:", stored);
    return [];
  }
}

const Sidebar = () => {
  const [expanded, setExpanded] = useState(false);
  const [submenu, setSubmenu] = useState(null);
  const [allowedModules, setAllowedModules] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const load = () => setAllowedModules(loadModulesFromStorage());
    load();

    window.addEventListener("allowedModulesUpdated", load);
    return () => {
      window.removeEventListener("allowedModulesUpdated", load);
    };
  }, []);

  // Custom module order
  const moduleOrder = [
    "SUPPLIER",
    "RETAILER",
    "ITEM",
    "PURCHASE",
    "PACKING",
    "STOCK",
    "ORDER",
    "SALE",
    "SALE_RETURN",
    "COLLECTION",
    "USER_MASTER",
    "MODULE_MASTER",
    "FINANCIAL_YEAR_MASTER",
    "FINANCIAL_REPORT",
  ];

  // Sort modules according to custom order
  const sortedModules = allowedModules.sort((a, b) => {
    const indexA = moduleOrder.indexOf(a.name?.trim().toUpperCase());
    const indexB = moduleOrder.indexOf(b.name?.trim().toUpperCase());
    return indexA - indexB;
  });

  // ✅ Auto-categorize modules
  const categorizedModules = sortedModules.reduce(
    (acc, mod) => {
      const name = mod.name?.trim().toUpperCase();

      if (name.endsWith("_MASTER")) {
        acc.master.push(mod); // Anything ending in _MASTER
      } else if (name.includes("REPORT")) {
        acc.report.push(mod); // Anything with REPORT
      } else {
        acc.main.push(mod); // Everything else
      }

      return acc;
    },
    { main: [], master: [], report: [] }
  );

  const { main: mainModules, master: masterModules, report: reportModules } =
    categorizedModules;

  const formatModuleName = (name) =>
    name
      .replace(/_/g, " ")
      .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

  const renderModuleItem = (mod) => (
    <div
      key={mod.id}
      className="menu-item"
      onClick={() =>
        navigate("/" + mod.name.toLowerCase().replace(/_/g, "-"))
      }
      style={{
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: expanded ? "10px" : "0",
        padding: "10px 15px",
        borderRadius: "5px",
        color: "#fff",
      }}
    >
      {iconMap[mod.name.toUpperCase()] || <FaBox />}
      {expanded && <span>{formatModuleName(mod.name)}</span>}
    </div>
  );

  return (
    <div
      className={`sidebar ${expanded ? "expanded" : ""}`}
      style={{
        display: "flex",
        flexDirection: "column",
        width: expanded ? "220px" : "60px",
        transition: "width 0.3s",
        height: `calc(100vh - 60px)`,
        position: "fixed",
        top: "60px",
        zIndex: 1000,
        backgroundColor: "#1f2937",
        overflow: "hidden",
      }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => {
        setExpanded(false);
        setSubmenu(null);
      }}
    >
      {/* Main Menu */}
      {submenu === null && (
        <div
            style={{
              width: "220px",
              paddingTop: "10px",
              overflowY: "auto",
              height: "100%",
              scrollbarWidth: "none", // Firefox
              msOverflowStyle: "none", // IE/Edge
            }}
            className="scroll-container"
          >
          {mainModules.map(renderModuleItem)}

          {masterModules.length > 0 && (
            <div
              className="menu-item"
              onClick={() => setSubmenu("master")}
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: expanded ? "10px" : "0",
                padding: "10px 15px",
                borderRadius: "5px",
                color: "#fff",
              }}
            >
              <FaUsers />
              {expanded && <span>Master</span>}
            </div>
          )}

          {reportModules.length > 0 && (
            <div
              className="menu-item"
              onClick={() => setSubmenu("report")}
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: expanded ? "10px" : "0",
                padding: "10px 15px",
                borderRadius: "5px",
                color: "#fff",
              }}
            >
              <FaChartBar />
              {expanded && <span>Report</span>}
            </div>
          )}
        </div>
      )}

      {/* Master Submenu */}
      {submenu === "master" && masterModules.length > 0 && (
        <div style={{ width: "220px", paddingTop: "10px" }}>
          <div
            className="submenu-header"
            onClick={() => setSubmenu(null)}
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 15px",
              borderRadius: "5px",
              color: "#fff",
            }}
          >
            <FaArrowLeft /> <span>Back</span>
          </div>
          {masterModules.map(renderModuleItem)}
        </div>
      )}

      {/* Report Submenu */}
      {submenu === "report" && reportModules.length > 0 && (
        <div style={{ width: "220px", paddingTop: "10px" }}>
          <div
            className="submenu-header"
            onClick={() => setSubmenu(null)}
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 15px",
              borderRadius: "5px",
              color: "#fff",
            }}
          >
            <FaArrowLeft /> <span>Back</span>
          </div>
          {reportModules.map(renderModuleItem)}
        </div>
      )}
    </div>
  );
};

export default Sidebar;
