// src/components/Purchase.jsx
import "../styles/common.css";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Sidebar from "./SideBar";
import Select from "react-select";
import { useMessageAndConfirmation } from "../context/MessageAndConfirmation";

const apiBase = "http://localhost:9070/api"; // adapt as needed

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

const Purchase = () => {
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

  // ✅ All state you had before
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [dates, setDates] = useState([]);
  const [financialYears, setFinancialYears] = useState([]);
  const [purchaseDetails, setPurchaseDetails] = useState({
    id: null, // ✅ added purchase id
    purchaseInvoiceNo: null,
    purchaseDate: today,
    supplierId: "",
    totalAmount: 0,
    purchaseNumber: "",
  });
  const [purchaseDetail, setPurchaseDetail] = useState([emptyRow()]);
  const [mode, setMode] = useState("create");

  // 🔄 New search modal state
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [allPurchases, setAllPurchases] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const tableRefs = useRef([]);
  const readOnly = mode === "search";
  const [loadingPurchases, setLoadingPurchases] = useState(false);

  const closeSearchModal = () => {
    setSearchModalOpen(false);
    setSearchTerm("");
  };

  const normalize = (str) =>
    String(str || "")
      .toLowerCase()
      .replace(/[\s-/]/g, "");

  // 🔑 Token for API
  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` } };

  // ✅ Fetch suppliers
  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(`${apiBase}/suppliers/dropdown`, config);
      setSuppliers(response.data || []);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      setSuppliers([]);
    }
  };

  // ✅ Fetch items
  const fetchItems = async () => {
    try {
      const response = await axios.get(`${apiBase}/items/dropdown`, config);
      setItems(response.data || []);
    } catch (error) {
      console.error("Error fetching items:", error);
      setItems([]);
    }
  };

  // ✅ Fetch financial years
  const fetchFinancialYears = async () => {
    try {
      const response = await axios.get(`${apiBase}/financialYear`, config);
      setFinancialYears(response.data || []);
    } catch (error) {
      console.error("Error fetching financial years:", error);
      setFinancialYears([]);
    }
  };

  // ✅ Run on mount
  useEffect(() => {
    fetchSuppliers();
    fetchItems();
    fetchFinancialYears();
  }, []);

  // ✅ Recalculate totals whenever items change
  useEffect(() => {
    let sum = 0;
    purchaseDetail.forEach(r => {
      const qty = parseInt(r.quantity) || 0;
      const price = parseFloat(r.price) || 0;
      sum += qty * price;
    });
    setPurchaseDetails(pd => ({ ...pd, totalAmount: +sum.toFixed(2) }));
  }, [purchaseDetail]);

  const handleItemSelect = async (index, itemId) => {
    const item = items.find(it => String(it.id) === String(itemId));

    // Check for duplicate with same itemId, size, color
    const currentRow = purchaseDetail[index];
    const exists = purchaseDetail.some(
      (r, i) =>
        i !== index &&
        String(r.itemId) === String(itemId) &&
        r.size === currentRow.size &&
        r.color === currentRow.color
    );

    if (exists) {
      await showMessage("This Item–Size–Color combination already exists.");
      return;
    }

    updateRow(index, {
      itemId,
      price: item?.price || "",
      sizesForItem: item?.sizes || [],
      colorsForItem: item?.colors || [],
      size: "",
      color: "",
    });
  };

  const updateRow = (index, patch) => {
    setPurchaseDetail(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...patch };
      const qty = parseInt(copy[index].quantity) || 0;
      const price = parseFloat(copy[index].price) || 0;
      copy[index].rowTotal = +(qty * price).toFixed(2);
      const totalAmt = copy.reduce((s, r) => s + (parseFloat(r.rowTotal) || 0), 0);
      setPurchaseDetails(pd => ({ ...pd, totalAmount: +totalAmt.toFixed(2) }));
      return copy;
    });
  };

  const addRow = () => {
    const allFilled = purchaseDetail.every(r =>
      r.itemId && r.size && r.color && r.quantity
    );
    if (!allFilled) return;
    setPurchaseDetail(prev => [...prev, emptyRow()]);
  };

  const removeRow = index => {
    setPurchaseDetail(prev => {
      if (prev.length === 1) return [emptyRow()];
      const copy = prev.filter((_, i) => i !== index);
      const totalAmt = copy.reduce((s, r) => s + (parseFloat(r.rowTotal) || 0), 0);
      setPurchaseDetails(pd => ({ ...pd, totalAmount: +totalAmt.toFixed(2) }));
      return copy;
    });
  };

  const validatePayload = async () => {
    if (!purchaseDetails.supplierId) {
      await showMessage("Please select a supplier.");
      return false;
    }
    const hasItem = purchaseDetail.some(
      r => r.itemId && r.size && r.color && r.quantity && parseInt(r.quantity) > 0
    );
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
      purchaseDate: purchaseDetails.purchaseDate,
      supplier: { id: purchaseDetails.supplierId },
      totalAmount: purchaseDetails.totalAmount.toFixed(2),
      purchaseDetail: purchaseDetail
        .filter(r => r.itemId && r.size && r.color && r.quantity)
        .map(r => ({
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
        // ✅ use purchase ID instead of invoice number
        await axios.put(`${apiBase}/purchase/${purchaseDetails.id}`, payload, config);
        await showMessage("Updated successfully.");
      } else {
        const res = await axios.post(`${apiBase}/purchase`, payload, config);
        const invoiceNo = res.data.purchaseInvoiceNo ?? "N/A";
        await showMessage(`Saved with Invoice No: ${invoiceNo}`);
      }
      setMode("create");
      setPurchaseDetails(pd => ({ ...pd, id: null, purchaseInvoiceNo: null }));
      setPurchaseDetail([emptyRow()]);
    } catch (err) {
      await showMessage("Failed to save.");
    }
  };

  const handleEdit = async () => {
    if (!purchaseDetails.purchaseInvoiceNo) {
      await showMessage("Load a purchase first.");
      return;
    }
    setMode("edit");
  };

  const handleDelete = async () => {
    if (!purchaseDetails.id) {
      await showMessage("Load a purchase first.");
      return;
    }

    const confirmed = await showConfirm("Are you sure you want to delete this purchase?");
    if (!confirmed) return;

    try {
      // ✅ use purchase ID instead of invoice number
      await axios.delete(`${apiBase}/purchase/${purchaseDetails.id}`, config);
      await showMessage("Deleted.");
      setPurchaseDetails(pd => ({ ...pd, id: null, purchaseInvoiceNo: null }));
      setPurchaseDetail([emptyRow()]);
      setMode("create");
    } catch (err) {
      await showMessage("Failed to delete.");
    }
  };

  const handleCancel = () => {
    setMode("create");
    setPurchaseDetails({
      id: null, // ✅ reset id
      purchaseInvoiceNo: null,
      purchaseDate: today,
      supplierId: "",
      totalAmount: 0,
      purchaseNumber: "",
    });
    setPurchaseDetail([emptyRow()]);
  };

  const loadPurchase = async (invoice) => {
    if (!invoice) return;

    try {
      const res = await axios.get(`${apiBase}/purchase/${invoice.value}`, config);
      const purchase = res.data;

      if (purchase.supplier && !suppliers.some(s => s.id === purchase.supplier.id)) {
        setSuppliers(prev => [...prev, purchase.supplier]);
      }

      setPurchaseDetails({
        id: purchase.id || null, // ✅ store id
        purchaseInvoiceNo: purchase.purchaseInvoiceNo || null,
        purchaseDate: purchase.purchaseDate ? purchase.purchaseDate.slice(0, 10) : "",
        supplierId: purchase.supplier?.id || "",
        totalAmount: purchase.totalAmount || 0,
        purchaseNumber: purchase.purchaseInvoiceNo,
        sendForPacked: purchase.sendForPacked,
      });

      const rows = (purchase.purchaseDetail || []).map(pi => ({
        id: pi.id || null,
        itemId: pi.item?.id || "",
        size: pi.size || "",
        color: pi.color || "",
        quantity: pi.quantity || "",
        price: pi.price || "",
        rowTotal: pi.totalAmt || +((pi.quantity || 0) * (pi.price || 0)).toFixed(2),
        sizesForItem: pi.sizesForItem || [],
        colorsForItem: pi.colorsForItem || [],
      }));

      setPurchaseDetail(rows.length ? rows : [emptyRow()]);
      setMode("search");
    } catch (err) {
      await showMessage("Failed to load invoice");
    }
  };

  const handleKeyDown = (e, rowIndex, colIndex) => {
    if (e.key === "Delete") {
      e.preventDefault();
      removeRow(rowIndex);
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (rowIndex < purchaseDetail.length - 1) {
        focusCell(rowIndex + 1, colIndex);
      } else if (rowIndex === purchaseDetail.length - 1 && colIndex === 4) {
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

  const handleCellChange = async (index, field, value) => {
    setPurchaseDetail(prev => {
      const copy = [...prev];
      const row = { ...copy[index], [field]: value };

      // 🔍 Duplicate check before applying
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
        return prev; // Don’t apply the change
      }

      // ✅ If no duplicate, continue updating
      copy[index] = row;
      const qty = parseInt(row.quantity) || 0;
      const price = parseFloat(row.price) || 0;
      copy[index].rowTotal = +(qty * price).toFixed(2);
      const totalAmt = copy.reduce((s, r) => s + (parseFloat(r.rowTotal) || 0), 0);
      setPurchaseDetails(pd => ({ ...pd, totalAmount: +totalAmt.toFixed(2) }));
      return copy;
    });
  };


  const handleSendForPacking = async () => {
    if (!purchaseDetails.id) {
      await showMessage("Load a purchase first.");
      return;
    }

    const confirmed = await showConfirm("Send this purchase for packing?");
    if (!confirmed) return;

    try {
      // ✅ use purchase ID instead of invoice number
      await axios.post(
        `${apiBase}/purchase/${purchaseDetails.id}/send-for-packing`,
        {},
        config
      );

      // Update frontend state
      setPurchaseDetails(pd => ({ ...pd, sendForPacked: true }));
      await showMessage("Purchase sent for packing. Edit/Delete disabled.");
    } catch (err) {
      console.error(err);
      await showMessage("Failed to send for packing.");
    }
  };

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
                  setLoadingPurchases(true);
                  axios.get(`${apiBase}/purchase/all`, config)
                    .then(res => setAllPurchases(res.data || []))
                    .catch(() => setAllPurchases([]))
                    .finally(() => setLoadingPurchases(false));
                  setSearchModalOpen(true);
                }}
              >
                <i className="bi bi-search"></i> Search
              </button>
            )}
          </div>

          <h2 className="mb-0 text-center flex-grow-1" style={{ margin: 0, fontWeight: 700, color: "#333" }}>Purchase</h2>

          <div className="btn-group ms-auto d-flex flex-wrap" style={{ gap: "5px", right: "5px"}}>
            {mode === "create" && (
              <>
                <button
                  className="btn btn-sm btn-success d-flex align-items-center gap-1"
                  onClick={handleSave}
                >
                  <i className="bi bi-save"></i> Save
                </button>
                <button
                  className="btn btn-sm btn-secondary d-flex align-items-center gap-1"
                  onClick={handleCancel}
                >
                  <i className="bi bi-x-circle"></i> Cancel
                </button>
              </>
            )}
            {mode === "edit" && (
              <>
                <button
                  className="btn btn-sm btn-success d-flex align-items-center gap-1"
                  onClick={handleSave}
                >
                  <i className="bi bi-save"></i> Save
                </button>
                <button
                  className="btn btn-sm btn-secondary d-flex align-items-center gap-1"
                  onClick={handleCancel}
                >
                  <i className="bi bi-x-circle"></i> Cancel
                </button>
              </>
            )}
            {mode === "search" && (
              <>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={handleEdit}
                  disabled={purchaseDetails.sendForPacked} // disabled if sent for packing
                >
                  Edit
                </button>

                <button
                  className="btn btn-sm btn-danger"
                  onClick={handleDelete}
                  disabled={purchaseDetails.sendForPacked}
                >
                  Delete
                </button>

                <button
                  className="btn btn-sm btn-warning"
                  onClick={handleSendForPacking}
                  disabled={purchaseDetails.sendForPacked || mode !== "search"}
                >
                  Send for Packing
                </button>
                <button
                  className="btn btn-sm btn-secondary d-flex align-items-center gap-1"
                  onClick={handleCancel}
                >
                  <i className="bi bi-x-circle"></i> Cancel
                </button>
              </>
            )}
          </div>
        </div>

        {/* Top form */}
        <div className="p-2 mb-1 moduleFormBackground">
          <div className="row align-items-end">
            <div className="col-12 col-md-2"  style={{ width: "9%" }}>
              <label className="form-label">Date</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={formatDate(purchaseDetails.purchaseDate)}
                disabled
              />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label">Supplier</label>
              <select
                className="form-select form-select-sm"
                value={purchaseDetails.supplierId}
                onChange={(e) => setPurchaseDetails(pd => ({ ...pd, supplierId: e.target.value }))}
                disabled={readOnly}
              >
                <option value="">-- Select Supplier --</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.supplierName}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Items table card */}
        <div className="p-2 mb-1 moduleFormBackground" style={{ display: "flex", flexDirection: "column" }}>
          {/* Table scroll container */}
          <div style={{
            width: "100%",
            height: "310px",
            overflowY: "auto",
            overflowX: "hidden",
            position: "relative",
            borderRadius: "6px",
            scrollbarWidth: "thin",
            //backgroundColor: "white"
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
                      {/* Add Row button at the bottom of form */}
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
                {purchaseDetail.map((row, rowIndex) => (
                  <tr key={rowIndex} style={{ userSelect: "text", backgroundColor: "white" }}>
                    <td className="align-middle text-center">{rowIndex + 1}</td>
                    <td>
                      <select
                        className="form-select form-select-sm border-0"
                        value={row.itemId}
                        disabled={readOnly || purchaseDetails.sendForPacked}
                        onChange={(e) => handleItemSelect(rowIndex, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, rowIndex, 0)}
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
                        onKeyDown={(e) => handleKeyDown(e, rowIndex, 1)}
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
                        onKeyDown={(e) => handleKeyDown(e, rowIndex, 2)}
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
                        onKeyDown={(e) => handleKeyDown(e, rowIndex, 3)}
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
                        onKeyDown={(e) => handleKeyDown(rowIndex, 4)}
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


        </div>
        <div className="p-2 mt-0 mb-1 moduleFormBackground">
          <div className="d-flex justify-content-end align-items-center" style={{ gap: "8px" }}>
            <label className="mb-0">Total Amount:</label>
            <input
              type="number"
              className="form-control form-control-sm text-end no-spinner"
              value={purchaseDetails.totalAmount.toFixed(2)}
              disabled
              readOnly
              style={{ width: "120px" }}
            />
          </div>
        </div>


        {/* Search Modal */}
        {searchModalOpen && (
          <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header py-2">
                  <h5 className="modal-title mb-2 fw-bold fs-4">Search Purchase Invoice</h5>
                  <button className="btn-close" onClick={closeSearchModal}></button>
                </div>
                <div className="modal-body py-1">
                  <input
                    type="text"
                    className="form-control mb-1"
                    placeholder="Search by invoice, supplier..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={loadingPurchases} // disable search while loading
                  />

                  {loadingPurchases ? (
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
                            <th style={{ width: "18%" }}>Invoice No</th>
                            <th style={{ width: "14%" }}>Date</th>
                            <th style={{ width: "50%" }}>Supplier</th>
                            <th style={{ width: "20%" }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allPurchases
                            .filter(p => {
                                const term = normalize(searchTerm);
                                if (!term) return true;

                                return (
                                  normalize(p.purchaseInvoiceNo).includes(term) ||
                                  normalize(p.supplier?.supplierName).includes(term) ||
                                  normalize(formatDate(p.purchaseDate)).includes(term)
                                );
                            })

                            .map(p => (
                              <tr key={p.purchaseInvoiceNo} style={{ cursor: "pointer" }}
                                onClick={() => { loadPurchase({ value: p.purchaseInvoiceNo }); setSearchModalOpen(false); }}>
                                <td>{p.purchaseInvoiceNo}</td>
                                <td>{formatDate(p.purchaseDate)}</td>
                                <td>{p.supplier?.supplierName}</td>
                                <td className="text-end">{parseFloat(p.totalAmount || 0).toFixed(2)}</td>
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
        )}

      </div>
    </div>
  );
};

export default Purchase;
