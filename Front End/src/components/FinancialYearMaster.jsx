import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "./SideBar";
import "../styles/common.css";
import { useMessageAndConfirmation } from "../context/MessageAndConfirmation";

const apiBase = "http://localhost:9070/api";

// Calculate default financial year based on today
const emptyFY = () => {
  const today = new Date();
  let startYear, endYear;

  if (today.getMonth() + 1 >= 4) { // April or later
    startYear = today.getFullYear();
    endYear = startYear + 1;
  } else {
    startYear = today.getFullYear() - 1;
    endYear = today.getFullYear();
  }

  const startDate = new Date(startYear, 3, 1); // April 1
  const endDate = new Date(endYear, 2, 31);    // March 31

  const startDateStr = startDate.toISOString().slice(0, 10);
  const endDateStr = endDate.toISOString().slice(0, 10);

  const year = `${startYear}-${endYear}`;

  return {
    id: null,
    year,
    startDate: startDateStr,
    endDate: endDateStr,
  };
};

const FinancialYearMaster = () => {
  const { showMessage, showConfirm } = useMessageAndConfirmation();

  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [financialYears, setFinancialYears] = useState([]);
  const [selectedFY, setSelectedFY] = useState(emptyFY());
  const [mode, setMode] = useState("create");

  const token = localStorage.getItem("token");
  const config = { headers: { Authorization: `Bearer ${token}` }};

  const fetchFinancialYears = () => {
    axios
      .get(`${apiBase}/financialYear`, config)
      .then((res) => setFinancialYears(res.data || []))
      .catch(() => setFinancialYears([]));
  };

  useEffect(() => {
    fetchFinancialYears();
  }, []);

  // Check for duplicate financial year
  const isDuplicateYear = (year) => {
    return financialYears.some((fy) => fy.year === year && fy.id !== selectedFY.id);
  };

  // When start date changes, automatically set end date to 1 year minus 1 day
  const handleStartDateChange = (e) => {
    const start = new Date(e.target.value);
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);
    end.setDate(end.getDate() - 1);

    const startDateStr = start.toISOString().slice(0, 10);
    const endDateStr = end.toISOString().slice(0, 10);

    const year = `${start.getFullYear()}-${end.getFullYear()}`;

    setSelectedFY({ ...selectedFY, startDate: startDateStr, endDate: endDateStr, year });
  };

  const handleSave = async () => {
    if (!selectedFY.startDate || !selectedFY.endDate) {
      await showMessage("Please select start date.");
      return;
    }

    if (isDuplicateYear(selectedFY.year)) {
      await showMessage("Financial year already exists.");
      return;
    }

    const confirm = await showConfirm(
      mode === "create"
        ? "Do you want to save this financial year?"
        : "Do you want to update this financial year?"
    );
    if (!confirm) return;

    const payload = {
      year: selectedFY.year,
      startDate: selectedFY.startDate,
      endDate: selectedFY.endDate,
    };

    if (mode === "create") {
      axios
        .post(`${apiBase}/financialYear`, payload, config)
        .then(async () => {
          fetchFinancialYears();
          setSelectedFY(emptyFY());
          await showMessage("Financial year saved successfully ✅");
        })
        .catch(async () => await showMessage("Failed to save ❌"));
    } else if (mode === "edit") {
      axios
        .put(`${apiBase}/financialYear/${selectedFY.id}`, payload, config)
        .then(async () => {
          fetchFinancialYears();
          setSelectedFY(emptyFY());
          setMode("create");
          await showMessage("Financial year updated successfully ✅");
        })
        .catch(async () => await showMessage("Failed to update ❌"));
    }
  };

  const handleEdit = (fy) => {
    setSelectedFY(fy);
    setMode("edit");
  };

  const handleDelete = async (id) => {
    const confirm = await showConfirm("Are you sure you want to delete this financial year?");
    if (!confirm) return;

    axios
      .delete(`${apiBase}/financialYear/${id}`, config)
      .then(async () => {
        fetchFinancialYears();
        await showMessage("Financial year deleted successfully ✅");
      })
      .catch(async () => await showMessage("Failed to delete ❌"));
  };

  const handleCancel = () => {
    setSelectedFY(emptyFY());
    setMode("create");
  };

  return (
    <div className="d-flex app-wrapper moduleBody" style={{ overflowY: "hidden" }}>
      <Sidebar expanded={sidebarExpanded} onToggle={setSidebarExpanded} />
      <div
        style={{
          flexGrow: 1,
          marginLeft: sidebarExpanded ? "200px" : "60px",
          transition: "margin-left 0.3s ease",
          padding: "20px",
        }}
      >
        <h2 className="mb-0 text-center flex-grow-1" style={{ margin: 0, fontWeight: 700, color: "#333" }}>Financial Year Master</h2>

        {/* Form */}
        <div className="p-3 mb-3 moduleFormBackground">
          <div className="row g-2 align-items-end">
            <div className="col-md-3">
              <label className="form-label">Financial Year</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={selectedFY.year}
                disabled
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={selectedFY.startDate}
                min="2000-04-01"
                max="2099-03-31"
                onChange={handleStartDateChange}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={selectedFY.endDate}
                readOnly
              />
            </div>
            <div className="col-md-3 d-flex gap-2">
              <button className="btn btn-sm btn-success" onClick={handleSave}>
                {mode === "create" ? "Save" : "Update"}
              </button>
              <button className="btn btn-sm btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </div>
        </div>

        <div className="p-2 mb-1 moduleFormBackground" style={{ display: "flex", flexDirection: "column" }}>
            {/* Table */}
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
                    <th>#</th>
                    <th>Year</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {financialYears.map((fy, idx) => (
                    <tr key={fy.id}>
                      <td>{idx + 1}</td>
                      <td>{fy.year}</td>
                      <td>{fy.startDate}</td>
                      <td>{fy.endDate}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-warning me-1"
                          onClick={() => handleEdit(fy)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(fy.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {financialYears.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center">
                        No financial years found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialYearMaster;
