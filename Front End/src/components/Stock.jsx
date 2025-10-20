import "../styles/common.css";
import React, { useState, useEffect } from "react";
import Sidebar from "./SideBar";
import axios from "axios";
import { useMessageAndConfirmation } from "../context/MessageAndConfirmation";

const Stock = () => {
  const { showMessage } = useMessageAndConfirmation();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [stocks, setStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInPacking, setShowInPacking] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  // Fetch stock data
  const fetchStock = async () => {
    try {
      const res = await axios.get("/api/stock/all", config);
      const data = res.data || [];
      setStocks(data);
      setFilteredStocks(data);
    } catch (err) {
      console.error(err);
      await showMessage("Failed to fetch stock data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  // Filter by search term
  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = stocks.filter(
      (item) =>
        item.itemCode?.toLowerCase().includes(term) ||
        item.name?.toLowerCase().includes(term) ||
        item.color?.toLowerCase().includes(term) ||
        item.size?.toLowerCase().includes(term)
    );
    setFilteredStocks(filtered);
  }, [searchTerm, stocks]);

  // Group by item
  const groupedStocks = filteredStocks.reduce((acc, curr) => {
    const key = `${curr.itemCode}-${curr.name}`;
    if (!acc[key]) acc[key] = { itemCode: curr.itemCode, name: curr.name, variants: [] };
    acc[key].variants.push(curr);
    return acc;
  }, {});

  // Group variants by size
  const groupVariantsBySize = (variants) => {
    const map = {};
    variants.forEach((v) => {
      if (!map[v.size]) map[v.size] = [];
      map[v.size].push(v);
    });
    return map;
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".share-dropdown-trigger")) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="d-flex app-wrapper moduleBody" style={{ overflowY: "hidden" }}>
      <Sidebar expanded={sidebarExpanded} onToggle={setSidebarExpanded} />

      <div
        style={{
          flexGrow: 1,
          marginLeft: sidebarExpanded ? "200px" : "60px",
          transition: "margin-left 0.3s ease",
          padding: "25px 20px",
          overflowX: "hidden",
          overflowY: "auto",
        }}
      >
        {/* Header + Search */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          {/* Left: Search Bar */}
          <div style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="Search  code /name /color /size"
              className="form-control"
              style={{ maxWidth: 250 }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Center: Title */}
          <h2 className="mb-0 text-center" style={{ flex: 1, fontWeight: 700, color: "#333" }}>
            Stock
          </h2>

          {/* Right: Buttons */}
          <div style={{ flex: 1 }} className="text-end position-relative">
            {/* Toggle In Packing */}
            <div className="form-check form-switch d-inline-block me-2">
              <input
                className="form-check-input"
                type="checkbox"
                id="inPackingSwitch"
                checked={showInPacking}
                onChange={() => setShowInPacking((prev) => !prev)}
              />
              <label
                className="form-check-label"
                htmlFor="inPackingSwitch"
                style={{ userSelect: "none", fontWeight: 500 }}
              >
                In Packing
              </label>
            </div>


            {/* Share Icon */}
            <button
              className="btn btn-outline-secondary share-dropdown-trigger"
              onClick={() => setShowDropdown((prev) => !prev)}
              style={{ color: "#000", borderColor: "#000" }}
            >
              <i className="fa fa-share-alt"></i>
            </button>

            {/* Dummy Dropdown */}
            {showDropdown && (
              <div
                className="dropdown-menu show"
                style={{
                  position: "absolute",
                  right: 0,
                  top: "100%",
                  marginTop: "5px",
                  minWidth: "180px",
                  zIndex: 1000,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  borderRadius: "10px",
                  overflow: "hidden",
                  backgroundColor: "#fff",
                }}
              >
                <button className="dropdown-item">Option 1</button>
                <button className="dropdown-item">Option 2</button>
                <button className="dropdown-item">Option 3</button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div
            className="d-flex justify-content-center align-items-center moduleFormBackground"
            style={{
              height: "75vh",
              fontSize: "1.1rem",
              fontWeight: "600",
              color: "#777",
            }}
          >
            Loading stock data...
          </div>
        ) : Object.keys(groupedStocks).length === 0 ? (
          <div
            className="d-flex justify-content-center align-items-center moduleFormBackground"
            style={{
              height: "75vh",
              fontSize: "1.2rem",
              fontWeight: "600",
              color: "#777",
            }}
          >
            No Stock Records Found
          </div>
        ) : (
          <div
            className="stock-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "15px",
            }}
          >
            {Object.values(groupedStocks).map((group) => {
              const variantsBySize = groupVariantsBySize(group.variants);
              return (
                <div key={group.itemCode} className="bg-white p-3 shadow-sm rounded">
                  {/* Block Header */}
                  <div
                    className="d-flex justify-content-between align-items-center mb-2 p-2"
                    style={{
                      backgroundColor: "#000", // black background
                      color: "#fff",           // white text
                      borderRadius: "5px 5px 0 0",
                    }}
                  >
                    <h5 className="mb-0">{group.name}</h5>
                    <span>{group.itemCode}</span>
                  </div>


                  {/* Size rows */}
                  {Object.keys(variantsBySize).map((size) => (
                    <div key={size} className="d-flex mb-3">
                      {/* Size column */}
                      <div style={{ minWidth: 40, fontWeight: 600, fontSize: 16 }}>{size}</div>

                      {/* Colors/Qty column */}
                      <div
                        className="d-flex flex-wrap gap-2"
                        style={{ flex: 1 }}
                      >
                        {variantsBySize[size].map((item, idx) => (
                          <div
                            key={item.id}
                            className="variant-chip p-2 border rounded d-flex align-items-center justify-content-center"
                            style={{
                              width: 100, // fixed width
                              height: 40,
                              gap: "5px",
                              fontSize: 14,
                              fontWeight: 500,
                              backgroundColor: "#f1f3f5",
                              flexShrink: 0,
                            }}
                          >
                            <span
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: "50%",
                                backgroundColor: item.color || "#ccc",
                                border: "1px solid #999",
                              }}
                            ></span>
                            {item.color} / {item.stockQuantity}
                            {showInPacking && ` / ${item.inPacking ?? 0}`}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Stock;
