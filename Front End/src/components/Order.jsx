// src/components/Order.jsx
import "../styles/common.css";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Sidebar from "./SideBar";
import { useMessageAndConfirmation } from "../context/MessageAndConfirmation";

const apiBase = "http://localhost:9070/api";

const emptyRow = () => ({
  itemId: "",
  size: "",
  color: "",
  quantity: "",
  price: "",
  rowTotal: 0,
  sizesForItem: [],
  colorsForItem: [],
});

const Order = () => {
  const { showMessage, showConfirm } = useMessageAndConfirmation();
  // Utility function
  const formatDate = (isoDate) => {
    if (!isoDate) return "";
    const d = new Date(isoDate);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const today = new Date().toISOString().slice(0, 10);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [retailers, setRetailers] = useState([]);
  const [items, setItems] = useState([]);
  const [financialYears, setFinancialYears] = useState([]);
  const [orderDetails, setOrderDetails] = useState({
    id: null,
    orderNo: "",
    orderDate: today,
    retailerId: "",
    totalAmount: 0,
    pendingAmount: 0,
  });
  const [orderDetail, setOrderDetail] = useState([emptyRow()]);
  const [mode, setMode] = useState("create");
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [allOrders, setAllOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const tableRefs = useRef([]);
  const readOnly = mode === "search";
  const [loadingOrders, setLoadingOrders] = useState(false);

  const closeSearchModal = () => {
    setSearchModalOpen(false);
    setSearchTerm("");
  };

  const normalize = (str) =>
      String(str || "")
        .toLowerCase()
        .replace(/[\s-/]/g, "");

  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  // Fetch Retailers
  const fetchRetailers = async () => {
    try {
      const res = await axios.get(`${apiBase}/retailers/dropdown`, config);
      setRetailers(res.data || []);
    } catch (err) {
      console.error(err);
      setRetailers([]);
    }
  };

  // Fetch Items
  const fetchItems = async () => {
    try {
      const res = await axios.get(`${apiBase}/items/dropdown`, config);
      setItems(res.data || []);
    } catch (err) {
      console.error(err);
      setItems([]);
    }
  };

  // Fetch Financial Years
  const fetchFinancialYears = async () => {
    try {
      const res = await axios.get(`${apiBase}/financialYear`, config);
      setFinancialYears(res.data || []);
    } catch (err) {
      console.error(err);
      setFinancialYears([]);
    }
  };

  useEffect(() => {
    fetchRetailers();
    fetchItems();
    fetchFinancialYears();
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        setLoadingOrders(true);
        axios
          .get(`${apiBase}/orders?keyword=${searchTerm}`, config)
          .then(res => setAllOrders(res.data || []))
          .catch(() => setAllOrders([]))
          .finally(() => setLoadingOrders(false));
      }
    }, 400);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  // Recalculate total
  useEffect(() => {
    const total = orderDetail.reduce((sum, r) => {
      const qty = parseInt(r.quantity) || 0;
      const price = parseFloat(r.price) || 0;
      return sum + qty * price;
    }, 0);
    setOrderDetails(od => ({ ...od, totalAmount: +total.toFixed(2) }));
  }, [orderDetail]);

  const updateRow = (index, patch) => {
    setOrderDetail(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...patch };
      const qty = parseInt(copy[index].quantity) || 0;
      const price = parseFloat(copy[index].price) || 0;
      copy[index].rowTotal = +(qty * price).toFixed(2);
      const totalAmt = copy.reduce((s, r) => s + (parseFloat(r.rowTotal) || 0), 0);
      setOrderDetails(od => ({ ...od, totalAmount: +totalAmt.toFixed(2) }));
      return copy;
    });
  };

  const handleItemSelect = (index, itemId) => {
    const item = items.find(it => String(it.id) === String(itemId));
    updateRow(index, {
      itemId,
      price: item?.price || "",
      sizesForItem: item?.sizes || [],
      colorsForItem: item?.colors || [],
      size: "",
      color: "",
    });
  };

  const addRow = () => {
    const allFilled = orderDetail.every(r => r.itemId && r.size && r.color && r.quantity);
    if (!allFilled) return;
    setOrderDetail(prev => [...prev, emptyRow()]);
  };

  const removeRow = index => {
    setOrderDetail(prev => {
      if (prev.length === 1) return [emptyRow()];
      const copy = prev.filter((_, i) => i !== index);
      const totalAmt = copy.reduce((s, r) => s + (parseFloat(r.rowTotal) || 0), 0);
      setOrderDetails(od => ({ ...od, totalAmount: +totalAmt.toFixed(2) }));
      return copy;
    });
  };

  const validatePayload = async () => {
    if (!orderDetails.retailerId) {
      await showMessage("Please select a retailer.");
      return false;
    }
    const hasItem = orderDetail.some(r => r.itemId && r.size && r.color && r.quantity && parseInt(r.quantity) > 0);
    if (!hasItem) {
      await showMessage("Please add at least one item with size, color and quantity.");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    const isValid = await validatePayload();
    if (!isValid) return;

    const payload = {
      orderDate: orderDetails.orderDate,
      retailer: { id: orderDetails.retailerId },
      totalAmount: orderDetails.totalAmount.toFixed(2),
      orderDetail: orderDetail.filter(r => r.itemId && r.size && r.color && r.quantity).map(r => ({
        id: r.id || null,
        item: { id: r.itemId },
        size: r.size,
        color: r.color,
        quantity: parseInt(r.quantity),
        price: parseFloat(r.price).toFixed(2),
        totalAmt: r.rowTotal.toFixed(2),
      })),
    };

    try {
      if (mode === "edit") {
        await axios.put(`${apiBase}/orders/${orderDetails.id}`, payload, config);
        await showMessage("Updated successfully.");
      } else {
        const res = await axios.post(`${apiBase}/orders`, payload, config);
        const orderNo = res.data.orderNo ?? "N/A";
        await showMessage(`Saved with Order No: ${orderNo}`);
      }
      setMode("create");
      setOrderDetails(od => ({ ...od, id: null, orderNo: null, pendingAmount: 0 }));
      setOrderDetail([emptyRow()]);
    } catch (err) {
      await showMessage("Failed to save.");
    }
  };

  const handleEdit = async () => {
    if (!orderDetails.orderNo) {
      await showMessage("Load an order first.");
      return;
    }
    setMode("edit");
  };

  const handleDelete = async () => {
    if (!orderDetails.id) {
      await showMessage("Load an order first.");
      return;
    }
    const confirmed = await showConfirm("Are you sure you want to delete this order?");
    if (!confirmed) return;
    try {
      await axios.delete(`${apiBase}/orders/${orderDetails.id}`, config);
      await showMessage("Deleted.");
      setOrderDetails(od => ({ ...od, id: null, orderNo: null, pendingAmount: 0 }));
      setOrderDetail([emptyRow()]);
      setMode("create");
    } catch (err) {
      await showMessage("Failed to delete.");
    }
  };

  const handleCancel = () => {
    setMode("create");
    setOrderDetails({
      id: null,
      orderNo: null,
      orderDate: today,
      retailerId: "",
      totalAmount: 0,
      pendingAmount: 0,
    });
    setOrderDetail([emptyRow()]);
  };

  const loadOrder = async (order) => {
    if (!order) return;
    try {
      const res = await axios.get(`${apiBase}/orders/${order.value}`, config);
      const data = res.data;

      if (data.retailer && !retailers.some(r => r.id === data.retailer.id)) {
        setRetailers(prev => [...prev, data.retailer]);
      }

      setOrderDetails({
        id: data.id || null,
        orderNo: data.orderNo || null,
        orderDate: data.orderDate ? data.orderDate.slice(0, 10) : "",
        retailerId: data.retailer?.id || "",
        totalAmount: data.totalAmount || 0,
        pendingAmount: data.pendingAmount || 0,
      });

      const rows = (data.orderDetail || []).map(od => ({
        id: od.id || null,
        itemId: od.item?.id || "",
        size: od.size || "",
        color: od.color || "",
        quantity: od.quantity || "",
        price: od.price || "",
        rowTotal: od.totalAmt || +((od.quantity || 0) * (od.price || 0)).toFixed(2),
        sizesForItem: od.sizesForItem || [],
        colorsForItem: od.colorsForItem || [],
      }));

      setOrderDetail(rows.length ? rows : [emptyRow()]);
      setMode("search");
    } catch (err) {
      await showMessage("Failed to load order");
    }
  };

  const handleCellChange = async (index, field, value) => {
    setOrderDetail(prev => {
      const copy = [...prev];
      const row = { ...copy[index], [field]: value };
      const duplicateExists = copy.some(
        (r, i) =>
          i !== index &&
          String(r.itemId) === String(row.itemId) &&
          r.size === row.size &&
          r.color === row.color &&
          r.itemId &&
          r.size &&
          r.color
      );
      if (duplicateExists) {
        showMessage("This Item–Size–Color combination already exists.");
        return prev;
      }
      copy[index] = row;
      const qty = parseInt(row.quantity) || 0;
      const price = parseFloat(row.price) || 0;
      copy[index].rowTotal = +(qty * price).toFixed(2);
      const totalAmt = copy.reduce((s, r) => s + (parseFloat(r.rowTotal) || 0), 0);
      setOrderDetails(od => ({ ...od, totalAmount: +totalAmt.toFixed(2) }));
      return copy;
    });
  };

  const handleKeyDown = (e, rowIndex, colIndex) => {
    if (e.key === "Delete") {
      e.preventDefault();
      removeRow(rowIndex);
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (rowIndex < orderDetail.length - 1) {
        focusCell(rowIndex + 1, colIndex);
      } else if (rowIndex === orderDetail.length - 1 && colIndex === 4) {
        addRow();
        setTimeout(() => focusCell(rowIndex + 1, 0), 50);
      }
    }
  };

  const focusCell = (rowIndex, colIndex) => {
    const key = rowIndex * 10 + colIndex;
    const el = tableRefs.current[key];
    if (el && el.focus) el.focus();
  };

  const registerRef = (el, rowIndex, colIndex) => {
    const key = rowIndex * 10 + colIndex;
    tableRefs.current[key] = el;
  };

  // ------------------ JSX ------------------
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
        <div className="d-flex align-items-center justify-content-between mb-1"
          style={{ position: "sticky", top: 0, zIndex: 10, padding: "5px 0",
              borderRadius: "8px"}}>
          <div className="d-flex align-items-center gap-2 ms-1">
            {(mode === "create" || mode === "search") && (
              <button
                className="btn btn-sm btn-dark d-flex align-items-center gap-1"
                onClick={() => {
                  setLoadingOrders(true);
                  axios.get(`${apiBase}/orders/all`, config)
                    .then(res => setAllOrders(res.data || []))
                    .catch(() => setAllOrders([]))
                    .finally(() => setLoadingOrders(false));
                  setSearchModalOpen(true);
                }}
              >
                Search
              </button>
            )}
          </div>
          <h2 className="mb-0 text-center flex-grow-1" style={{ margin: 0, fontWeight: 700, color: "#333" }}>Order</h2>
          <div className="btn-group ms-auto d-flex flex-wrap" style={{ gap: "5px", right: "5px"}}>
            {mode === "create" && (
              <>
                <button className="btn btn-sm btn-success" onClick={handleSave}>Save</button>
                <button className="btn btn-sm btn-secondary" onClick={handleCancel}>Cancel</button>
              </>
            )}
            {mode === "edit" && (
              <>
                <button className="btn btn-sm btn-success" onClick={handleSave}>Save</button>
                <button className="btn btn-sm btn-secondary" onClick={handleCancel}>Cancel</button>
              </>
            )}
            {mode === "search" && (
              <>
                <button className="btn btn-sm btn-primary" onClick={handleEdit}>Edit</button>
                <button className="btn btn-sm btn-danger" onClick={handleDelete}>Delete</button>
                <button className="btn btn-sm btn-secondary" onClick={handleCancel}>Cancel</button>
              </>
            )}
          </div>
        </div>

        {/* Top form */}
        <div className="p-2 mb-1 moduleFormBackground">
          <div className="row align-items-end">
            <div className="col-12 col-md-2"  style={{ width: "9%" }}>
              <label className="form-label">Date</label>
              <input type="text" className="form-control form-control-sm" value={formatDate(orderDetails.orderDate)} disabled />
            </div>
            <div className="col-12 col-md-4">
              <label className="form-label">Retailer</label>
              <select className="form-select form-select-sm" value={orderDetails.retailerId} onChange={e => setOrderDetails(od => ({ ...od, retailerId: e.target.value }))} disabled={readOnly}>
                <option value="">-- Select Retailer --</option>
                {retailers.map(r => <option key={r.id} value={r.id}>{r.retailerName}</option>)}
              </select>
            </div>
            <div className="col-12 col-md-2">
              <label className="form-label">Pending Amount</label>
              <input type="text" className="form-control form-control-sm" value={orderDetails.pendingAmount.toFixed(2)} disabled />
            </div>
          </div>
        </div>

        {/* Items table card */}
        <div className="p-2 mb-1 moduleFormBackground" style={{ display: "flex", flexDirection: "column" }}>
          <div style={{
            width: "100%",
            height: "310px",
            overflowY: "auto",
            overflowX: "hidden",
            position: "relative",
            borderRadius: "6px",
            scrollbarWidth: "thin",
          }}>
            <table className="table table-sm table-bordered mb-0 sticky-table">
              <thead className="table-dark" style={{ position: "sticky", top: 0, zIndex: 5 }}>
                <tr>
                  <th style={{ width: "5%", fontWeight: "bold" }}>SL No</th>
                  <th style={{ width: "30%", fontWeight: "bold" }}>Item Name</th>
                  <th style={{ width: "10%", fontWeight: "bold" }}>Size</th>
                  <th style={{ width: "15%", fontWeight: "bold" }}>Color</th>
                  <th style={{ width: "8%", fontWeight: "bold" }}>Quantity</th>
                  <th style={{ width: "12%", fontWeight: "bold" }}>Price</th>
                  <th style={{ width: "12%", fontWeight: "bold" }}>Total</th>
                  <th style={{ width: "2%", fontWeight: "bold" }}>
                    <div style={{textAlign: "right" }}>
                       <button
                         className="btn btn-sm"
                         style={{ color: "white", border: "none" }}
                         onClick={addRow}
                         disabled={readOnly}
                       >
                         +
                       </button>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {orderDetail.map((row, rowIndex) => (
                  <tr key={rowIndex} style={{ userSelect: "text", backgroundColor: "white" }}>
                    <td className="align-middle text-center">{rowIndex + 1}</td>
                    <td>
                      <select
                        className="form-select form-select-sm border-0"
                        value={row.itemId}
                        disabled={readOnly}
                        onChange={(e) => handleItemSelect(rowIndex, e.target.value)}
                        ref={(el) => registerRef(el, rowIndex, 0)}
                      >
                        <option value="">--Select Item--</option>
                        {items.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
                      </select>
                    </td>
                    <td>
                      <select
                        className="form-select form-select-sm border-0"
                        value={row.size}
                        disabled={readOnly || !row.itemId}
                        onChange={(e) => handleCellChange(rowIndex, "size", e.target.value)}
                        ref={(el) => registerRef(el, rowIndex, 1)}
                      >
                        <option value="">--Select Size--</option>
                        {row.sizesForItem.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td>
                      <select
                        className="form-select form-select-sm border-0"
                        value={row.color}
                        disabled={readOnly || !row.itemId}
                        onChange={(e) => handleCellChange(rowIndex, "color", e.target.value)}
                        ref={(el) => registerRef(el, rowIndex, 2)}
                      >
                        <option value="">--Select Color--</option>
                        {row.colorsForItem.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-control form-control-sm no-spinner text-end border-0"
                        value={parseInt(row.quantity || 0)}
                        disabled={readOnly || !row.itemId}
                        onChange={(e) => handleCellChange(rowIndex, "quantity", e.target.value)}
                        ref={(el) => registerRef(el, rowIndex, 3)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-control form-control-sm no-spinner text-end border-0"
                        value={parseFloat(row.price || 0).toFixed(2)}
                        disabled={readOnly}
                        onChange={(e) => handleCellChange(rowIndex, "price", e.target.value)}
                        ref={(el) => registerRef(el, rowIndex, 4)}
                      />
                    </td>
                    <td className="text-end align-middle">{parseFloat(row.rowTotal || 0).toFixed(2)}</td>
                    <td className="text-center">
                      <button
                        className="btn btn-sm"
                        style={{ backgroundColor: "white", color: "black", border: "none" }}
                        onClick={() => removeRow(rowIndex)}
                        disabled={readOnly}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total Amount display */}
          <div className="p-2 mt-0 mb-1 moduleFormBackground">
            <div className="d-flex justify-content-end align-items-center" style={{ gap: "8px" }}>
              <label className="mb-0">Total Amount:</label>
              <input
                type="number"
                className="form-control form-control-sm text-end no-spinner"
                value={orderDetails.totalAmount.toFixed(2)}
                disabled
                readOnly
                style={{ width: "120px" }}
              />
            </div>
          </div>

          {/* Search Modal */}
          <div
            className={`modal fade ${searchModalOpen ? "show d-block" : "d-none"}`}
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
              <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header py-2">
                    <h5 className="modal-title mb-2 fw-bold fs-4">Search Orders</h5>
                    <button className="btn-close" onClick={closeSearchModal}></button>
                  </div>
                  <div className="modal-body py-1">
                    <input
                      type="text"
                      className="form-control mb-1"
                      placeholder="Search by order no, retailer..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      disabled={loadingOrders}
                    />
                    {loadingOrders ? (
                      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "350px" }}>
                        <div className="spinner-border text-dark" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ minHeight:"350px", maxHeight: "350px", overflowY: "auto", borderRadius: "6px", scrollbarWidth: "thin"}}>
                        <table className="table table-sm table-hover">
                          <thead className="table-dark" style={{ position: "sticky", top: 0, zIndex: 5 }}>
                            <tr>
                              <th style={{ width: "25%" }}>Order No</th>
                              <th style={{ width: "20%" }}>Date</th>
                              <th style={{ width: "40%" }}>Retailer</th>
                              <th style={{ width: "15%" }}>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {allOrders
                              .filter(o => {
                                  const term = normalize(searchTerm);
                                  return (
                                    !term ||
                                    normalize(o.orderNo).includes(term) ||
                                    normalize(o.retailer?.retailerName).includes(term) ||
                                    normalize(formatDate(o.orderDate)).includes(term)
                                  );
                              })
                              .map(o => (
                                <tr key={o.orderNo} style={{ cursor: "pointer" }}
                                  onClick={() => { loadOrder({ value: o.orderNo }); setSearchModalOpen(false); }}>
                                  <td>{o.orderNo}</td>
                                  <td>{formatDate(o.orderDate)}</td>
                                  <td>{o.retailer?.retailerName}</td>
                                  <td className="text-end">{parseFloat(o.totalAmount || 0).toFixed(2)}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );


};

export default Order;
