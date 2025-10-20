import "../styles/common.css";
import React, { useState, useEffect, useRef } from "react";
import { useMessageAndConfirmation } from "../context/MessageAndConfirmation";
import {
  FaEdit,
  FaTrash,
  FaSave,
  FaEraser,
  FaPlus,
  FaRegImage,
} from "react-icons/fa";
import Sidebar from "./SideBar";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const sizesOptions = ["XS", "S", "M", "L", "XL"];
const colorsOptions = ["Red", "Blue", "Green", "Black", "White"];
const INACTIVITY_LIMIT = 30 * 60 * 1000;
const MAX_IMAGES = 7;

// helpers
const normalizeImages = (arr) => arr.map((img, index) => ({ ...img, order: index }));
const createTempId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const Item = () => {
  const [items, setItems] = useState([]); // for homepage (minimal fields)
  const [selectedItem, setSelectedItem] = useState(null); // full item when selected
  const [formData, setFormData] = useState({});
  const [images, setImages] = useState([]); // local preview list (both existing urls and new files)
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  const [addingNew, setAddingNew] = useState(false);
  const [notification, setNotification] = useState("");
  const [timer, setTimer] = useState(5);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const fileInputRef = useRef(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [openFullScreen, setOpenFullScreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showMessage, showConfirm } = useMessageAndConfirmation();
  const apiBase = "http://localhost:9070";

  // Auto-hide notification
  useEffect(() => {
    if (!notification) return;
    setTimer(5);
    const countdown = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          setNotification("");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(countdown);
  }, [notification]);

  // Fetch items for homepage (only minimal fields & thumbnail)
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        // NOTE: backend endpoint '/api/items/home' returns {id, name, retailPrice, mrp, thumbnail}
        const res = await axios.get("/api/items/home", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = Array.isArray(res.data) ? res.data : res.data.data || [];
        setItems(data);
      } catch (err) {
        console.error(err);
        setNotification("Failed to fetch items for home ❌");
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [token]);

  // Filter items
  const filteredItems = items.filter(
    (item) =>
      (item.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.category || "").toLowerCase().includes(search.toLowerCase())
  );

  // Select item: fetch full details from backend and populate form + images
  const handleSelect = async (item) => {
    try {
      setLoading(true);
      // fetch full details for this item
      const res = await axios.get(`/api/items/${item.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const full = res.data;

      setSelectedItem(full);
      setFormData(full || {});

      const imgs = (full.images || [])
        .map((img, index) => {
          // backend stores url as '/uploads/..' — use it directly
          if (img && (img.url || img.fileName)) {
            return {
              id: img.id,
              url: img.url || img.fileName,
              order: img.order || img.orderIndex || index,
            };
          }
          return null;
        })
        .filter(Boolean)
        .sort((a, b) => a.order - b.order);

      setImages(imgs);
      setImagesToDelete([]);
      setEditing(false);
      setAddingNew(false);
      setCurrentImageIndex(imgs.length ? 0 : -1);
    } catch (err) {
      console.error(err);
      setNotification("Failed to load item details ❌");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckbox = (field, value) => {
    const current = formData[field] || [];
    if (current.includes(value)) {
      setFormData({ ...formData, [field]: current.filter((v) => v !== value) });
    } else {
      setFormData({ ...formData, [field]: [...current, value] });
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);

    if (images.length + files.length > MAX_IMAGES) {
      await showMessage(`You can upload a maximum of ${MAX_IMAGES} images.`);
      e.target.value = "";
      return;
    }

    const previews = files.map((file, idx) => ({
      file,
      url: URL.createObjectURL(file),
      tempId: createTempId(),
      order: images.length + idx,
    }));

    setImages((prev) => [...prev, ...previews]);
    setCurrentImageIndex(0);
    e.target.value = "";
  };

  const handleAddImageClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleDeleteImage = (idx) => {
    const imgToDelete = images[idx];
    if (imgToDelete?.id) {
      setImagesToDelete((prev) => [...prev, imgToDelete.id]);
    }
    setImages((prev) => {
      const newImages = prev.filter((_, i) => i !== idx);
      if (idx === currentImageIndex) {
        setCurrentImageIndex(newImages.length ? 0 : -1);
      } else if (idx < currentImageIndex) {
        setCurrentImageIndex((prevIndex) => prevIndex - 1);
      }
      return newImages.map((img, index) => ({ ...img, order: index }));
    });
  };

  // Drag-and-drop reorder (thumbnail area)
  const handleDragEnd = (result) => {
    if (!result?.destination) return;
    const reordered = Array.from(images);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    const updatedOrder = reordered.map((img, index) => ({ ...img, order: index }));
    setImages(updatedOrder);
    setCurrentImageIndex(result.destination.index);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.retailPrice || !formData.mrp) {
      await showMessage("Please fill Name, Retail Price, and MRP.");
      return;
    }

    try {
      setLoading(true);
      const payload = new FormData();

      // Item JSON
      payload.append(
        "item",
        new Blob([JSON.stringify(formData)], { type: "application/json" })
      );

      // Build final order JSON
      const finalOrder = images.map((img, index) => {
        if (img.id) {
          return { id: img.id, order: index };
        } else if (img.file) {
          const tempId = img.tempId || createTempId();
          // attach file under "newImage_<tempId>"
          payload.append("newImage_" + tempId, img.file);
          return { tempId, order: index };
        }
        return null;
      }).filter(Boolean);

      payload.append("finalOrder", JSON.stringify(finalOrder));

      // Images to delete
      if (imagesToDelete.length > 0) {
        payload.append("imagesToDelete", JSON.stringify(imagesToDelete));
      }

      // Call API
      if (addingNew) {
        await axios.post("/api/items", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotification("Item saved successfully ✅");
      } else {
        await axios.put(`/api/items/${formData.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotification("Item updated successfully ✅");
      }

      // refresh both homepage and current item
      const homeRes = await axios.get("/api/items/home", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(Array.isArray(homeRes.data) ? homeRes.data : homeRes.data.data || []);

      if (!addingNew) {
        const detailRes = await axios.get(`/api/items/${formData.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        handleSelect(detailRes.data); // refresh form images
      } else {
        resetForm();
      }
    } catch (err) {
      console.error(err);
      showMessage("Failed to save item ❌");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await showConfirm("Are you sure you want to delete this item?");
    if (!confirmed) return;

    try {
      setLoading(true);

      await axios.delete(`/api/items/${formData.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLoading(false);
      await showMessage("Item deleted successfully!");
      resetForm();
      const res = await axios.get("/api/items/home", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      console.error(err);
      setLoading(false);
      await showMessage("Error deleting item");
    }
  };

  const handleAddNew = () => {
    setFormData({
      id: "",
      name: "",
      category: "Unisex",
      productionCost: "",
      retailPrice: "",
      mrp: "",
      sizes: [],
      colors: [],
      description: "",
    });
    setImages([]);
    setImagesToDelete([]);
    setSelectedItem(null);
    setEditing(true);
    setAddingNew(true);
    setCurrentImageIndex(0);
  };

  const handleClear = () => {
    setFormData({
      id: addingNew ? "" : formData.id,
      name: "",
      category: "Unisex",
      productionCost: "",
      retailPrice: "",
      mrp: "",
      sizes: [],
      colors: [],
      description: "",
    });
    setImages([]);
    setImagesToDelete([]);
    setCurrentImageIndex(0);
  };

  const handleCancel = () => {
    resetForm();
    setNotification("");
  };

  const resetForm = () => {
    setFormData({});
    setImages([]);
    setImagesToDelete([]);
    setEditing(false);
    setAddingNew(false);
    setSelectedItem(null);
    setCurrentImageIndex(0);
  };

  const businessProfit =
    formData.retailPrice && formData.productionCost
      ? formData.retailPrice - formData.productionCost
      : 0;
  const businessProfitPercent =
    formData.productionCost && businessProfit > 0
      ? ((businessProfit / formData.productionCost) * 100).toFixed(2)
      : 0;
  const retailerProfit =
    formData.mrp && formData.retailPrice
      ? formData.mrp - formData.retailPrice
      : 0;
  const retailerMargin =
    formData.mrp && retailerProfit > 0
      ? ((retailerProfit / formData.mrp) * 100).toFixed(2)
      : 0;

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
          height: "calc(100vh - 60px)",
          overflow: "hidden",
        }}
      >
        {notification && (
          <div
            className="alert alert-success"
            style={{
              position: "fixed",
              top: 20,
              right: 20,
              zIndex: 9999,
              borderRadius: 8,
              padding: "10px 20px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}
          >
            {notification} {timer > 0 && `(${timer}s)`}
          </div>
        )}

        {loading && (
          <div className={`loading-overlay ${loading ? "active" : ""}`}>
            <div className="spinner-border text-light" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}

        {/* TOP BAR - heading + new + search */}
        {!selectedItem && !addingNew && (
          <div
            className="d-flex justify-content-between align-items-center position-relative moduleFormBackground"
            style={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              padding: "10px 0",
              height: "50px",
              minHeight: "50px",
              lineHeight: "50px",
              marginBottom: "5px",
            }}
          >
            <div>
              <button
                className="btn btn-success"
                onClick={handleAddNew}
                style={{
                  borderRadius: "6px",
                  padding: "6px 14px",
                  fontSize: "14px",
                  height: "36px",
                  width: "auto",
                  marginLeft: "5px",
                }}
              >
                + New
              </button>
            </div>

            <div
              className="position-absolute start-50 translate-middle-x"
              style={{ textAlign: "center" }}
            >
              <h2 className="mb-0 text-center flex-grow-1" style={{ margin: 0, fontWeight: 700, color: "#333" }}>
                {addingNew ? "New Item" : selectedItem ? "Item Detail" : "Items"}
              </h2>
            </div>

            <div className="d-flex" style={{ width: "35%" }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search by name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  borderRadius: "6px 0 0 6px",
                  padding: "6px 8px",
                  fontSize: "14px",
                  height: "40px",
                  flex: 1,
                }}
              />
              <button
                className="btn btn-outline-secondary"
                style={{
                  borderRadius: "0 6px 6px 0",
                  padding: "0px 20px",
                  height: "40px",
                  fontSize: "14px",
                  marginRight: "5px",
                }}
                onClick={() => setSearch("")}
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Items Grid */}
        <div
          style={{
            overflowY: "auto",
            flex: 1,
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
          className="scroll-hidden"
        >
          {!selectedItem && !addingNew && (
            filteredItems.length > 0 ? (
              <div className="row row-cols-1 row-cols-md-5 g-3 mb-4">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="col"
                    onClick={() => handleSelect(item)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="card h-100">
                      {item.thumbnail ? (
                        <img
                          src={
                            item.thumbnail?.startsWith("blob:")
                              ? item.thumbnail
                              : `${apiBase}${item.thumbnail}?t=${Date.now()}`
                          }
                          className="card-img-top"
                          alt={item.name}
                          style={{ height: "150px", objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{ height: "150px", background: "#f0f0f0" }} />
                      )}
                      <div className="card-body">
                        <h5 className="card-title">{item.name}</h5>
                        <p className="card-text">
                          Retail: {item.retailPrice} | MRP: {item.mrp}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="moduleFormBackground"
                style={{
                  height: "70vh",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  color: "#777",
                  fontSize: "1.5rem",
                  fontWeight: "500",
                }}
              >
                No Items
              </div>
            )
          )}
        </div>

        {/* Detail Form */}
        {(selectedItem || addingNew) && (
          <div
            className="card p-3 shadow"
            style={{
              borderRadius: "12px",
              marginBottom: "15px",
              overflowY: "auto",
              maxHeight: "calc(100vh - 80px)",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <div style={{ position: "absolute", top: "15px", right: "15px" }}>
              {!editing ? (
                <>
                  <button
                    className="btn btn-sm btn-primary me-1"
                    onClick={() => setEditing(true)}
                  >
                    <FaEdit /> Edit
                  </button>
                  <button className="btn btn-sm btn-danger me-1" onClick={handleDelete}>
                    <FaTrash /> Delete
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={handleCancel}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn-sm btn-success me-1" onClick={handleSave}>
                    <FaSave /> Save
                  </button>
                  <button className="btn btn-sm btn-warning me-1" onClick={handleClear}>
                    <FaEraser /> Clear
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={handleCancel}>
                    Cancel
                  </button>
                </>
              )}
            </div>

            <h4 style={{ marginBottom: "10px", color: "#333" }}>
              {addingNew ? "New Item" : "Item Details"}
            </h4>

            <div className="row">
              {/* LEFT SIDE - 35% */}
              <div className="col-md-5" style={{ flex: "0 0 35%" }}>
                <div
                  style={{
                    position: "relative",
                    width: "100%",
                    height: "480px",
                    overflow: "hidden",
                    border: "0px solid #ffff",
                    borderRadius: "6px",
                    background: "#f9f9f9",
                  }}
                >
                  {images.length > 0 ? (
                    <img
                      src={
                        images[currentImageIndex]?.url?.startsWith("blob:")
                          ? images[currentImageIndex].url
                          : `${apiBase}${images[currentImageIndex]?.url}?t=${Date.now()}`
                      }
                      alt={`Preview ${currentImageIndex}`}
                      onDoubleClick={() => setOpenFullScreen(true)}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        transition: "transform 0.2s ease-out",
                      }}
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = ((e.clientX - rect.left) / rect.width) * 100;
                        const y = ((e.clientY - rect.top) / rect.height) * 100;
                        e.currentTarget.style.transformOrigin = `${x}% ${y}%`;
                        e.currentTarget.style.transform = "scale(2)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transformOrigin = "center";
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#aaa",
                        flexDirection: "column",
                      }}
                    >
                      <FaRegImage size={60} />
                      <span>No Image</span>
                    </div>
                  )}
                </div>

                {/* Thumbnails at bottom */}
                <div className="d-flex flex-wrap justify-content-center mt-2">
                  {images.map((img, idx) => (
                    <div
                      key={img.id || img.tempId || idx}
                      className="me-2 mb-2 position-relative"
                      draggable={editing}
                      onDragStart={(e) => {
                        if (!editing) return;
                        e.dataTransfer.setData("dragIndex", idx);
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        if (!editing) return;
                        e.preventDefault();
                        const dragIndex = parseInt(e.dataTransfer.getData("dragIndex"), 10);
                        const dropIndex = idx;
                        if (dragIndex === dropIndex) return;

                        const newImages = [...images];
                        const [moved] = newImages.splice(dragIndex, 1);
                        newImages.splice(dropIndex, 0, moved);

                        setImages(normalizeImages(newImages));
                        setCurrentImageIndex(dropIndex);
                      }}
                    >
                      <img
                        src={
                          img.url?.startsWith("blob:")
                            ? img.url
                            : `${apiBase}${img.url}?t=${Date.now()}`
                        }
                        alt={`Thumb ${idx}`}
                        onClick={() => setCurrentImageIndex(idx)}
                        style={{
                          width: "60px",
                          height: "60px",
                          objectFit: "cover",
                          border: currentImageIndex === idx ? "2px solid #007bff" : "1px solid #ccc",
                          borderRadius: "4px",
                          cursor: editing ? "grab" : "pointer",
                        }}
                      />

                      {editing && (
                        <FaTrash
                          onClick={() => handleDeleteImage(idx)}
                          onMouseEnter={() => setCurrentImageIndex(idx)}
                          style={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            color: "red",
                            cursor: "pointer",
                            background: "#fff",
                            borderRadius: "50%",
                            padding: "2px",
                          }}
                          size={14}
                        />
                      )}
                    </div>
                  ))}

                  {/* Add new image button */}
                  {editing && (
                    <div
                      onClick={() => {
                        if (images.length >= 7) return;
                        handleAddImageClick();
                      }}
                      style={{
                        width: "60px",
                        height: "60px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "2px dashed #aaa",
                        borderRadius: "4px",
                        cursor: images.length >= 7 ? "not-allowed" : "pointer",
                        opacity: images.length >= 7 ? 0.5 : 1,
                      }}
                      title={images.length >= 7 ? "Maximum 7 images allowed" : "Add Image"}
                    >
                      <FaPlus size={18} color="#555" />
                    </div>
                  )}

                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleImageUpload}
                  />
                </div>
              </div>

              {/* RIGHT SIDE - 65% */}
              <div className="col-md-7" style={{ flex: "0 0 65%" }}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label>Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={formData.name || ""}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                  </div>
                  <div className="col-md-6">
                    <label>Category</label>
                    <select
                      className="form-control"
                      name="category"
                      value={formData.category || "Unisex"}
                      onChange={handleChange}
                      disabled={!editing}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Unisex">Unisex</option>
                    </select>
                  </div>
                </div>

                <div className="mt-3">
                  <label>Sizes</label>
                  <div className="d-flex flex-wrap">
                    {sizesOptions.map((s) => (
                      <div className="form-check me-3" key={s}>
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`size-${s}`}
                          checked={formData.sizes?.includes(s)}
                          onChange={() => handleCheckbox("sizes", s)}
                          disabled={!editing}
                        />
                        <label className="form-check-label" htmlFor={`size-${s}`}>
                          {s}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3">
                  <label>Colors</label>
                  <div className="d-flex flex-wrap">
                    {colorsOptions.map((c) => (
                      <div
                        key={c}
                        onClick={() => editing && handleCheckbox("colors", c)}
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "50%",
                          marginRight: "10px",
                          marginBottom: "10px",
                          border: formData.colors?.includes(c) ? "3px solid #000" : "1px solid #ccc",
                          cursor: editing ? "pointer" : "default",
                          backgroundColor: c.toLowerCase(),
                        }}
                        title={c}
                      ></div>
                    ))}
                  </div>
                </div>

                {/* Production Cost, Retail Price, MRP */}
                <div className="row g-2 mt-2">
                  <div className="col-md-4">
                    <label>Production Cost</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      name="productionCost"
                      value={formData.productionCost ?? ""}
                      onChange={handleChange}
                      onBlur={(e) => {
                        if (e.target.value) {
                          setFormData((prev) => ({
                            ...prev,
                            productionCost: parseFloat(e.target.value).toFixed(2),
                          }));
                        }
                      }}
                      disabled={!editing}
                      style={{ fontSize: "13px", padding: "4px", height: "30px" }}
                    />
                  </div>
                  <div className="col-md-4">
                    <label>Retail Price *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      name="retailPrice"
                      value={formData.retailPrice ?? ""}
                      onBlur={(e) => {
                        if (e.target.value) {
                          setFormData((prev) => ({
                            ...prev,
                            retailPrice: parseFloat(e.target.value).toFixed(2),
                          }));
                        }
                      }}
                      onChange={handleChange}
                      disabled={!editing}
                      style={{ fontSize: "13px", padding: "4px", height: "30px" }}
                    />
                  </div>
                  <div className="col-md-4">
                    <label>MRP *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      name="mrp"
                      value={formData.mrp ?? ""}
                      onChange={handleChange}
                      onBlur={(e) => {
                        if (e.target.value) {
                          setFormData((prev) => ({
                            ...prev,
                            mrp: parseFloat(e.target.value).toFixed(2),
                          }));
                        }
                      }}
                      disabled={!editing}
                      style={{ fontSize: "13px", padding: "4px", height: "30px" }}
                    />
                  </div>
                </div>

                {/* Business Profit, Retailer Profit, Description */}
                <div className="row g-3 mt-3">
                  <div className="col-md-3 d-flex flex-column gap-2">
                    <div>
                      <label>Retailer Profit</label>
                      <input
                        type="text"
                        className="form-control"
                        style={{
                          color: retailerProfit > 0 ? "green" : "red",
                          fontWeight: "bold",
                          fontSize: "0.875rem",
                        }}
                        value={`${retailerProfit.toFixed(2)} (${retailerMargin}%)`}
                        disabled
                      />
                    </div>

                    <div>
                      <label>Business Profit</label>
                      <input
                        type="text"
                        className="form-control"
                        style={{
                          color: businessProfit > 0 ? "green" : "red",
                          fontWeight: "bold",
                          fontSize: "0.875rem",
                        }}
                        value={`${businessProfit.toFixed(2)} (${businessProfitPercent}%)`}
                        disabled
                      />
                    </div>
                  </div>

                  <div className="col-md-9">
                    <label>Description</label>
                    <textarea
                      className="form-control"
                      name="description"
                      value={formData.description || ""}
                      onChange={handleChange}
                      disabled={!editing}
                      rows={4}
                      style={{ resize: "none", fontSize: "0.875rem" }}
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fullscreen Lightbox */}
        {images.length > 0 && (
          <div
            className="fullscreen-lightbox"
            style={{
              display: openFullScreen ? "flex" : "none",
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.8)",
              backdropFilter: "blur(6px)",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
              flexDirection: "column",
            }}
            onClick={() => setOpenFullScreen(false)}
          >
            <img
              src={
                images[currentImageIndex]?.url?.startsWith("blob:")
                  ? images[currentImageIndex].url
                  : `${apiBase}${images[currentImageIndex]?.url}?t=${Date.now()}`
              }
              alt={`Fullscreen ${currentImageIndex}`}
              style={{
                maxHeight: "90%",
                maxWidth: "90%",
                objectFit: "contain",
                cursor: "grab",
                transition: "transform 0.2s ease-out",
              }}
              onWheel={(e) => {
                e.preventDefault();
                const img = e.currentTarget;
                let currentScale = parseFloat(img.dataset.scale) || 1;
                currentScale += e.deltaY * -0.001;
                currentScale = Math.min(Math.max(1, currentScale), 5);
                img.style.transform = `scale(${currentScale})`;
                img.dataset.scale = currentScale;
              }}
            />

            {/* Navigation Arrows */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
              }}
              style={{
                position: "absolute",
                left: "20px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "2rem",
                color: "#fff",
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              &#8592;
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex((prev) => (prev + 1) % images.length);
              }}
              style={{
                position: "absolute",
                right: "20px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "2rem",
                color: "#fff",
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              &#8594;
            </button>

            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenFullScreen(false);
              }}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                fontSize: "1.5rem",
                color: "#fff",
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              &times;
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Item;
