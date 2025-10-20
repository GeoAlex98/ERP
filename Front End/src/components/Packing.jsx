// src/components/Packing.jsx
import "../styles/common.css";
import React, { useState, useEffect } from "react";
import { FaPlus, FaMinus } from "react-icons/fa";
import Sidebar from "./SideBar";
import axios from "axios";
import { useMessageAndConfirmation } from "../context/MessageAndConfirmation";

const Packing = () => {
  const { showMessage } = useMessageAndConfirmation();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [warnings, setWarnings] = useState({});

  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  // ✅ Fetch purchases and initialize adjust=0
  const fetchPurchases = async () => {
    try {
      const res = await axios.get("/api/packing/not-packed", config);
      const data = res.data || [];

      const withAdjust = data.map((p) => ({
        ...p,
        items: p.items.map((i) => ({
          ...i,
          adjust: 0,
        })),
      }));

      setPurchases(withAdjust);
    } catch (err) {
      console.error(err);
      await showMessage("Failed to fetch purchases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  // ✅ Update adjust locally and reflect packed/pending instantly
  const updateAdjust = (purchaseId, itemId, newVal) => {
    setPurchases((prev) =>
      prev.map((p) =>
        p.id === purchaseId
          ? {
              ...p,
              items: p.items.map((i) => {
                if (i.id === itemId) {
                  const newPacked = i.packed + newVal;
                  const newPending = i.quantity - newPacked;
                  return {
                    ...i,
                    adjust: newVal,
                    tempPacked: newPacked,
                    tempPending: newPending,
                  };
                }
                return i;
              }),
            }
          : p
      )
    );
  };

  // ✅ Increment adjust
  const handleIncrement = (purchaseId, itemId, max) => {
    setPurchases((prev) =>
      prev.map((p) =>
        p.id === purchaseId
          ? {
              ...p,
              items: p.items.map((i) => {
                const pending = i.quantity - i.packed;
                if (i.id === itemId && i.adjust < pending) {
                  const newVal = i.adjust + 1;
                  const newPacked = i.packed + newVal;
                  const newPending = i.quantity - newPacked;
                  return {
                    ...i,
                    adjust: newVal,
                    tempPacked: newPacked,
                    tempPending: newPending,
                  };
                }
                return i;
              }),
            }
          : p
      )
    );
    clearWarning(purchaseId, itemId);
  };

  // ✅ Decrement adjust
  const handleDecrement = (purchaseId, itemId) => {
    setPurchases((prev) =>
      prev.map((p) =>
        p.id === purchaseId
          ? {
              ...p,
              items: p.items.map((i) => {
                if (i.id === itemId && i.adjust > 0) {
                  const newVal = i.adjust - 1;
                  const newPacked = i.packed + newVal;
                  const newPending = i.quantity - newPacked;
                  return {
                    ...i,
                    adjust: newVal,
                    tempPacked: newPacked,
                    tempPending: newPending,
                  };
                }
                return i;
              }),
            }
          : p
      )
    );
    clearWarning(purchaseId, itemId);
  };

  // ✅ Direct input for adjust
  const handleDirectInput = (purchaseId, itemId, value, max) => {
    let newVal = parseInt(value, 10);
    if (isNaN(newVal)) newVal = 0;

    if (newVal < 0) {
      newVal = 0;
      setWarning(purchaseId, itemId, "⚠️ Quantity cannot be negative");
    } else if (newVal > max) {
      newVal = max;
      setWarning(purchaseId, itemId, "⚠️ Quantity cannot exceed pending");
    } else {
      clearWarning(purchaseId, itemId);
    }

    updateAdjust(purchaseId, itemId, newVal);
  };

  const setWarning = (purchaseId, itemId, message) => {
    const key = `${purchaseId}-${itemId}`;
    setWarnings((prev) => ({ ...prev, [key]: message }));
    setTimeout(() => {
      setWarnings((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }, 3000);
  };

  const clearWarning = (purchaseId, itemId) => {
    const key = `${purchaseId}-${itemId}`;
    setWarnings((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  // ✅ Update backend and reset properly with grouped payload
  const handleUpdate = async () => {
    try {
      // Build grouped payload: { purchaseId: [{purchaseDetailId, referenceNo, packedQuantity}, ...], ... }
      const groupedPayload = {};

      purchases.forEach((p) => {
        const itemsToUpdate = p.items
          .filter((i) => i.adjust > 0)
          .map((i) => ({
            purchaseDetailId: i.id,
            referenceNo: i.referenceNo,
            packedQuantity: i.packed + i.adjust,
          }));

        if (itemsToUpdate.length > 0) {
          groupedPayload[p.id] = itemsToUpdate;
        }
      });

      if (Object.keys(groupedPayload).length === 0) return;

      await axios.post("/api/packing/update-stock", groupedPayload, config);
      await showMessage("Items updated in stock successfully ✅");

      // Reload fresh data from backend and reset adjust
      await fetchPurchases();
      setWarnings({});
    } catch (err) {
      console.error(err);
      await showMessage("Failed to update stock");
    }
  };

  const isUpdateDisabled =
    purchases.length === 0 ||
    purchases.every((p) => p.items.every((i) => i.adjust === 0));

  return (
    <div className="d-flex app-wrapper moduleBody" style={{ overflowY: "hidden" }}>
      <Sidebar expanded={sidebarExpanded} onToggle={setSidebarExpanded} />

      <div style={{
        flexGrow: 1,
        marginLeft: sidebarExpanded ? "200px" : "60px",
        transition: "margin-left 0.3s ease",
        padding: "25px 20px",
        overflowX: "hidden",
        overflowY: "hidden",
      }}>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div style={{ flex: 1 }}></div>
          <h2
            className="mb-0 text-center"
            style={{ flex: "auto", fontWeight: 700, color: "#333" }}
          >
            Packing
          </h2>
          <div style={{ flex: 1, marginTop: "5px" }} className="text-end">
            <button
              className="btn btn-success"
              disabled={isUpdateDisabled}
              onClick={handleUpdate}
            >
              Update
            </button>
          </div>
        </div>

        {/* Content */}
        {purchases.length === 0 ? (
          <div
            className="d-flex justify-content-center align-items-center moduleFormBackground"
            style={{
              height: "75vh",
              fontSize: "1.2rem",
              fontWeight: "600",
              color: "#777",
            }}
          >
            No Packings Pending
          </div>
        ) : (
          <div className="d-flex flex-column gap-1">
            {purchases.map((purchase) => (
              <div
                key={purchase.id}
                className="card p-3 shadow-sm"
                style={{
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.9)",
                }}
              >
                {/* Purchase header */}
                <div className="d-flex justify-content-between mb-2">
                  <h5 className="mb-0">
                    <span
                      style={{
                        fontSize: "1.1rem",
                        fontWeight: "700",
                      }}
                    >
                      Purchase #: {purchase.purchaseNumber}
                    </span>
                  </h5>
                  <span>{new Date(purchase.date).toLocaleDateString()}</span>
                </div>

                {/* Item header */}
                <div className="d-flex fw-bold text-center p-2 border-bottom">
                  <div style={{ flex: 1 }} className="text-start">Ref No</div>
                  <div style={{ flex: 1.5 }} className="text-start">
                    Item
                  </div>
                  <div style={{ flex: 1 }}>Color</div>
                  <div style={{ flex: 1 }}>Size</div>
                  <div style={{ flex: 1 }}>Ordered</div>
                  <div style={{ flex: 1 }}>Packed</div>
                  <div style={{ flex: 1 }}>Pending</div>
                  <div style={{ width: 180 }}>Adjust</div>
                </div>

                {/* Items list */}
                {purchase.items.map((item) => {
                  const packedDisplay =
                    item.tempPacked !== undefined
                      ? item.tempPacked
                      : item.packed;
                  const pendingDisplay =
                    item.tempPending !== undefined
                      ? item.tempPending
                      : item.quantity - item.packed;

                  const warningKey = `${purchase.id}-${item.id}`;
                  const warning = warnings[warningKey];

                  return (
                    <div
                      key={item.id}
                      className="d-flex flex-column bg-light rounded p-2"
                    >
                      <div className="d-flex align-items-center justify-content-between">
                        <div style={{ flex: 1 }} className="text-start">
                          {item.referenceNo || "-"}
                        </div>
                        <div style={{ flex: 1.5 }}>{item.name}</div>
                        <div style={{ flex: 1 }} className="text-center">
                          {item.color || "-"}
                        </div>
                        <div style={{ flex: 1 }} className="text-center">
                          {item.size || "-"}
                        </div>
                        <div style={{ flex: 1 }} className="text-center">
                          {item.quantity}
                        </div>
                        <div style={{ flex: 1 }} className="text-center">
                          {packedDisplay}
                        </div>
                        <div style={{ flex: 1 }} className="text-center">
                          {pendingDisplay}
                        </div>

                        {/* Adjust controls */}
                        <div
                          className="d-flex align-items-center justify-content-center gap-2"
                          style={{ width: 180 }}
                        >
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            disabled={item.adjust <= 0}
                            onClick={() => handleDecrement(purchase.id, item.id)}
                          >
                            <FaMinus />
                          </button>

                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={item.adjust}
                            onChange={(e) =>
                              handleDirectInput(
                                purchase.id,
                                item.id,
                                e.target.value,
                                item.quantity - item.packed
                              )
                            }
                            className="form-control form-control-sm text-center no-arrows"
                            style={{ width: 60 }}
                          />

                          <button
                            className="btn btn-sm btn-outline-secondary"
                            disabled={item.adjust >= item.quantity - item.packed}
                            onClick={() =>
                              handleIncrement(
                                purchase.id,
                                item.id,
                                item.quantity - item.packed
                              )
                            }
                          >
                            <FaPlus />
                          </button>
                        </div>
                      </div>

                      {warning && (
                        <div className="text-danger small mt-1 text-end">
                          {warning}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hide number arrows */}
      <style>
        {`
          .no-arrows::-webkit-inner-spin-button,
          .no-arrows::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          .no-arrows {
            -moz-appearance: textfield;
          }
        `}
      </style>
    </div>
  );
};

export default Packing;
