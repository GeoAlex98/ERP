import "../styles/common.css";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaEdit, FaTrash, FaSave, FaEraser } from "react-icons/fa";
import Sidebar from "./SideBar";
import { useNavigate } from "react-router-dom";
import { useMessageAndConfirmation } from "../context/MessageAndConfirmation";

const baseUrl = "http://localhost:9070/";

const Supplier = () => {
  const { showMessage, showConfirm } = useMessageAndConfirmation();

  const [search, setSearch] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [formData, setFormData] = useState({
    supplierName: "",
    ownerName: "",
    address: "",
    landmark: "",
    place: "",
    region: "",
    phone: "",
    email: "",
    gstNo: "",
    active: true,
    supplierImage: null,
  });
  const [previewImage, setPreviewImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [addingNew, setAddingNew] = useState(false);
  const [notification, setNotification] = useState("");
  const [timer, setTimer] = useState(0);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [countryCode, setCountryCode] = useState("+91");

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Notification auto-hide
  useEffect(() => {
    if (!notification) return;
    setTimer(5);
    const countdown = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(countdown);
          setNotification("");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(countdown);
  }, [notification]);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/suppliers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuppliers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch suppliers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [token]);

  const resetForm = () => {
    setFormData({
      supplierName: "",
      ownerName: "",
      address: "",
      landmark: "",
      place: "",
      region: "",
      phone: "",
      email: "",
      gstNo: "",
      active: true,
      supplierImage: null,
    });
    setPreviewImage("");
    setSelectedSupplier(null);
    setAddingNew(false);
    setEditing(false);
  };

  const handleSelect = (supplier) => {
    setSelectedSupplier(supplier);
    setFormData({
      supplierName: supplier.supplierName || "",
      ownerName: supplier.ownerName || "",
      address: supplier.address || "",
      landmark: supplier.landmark || "",
      place: supplier.place || "",
      region: supplier.region || "",
      phone: supplier.phone ? supplier.phone.replace(/^\+\d{1,4}/, "") : "",
      email: supplier.email || "",
      gstNo: supplier.gstNo || "",
      active: supplier.active ?? true,
      supplierImage: null,
    });

    if (supplier.supplierImage) {
      setPreviewImage(`${baseUrl}${supplier.supplierImage}?t=${Date.now()}`);
    } else {
      setPreviewImage("");
    }

    setEditing(false);
    setAddingNew(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddNew = () => {
    resetForm();
    setAddingNew(true);
    setEditing(true);
  };

  const handleCancel = async () => {
    if (editing) {
      const confirm = await showConfirm("You have unsaved changes. Do you want to discard them?");
      if (confirm) resetForm();
    } else {
      resetForm();
    }
  };

  const handleClear = () => {
    setFormData((prev) => ({
      ...prev,
      supplierName: "",
      ownerName: "",
      address: "",
      landmark: "",
      place: "",
      region: "",
      phone: "",
      email: "",
      gstNo: "",
      supplierImage: null,
    }));
    setPreviewImage("");
  };

  const handleSave = async () => {
    const mandatoryFields = ["supplierName", "ownerName", "address", "place", "region", "phone"];
    for (let field of mandatoryFields) {
      if (!formData[field]?.trim()) {
        await showMessage(`Please fill the mandatory field: ${field}`);
        return;
      }
    }

    const phonePattern = /^\d{10}$/;
    if (!phonePattern.test(formData.phone)) {
      await showMessage("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (formData.email && formData.email.trim() !== "") {
      const emailPattern = /^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/;
      if (!emailPattern.test(formData.email)) {
        await showMessage("Please enter a valid email address.");
        return;
      }
    }

    try {
      const payload = new FormData();
      const { supplierImage, ...supplierData } = formData;
      payload.append("supplier", new Blob([JSON.stringify(supplierData)], { type: "application/json" }));
      if (supplierImage) payload.append("supplierImage", supplierImage);

      let response;
      if (addingNew) {
        response = await axios.post("/api/suppliers", payload, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
        setNotification("Supplier added successfully ✅");
      } else {
        response = await axios.put(`/api/suppliers/${selectedSupplier.id}`, payload, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
        setNotification("Supplier updated successfully ✅");
      }

      const res = await axios.get("/api/suppliers", { headers: { Authorization: `Bearer ${token}` } });
      setSuppliers(res.data);

      const updatedSupplier = res.data.find(r => r.id === (addingNew ? response.data.id : selectedSupplier.id));
      if (updatedSupplier) {
        handleSelect(updatedSupplier);
        if (formData.supplierImage) {
          setPreviewImage(`${baseUrl}${updatedSupplier.supplierImage}?t=${Date.now()}`);
        }
      } else {
        resetForm();
      }

    } catch (err) {
      if (err.response?.status === 409) {
        setNotification("⚠️ Phone, Email, or GST number already exists!");
      } else {
        console.error(err);
        setNotification("Something went wrong ❌");
      }
    }
  };

  const handleDelete = async () => {
    const confirm = await showConfirm("Are you sure you want to delete this supplier?");
    if (!confirm) return;

    try {
      await axios.delete(`/api/suppliers/${selectedSupplier.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotification("Supplier deleted successfully ✅");
      const response = await axios.get("/api/suppliers", { headers: { Authorization: `Bearer ${token}` } });
      setSuppliers(response.data);
      resetForm();
    } catch (err) {
      console.error(err);
      await showMessage("Failed to delete supplier ❌");
    }
  };

  const displayedSuppliers = search.trim()
    ? suppliers.filter(
        (r) =>
          r.supplierName?.toLowerCase().includes(search.toLowerCase()) ||
          r.place?.toLowerCase().includes(search.toLowerCase()) ||
          r.phone?.toLowerCase().includes(search.toLowerCase())
      )
    : suppliers;

  const onImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormData((prev) => ({ ...prev, supplierImage: file }));
    setPreviewImage(URL.createObjectURL(file));
  };

  const imageSrc = previewImage || (selectedSupplier?.supplierImage ? (selectedSupplier.supplierImage.startsWith("http") ? selectedSupplier.supplierImage : baseUrl + selectedSupplier.supplierImage) : "");

  return (
    <div className="d-flex app-wrapper moduleBody">
      <Sidebar expanded={sidebarExpanded} onToggle={setSidebarExpanded} />
      <div
        className="main-content p-4"
        style={{ flex: 1, marginLeft: sidebarExpanded ? "200px" : "60px", transition: "margin 0.3s" }}
      >
        {notification && (
          <div
            className="alert alert-success"
            style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, borderRadius: 8, padding: "10px 20px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}
          >
            {notification} {timer > 0 && `(${timer}s)`}
          </div>
        )}

        {/* Page Heading */}
        <div className="d-flex justify-content-between align-items-center mb-3 position-relative "
          style={{ position: "sticky", top: 0, zIndex: 10, padding: "10px 0", height: "50px", minHeight: "50px", lineHeight: "50px" }}>
          <div>
            {!selectedSupplier && !addingNew && (
              <button className="btn btn-success" style={{marginLeft: "5px"}} onClick={handleAddNew}>
                + New
              </button>
            )}
          </div>
          <div className="position-absolute start-50 translate-middle-x" style={{ textAlign: "center" }}>
            <h2 className="mb-0 text-center flex-grow-1" style={{ margin: 0, fontWeight: 700, color: "#333" }}>
              {addingNew ? "New Supplier" : selectedSupplier ? "Supplier Detail" : "Suppliers"}
            </h2>
          </div>
          {!selectedSupplier && !addingNew && (
            <div className="d-flex" style={{ width: "35%" ,margin: "5px"}}>
              <input
                type="text"
                className="form-control"
                placeholder="Search by Supplier Name, Place, or Phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button className="btn btn-outline-secondary" onClick={() => { setSearch(""); fetchSuppliers(); }}>
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        {!loading && !selectedSupplier && !addingNew && (
          <div className="table-scroll-container hide-scrollbar moduleFormBackground" style={{ maxHeight: "65vh", overflowY: "scroll" }}>
            <table className="table table-hover table-striped w-100 ">
              <colgroup>
                <col style={{ width: "25%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "15%" }} />
                <col style={{ width: "25%" }} />
              </colgroup>
              <thead className="table-dark">
                <tr>
                  <th>Supplier Name</th>
                  <th>Place</th>
                  <th>Region</th>
                  <th>Phone</th>
                  <th>GST</th>
                </tr>
              </thead>
              <tbody>
                {displayedSuppliers.map((r) => (
                  <tr key={r.id} onClick={() => handleSelect(r)} style={{ cursor: "pointer" }}>
                    <td>{r.supplierName}</td>
                    <td>{r.place}</td>
                    <td>{r.region}</td>
                    <td>{r.phone}</td>
                    <td>{r.gstNo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Form */}
        {(selectedSupplier || addingNew) && (
          <div className="card p-3 shadow-sm hide-scrollbar moduleFormBackground" style={{ marginTop: 0 }}>
            <div className="row">
              {/* Left Form */}
              <div className="col-md-8">
                <div className="row g-2 align-items-center mb-1">
                  <div className="col-md-2">
                    <label className="form-label fw-bold mb-0">Supplier Name *</label>
                  </div>
                  <div className="col-md-10">
                    <input type="text" className="form-control form-control-sm" name="supplierName" value={formData.supplierName} onChange={handleChange} disabled={!editing} style={{ textTransform: "uppercase" }}/>
                  </div>
                </div>

                {/* Owner & GST */}
                <div className="row g-2 mb-1">
                  <div className="col-md-6">
                    <label className="form-label mb-1">Owner Name *</label>
                    <input type="text" className="form-control form-control-sm" name="ownerName" value={formData.ownerName} onChange={handleChange} disabled={!editing} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label mb-1">GST No</label>
                    <input type="text" className="form-control form-control-sm" name="gstNo" value={formData.gstNo} onChange={handleChange} disabled={!editing} />
                  </div>
                </div>

                {/* Address & Place/Region */}
                <div className="row g-2 mt-1.5">
                  <div className="col-md-6">
                    <label className="form-label mb-1">Address *</label>
                    <textarea className="form-control form-control-sm" name="address" value={formData.address} onChange={handleChange} disabled={!editing} rows={4} style={{ resize: "none" }} />
                  </div>
                  <div className="col-md-6">
                    <div className="mb-1">
                      <label className="form-label mb-1">Place *</label>
                      <input type="text" className="form-control form-control-sm" name="place" value={formData.place} onChange={handleChange} disabled={!editing} />
                    </div>
                    <div>
                      <label className="form-label mb-1">Region *</label>
                      <input type="text" className="form-control form-control-sm" name="region" value={formData.region} onChange={handleChange} disabled={!editing} />
                    </div>
                  </div>
                </div>

                {/* Landmark */}
                <div className="row g-2 mt-1.5">
                  <div className="col-md-6">
                    <label className="form-label mb-1">Landmark</label>
                    <textarea className="form-control form-control-sm" name="landmark" value={formData.landmark} onChange={handleChange} disabled={!editing} rows={2} style={{ resize: "none" }} />
                  </div>

                  {/* Mobile & Email */}
                  <div className="col-md-6">
                    <div className="row g-2">
                      <div className="col-md-12 mb-2">
                        <label className="form-label mb-1">Mobile *</label>
                        <div className="d-flex">
                          <input type="text" className="form-control form-control-sm me-2" name="countryCode" value={countryCode} onChange={(e) => setCountryCode(e.target.value)} disabled={!editing} style={{ width: "70px" }} />
                          <input type="tel" className="form-control form-control-sm" name="phone" value={formData.phone} onChange={handleChange} disabled={!editing} placeholder="10-digit mobile" />
                        </div>
                      </div>
                      <div className="col-md-12">
                        <label className="form-label mb-1">Email</label>
                        <input type="email" className="form-control form-control-sm" name="email" value={formData.email} onChange={handleChange} disabled={!editing} placeholder="Enter valid email" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Active Toggle */}
                <div className="col-md-6 d-flex pt-3 justify-content-end">
                  <div className="form-check form-switch">
                    <input type="checkbox" className="form-check-input" id="activeSwitch" name="active" checked={!!formData.active} onChange={handleChange} disabled={!editing} />
                    <label className="form-check-label" htmlFor="activeSwitch" style={{ fontWeight: 500, color: formData.active ? "green" : "red", cursor: editing ? "pointer" : "not-allowed", marginLeft: 8 }}>
                      {formData.active ? "Active" : "Inactive"}
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Section */}
              <div className="col-md-4 d-flex flex-column">
                <div className="d-flex justify-content-end mb-2 gap-2">
                  {editing ? (
                    <>
                      <button className="btn btn-sm btn-success" onClick={handleSave}><FaSave /> Save</button>
                      {addingNew && <button className="btn btn-sm btn-warning" onClick={handleClear}><FaEraser /> Clear</button>}
                      <button className="btn btn-sm btn-secondary" onClick={handleCancel}>Cancel</button>
                    </>
                  ) : (
                    <>
                      {selectedSupplier && <>
                        <button className="btn btn-sm btn-primary" onClick={() => setEditing(true)}><FaEdit /> Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={handleDelete}><FaTrash /> Delete</button>
                      </>}
                      <button className="btn btn-sm btn-secondary" onClick={handleCancel}>Cancel</button>
                    </>
                  )}
                </div>

                {/* Supplier Image */}
                <div className="border border-dashed d-flex flex-column align-items-center justify-content-center" style={{ width: "100%", height: "370px", color: "#aaa", borderRadius: "6px", position: "relative", overflow: "hidden", backgroundColor: "#f8f9fa" }}>
                  {imageSrc ? (
                    <img src={imageSrc} alt="Supplier" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  ) : (
                    <div className="d-flex flex-column align-items-center justify-content-center h-100">
                      <span style={{ fontSize: "24px" }}>🏭</span>
                      <span>No Image</span>
                    </div>
                  )}
                  {editing && <label htmlFor="imageUpload" className="btn btn-outline-primary btn-sm" style={{ position: "absolute", bottom: 10 }}>Browse Image</label>}
                </div>
                {editing && <input type="file" id="imageUpload" accept="image/*" onChange={onImageChange} style={{ display: "none" }} />}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Supplier;
