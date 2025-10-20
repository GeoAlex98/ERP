import "../styles/common.css";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaSave } from "react-icons/fa";
import Sidebar from "./SideBar";
import { useMessageAndConfirmation } from "../context/MessageAndConfirmation";

const DEFAULT_SIDEBAR_COLOR = "#343a40";

function rgbStringToHex(rgb) {
  if (!rgb) return DEFAULT_SIDEBAR_COLOR;
  rgb = rgb.trim();
  if (rgb.startsWith("#")) return rgb;
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!m) return DEFAULT_SIDEBAR_COLOR;
  const r = parseInt(m[1], 10);
  const g = parseInt(m[2], 10);
  const b = parseInt(m[3], 10);
  return "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("");
}

function getContrastColor(hex) {
  if (!hex) return "#fff";
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  const srgb = [r, g, b].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  const lum = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  return lum > 0.5 ? "#000" : "#fff";
}

const ModuleMaster = () => {
  const token = localStorage.getItem("token");
  const { showMessage, showConfirm } = useMessageAndConfirmation();

  const [modules, setModules] = useState([]);
  const [search, setSearch] = useState("");
  const [editingModules, setEditingModules] = useState({});
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [headerBg, setHeaderBg] = useState(DEFAULT_SIDEBAR_COLOR);
  const [selectAll, setSelectAll] = useState(false);

  // fetch modules
  const fetchModules = async () => {
    try {
      const res = await axios.get("/api/modules/all", { headers: { Authorization: `Bearer ${token}` }});
      const data = res.data || [];
      setModules(data);
      setEditingModules(data.reduce((acc, m) => { acc[m.id] = { ...m }; return acc; }, {}));
      return data;
    } catch (e) {
      console.error(e);
      await showMessage("Failed to fetch modules ❌");
      return [];
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  // detect sidebar background
  useEffect(() => {
    try {
      const selectors = [
        ".sidebar",
        "#sidebar",
        "aside.sidebar",
        "nav.sidebar",
        ".SideBar",
        ".side-bar",
        ".sidebar-container",
      ];
      let el = null;
      for (const s of selectors) {
        el = document.querySelector(s);
        if (el) break;
      }
      if (!el) el = document.querySelector("aside") || document.querySelector("nav");
      if (el) setHeaderBg(rgbStringToHex(getComputedStyle(el).backgroundColor));
      else setHeaderBg(DEFAULT_SIDEBAR_COLOR);
    } catch (e) {
      setHeaderBg(DEFAULT_SIDEBAR_COLOR);
    }
  }, []);

  // handle checkbox change
  const handleChange = (id, field, value) => {
    setEditingModules((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  // handle save all
  const handleSaveAll = async () => {
    const confirmed = await showConfirm("Do you want to save changes to all modules?");
    if (!confirmed) return;

    try {
      const res = await axios.put("/api/modules/update-all", Object.values(editingModules), {
        headers: { Authorization: `Bearer ${token}` },
      });

      await showMessage(res.data?.message || "Modules updated successfully ✅");

      // fetch fresh modules
      const updatedModules = await fetchModules();

      // update localStorage
      if (Array.isArray(updatedModules)) {
        localStorage.setItem("allowedModules", JSON.stringify(updatedModules));
      }

      // trigger refresh for Sidebar + App
      window.dispatchEvent(new Event('allowedModulesUpdated'));
      window.dispatchEvent(new Event('relaunchSidebar'));
    } catch (err) {
      console.error(err);
      await showMessage(err.response?.data?.message || "Failed to update modules ❌");
    }
  };

  // handle select all
  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    const newEditing = { ...editingModules };
    filteredModules.forEach((m) => {
      newEditing[m.id] = { ...newEditing[m.id], active: checked };
    });
    setEditingModules(newEditing);
  };

  const filteredModules = modules
    .filter((m) => m.name.toLowerCase() !== "module_master")
    .filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));

  const contrastColor = getContrastColor(headerBg);

  return (
    <div className="d-flex app-wrapper moduleBody">
      <Sidebar expanded={sidebarExpanded} onToggle={setSidebarExpanded} />

      <div
        className="main-content p-4"
        style={{
          flex: 1,
          marginLeft: sidebarExpanded ? "200px" : "60px",
          transition: "margin 0.3s",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          alignItems: "center",
        }}
      >
        <h2 className="mb-0 text-center flex-grow-1" style={{ margin: 0, fontWeight: 700, color: "#333" }}>Module Master</h2>

        <div style={{ width: "75%" }}>
          {/* search + save row */}
          <div className="d-flex align-items-center mb-2" style={{ justifyContent: "space-between", marginBottom: "8px" }}>
            <div style={{ display: "flex", gap: 0, width: 250 }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search module..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ borderRadius: "6px 0 0 6px", padding: "6px 8px", fontSize: "14px", height: "36px", flex: 1 }}
              />
              <button
                className="btn btn-outline-secondary"
                style={{ borderRadius: "0 6px 6px 0", padding: "0px 12px", height: "36px", fontSize: "14px" }}
                onClick={() => setSearch("")}
              >
                Clear
              </button>
            </div>

            {filteredModules.length > 0 && (
              <button
                className="btn btn-success"
                onClick={handleSaveAll}
                style={{ display: "flex", alignItems: "center", gap: "8px", height: "36px", fontSize: "14px" }}
              >
                <FaSave /> Update
              </button>
            )}
          </div>

          {/* table */}
          <div
            style={{
              border: "1px solid #e0e0e0",
              borderRadius: 8,
              boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
              maxHeight: "calc(100vh - 220px)",
              overflowY: "auto",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
            className="custom-scroll"
          >
            <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 14 }}>
              <thead
                style={{
                  position: "sticky",
                  top: 0,
                  background: headerBg,
                  color: contrastColor,
                  zIndex: 5,
                }}
              >
                <tr>
                  <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 700, borderBottom: `2px solid ${shadeColor(headerBg, -10)}` }}>
                    Module
                  </th>
                  <th style={{ width: 100, textAlign: "center", padding: "10px 14px", fontWeight: 700, borderBottom: `2px solid ${shadeColor(headerBg, -10)}` }}>
                    <input type="checkbox" checked={selectAll} onChange={(e) => handleSelectAll(e.target.checked)} /> Active
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredModules.map((m, i) => (
                  <tr
                    key={m.id}
                    style={{ background: i % 2 === 0 ? "#ffffff" : "#f7f7f7", transition: "background 0.15s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#eef6ff")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "#ffffff" : "#f7f7f7")}
                  >
                    <td style={{ padding: "10px 14px" }}>
                      <input
                        type="text"
                        className="form-control"
                        value={editingModules[m.id]?.name.replace(/_/g, " ") || ""}
                        disabled
                        style={{ border: "none", background: "transparent", fontWeight: 500, fontSize: 14, padding: 0, width: "100%" }}
                      />
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={editingModules[m.id]?.active || false}
                        onChange={(e) => handleChange(m.id, "active", e.target.checked)}
                        style={{ transform: "scale(1.05)" }}
                      />
                    </td>
                  </tr>
                ))}
                {filteredModules.length === 0 && (
                  <tr>
                    <td colSpan={2} style={{ padding: 18, color: "#777", textAlign: "center" }}>
                      No modules found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <style>{`
            .custom-scroll::-webkit-scrollbar { width: 0; height: 0; }
            .custom-scroll { scrollbar-width: none; -ms-overflow-style: none; }
          `}</style>
        </div>
      </div>
    </div>
  );
};

// tiny helper to darken/lighten a hex color
function shadeColor(hex, percent) {
  try {
    let h = hex.replace("#", "");
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const num = parseInt(h, 16);
    let r = (num >> 16) + Math.round((percent / 100) * 255);
    let g = ((num >> 8) & 0x00ff) + Math.round((percent / 100) * 255);
    let b = (num & 0x0000ff) + Math.round((percent / 100) * 255);
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return "#" + (r << 16 | g << 8 | b).toString(16).padStart(6, "0");
  } catch (e) {
    return hex;
  }
}

export default ModuleMaster;
