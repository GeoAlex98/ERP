import "../styles/common.css";
import React, { useState, useEffect, useRef } from "react";
import {
  FaEye,
  FaEyeSlash,
  FaEdit,
  FaTrash,
  FaSave,
  FaUserCircle,
  FaSearch,
  FaLock,
  FaPhone,
  FaEnvelope
} from "react-icons/fa";
import axios from "axios";
import Sidebar from "./SideBar";
import { useNavigate } from "react-router-dom";
import { useMessageAndConfirmation } from "../context/MessageAndConfirmation";

const roles = ["ADMIN", "EMPLOYEE"];
const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes
const roleRank = { SUPERADMIN: 3, ADMIN: 2, EMPLOYEE: 1 };

const UserMaster = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const { showMessage, showConfirm } = useMessageAndConfirmation();

  const dropdownRef = useRef(null); // For closing search dropdown
  const profileInputRef = useRef(null);

  // STATES
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [showPermission, setShowPermission] = useState(true);
  const [userList, setUserList] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [formData, setFormData] = useState({
    profilePicUrl: "",
    username: "",
    role: "",
    email: "",
    countryCode: "+91",
    phone: "",
    password: "",
    id: null,
  });
  const [editing, setEditing] = useState(false);
  const [isNewUser, setIsNewUser] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [notification, setNotification] = useState("");
  const [timer, setTimer] = useState(0);
  const [showFullImage, setShowFullImage] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [active, setActive] = useState(true);
  const [emailError, setEmailError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState("");
  const baseUrl = "http://localhost:9070/";

  // MODULE STATES
  const [modules, setModules] = useState([]);
  const [modulePermissions, setModulePermissions] = useState({});
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [allowedModules, setAllowedModules] = useState([]);

  // AUTO-HIDE NOTIFICATION
  useEffect(() => {
    if (!notification) return;
    setTimer(3);
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

  // Load logged-in user role & allowed modules
  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    if (storedRole) {
      setCurrentUserRole(storedRole.toUpperCase());
    }

    const storedAllowed = localStorage.getItem("allowedModules");
    if (storedAllowed) {
      try {
        setAllowedModules(JSON.parse(storedAllowed));
      } catch {
        setAllowedModules([]);
      }
    }
  }, []);

  // FETCH MODULES
  const fetchModules = async () => {
    try {
      const res = await axios.get("/api/modules/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = Array.isArray(res.data) ? res.data : [];
      setModules(data);
      setModulePermissions(
        data.reduce((acc, m) => {
          acc[m.id] = {
            ...m,
            canView: false,
            canAdd: false,
            canEdit: false,
            canDelete: false,
          };
          return acc;
        }, {})
      );
    } catch (e) {
      console.error(e);
    }
  };
  useEffect(() => {
    fetchModules();
  }, []);

  // Clear MASTER module permissions if role is EMPLOYEE
  useEffect(() => {
    if (formData.role === "EMPLOYEE") {
      setModulePermissions((prev) => {
        const newState = { ...prev };
        Object.values(newState).forEach((mod) => {
          if (mod.category === "MASTER") {
            mod.canView = false;
            mod.canAdd = false;
            mod.canEdit = false;
            mod.canDelete = false;
          }
        });
        return newState;
      });
    }
  }, [formData.role]);

  // FETCH ALL USERS ONCE
  const fetchAllUsers = async () => {
    if (!token || !currentUserRole) return;

    try {
      const res = await axios.get("/api/usermaster/users/light", {
        headers: { Authorization: `Bearer ${token}` },
      });
      let users = Array.isArray(res.data) ? res.data : [];

      const allowedRank = roleRank[currentUserRole];
      users = users.filter(
        (u) => roleRank[u.role?.toUpperCase()] < allowedRank
      );

      setAllUsers(users);
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    fetchAllUsers();
  }, [token, currentUserRole]);

  // RESET FORM
  const resetForm = () => {
    setFormData({
      profilePic: "",
      username: "",
      role: "",
      email: "",
      phone: "",
      password: "",
      id: null,
    });
    setActive(true);
    setEditing(false);
    setIsNewUser(true);
    setSelectedUser(null);
    setSearch("");
    setUserList([]);
    setModulePermissions(
      modules.reduce((acc, m) => {
        acc[m.id] = {
          ...m,
          canView: false,
          canAdd: false,
          canEdit: false,
          canDelete: false,
        };
        return acc;
      }, {})
    );
  };

  // HANDLE INPUT CHANGES
  const [profileFile, setProfileFile] = useState(null);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "profilePicUrl" && files && files[0]) {
      const file = files[0];
      setProfileFile(file); // store file for upload
      setFormData((prev) => ({
        ...prev,
        profilePicUrl: URL.createObjectURL(file), // preview
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // SAVE
  const handleSave = async () => {
    if (!formData.username || !formData.role || !formData.email) {
      await showMessage("Username, Role and Email are required");
      return;
    }

    try {
      const payload = new FormData();
      payload.append("username", formData.username);
      payload.append("email", formData.email || "");
      payload.append("phone", formData.phone || "");
      payload.append("role", formData.role);
      payload.append("active", active);
      payload.append("createdBy", localStorage.getItem("username") || "SYSTEM");
      if (formData.password) payload.append("password", formData.password);
      if (profileFile instanceof File) {
        payload.append("profilePic", profileFile);
      }

      if (!isNewUser) {
        const confirm = await showConfirm("Save changes to this user?");
        if (!confirm) return;

        await axios.put(`/api/usermaster/users/${formData.id}`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
        });

        await axios.put(
          `/api/usermaster/users/${formData.id}/permissions`,
          { modules: Object.values(modulePermissions) },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setNotification("User updated ✅");
        await fetchAllUsers();
        setEditing(false);
      } else {
        if (!formData.password) {
          await showMessage("Password is required");
          return;
        }

        const duplicate = allUsers.some(
          (u) =>
            u.username.toLowerCase() === formData.username.toLowerCase() ||
            (formData.email && u.email && u.email.toLowerCase() === formData.email.toLowerCase())
        );
        if (duplicate) {
          setNotification("User with this username/email already exists ⚠️");
          return;
        }

        const res = await axios.post("/api/usermaster/users/add", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const newUserId = res.data?.id;
        const permsToSave = Object.values(modulePermissions).map((m) => ({
          id: m.id,
          canView: m.canView,
          canAdd: m.canAdd,
          canEdit: m.canEdit,
          canDelete: m.canDelete,
        }));
        await axios.put(
          `/api/usermaster/users/${newUserId}/permissions`,
          { modules: permsToSave },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setNotification("User created ✅");
        await fetchAllUsers();
        resetForm();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // DELETE USER
  const handleDelete = async () => {
    if (!formData.id) {
      await showMessage("No user loaded to delete");
      return;
    }
    const confirm = await showConfirm("Are you sure you want to delete this user?");
    if (!confirm) return;

    try {
      await axios.delete(`/api/usermaster/users/${formData.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotification("User deleted ✅");
      await fetchAllUsers();
      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  // SEARCH TYPEAHEAD
  useEffect(() => {
    const trimmed = search.trim();

    if (!search) {
      setUserList([]);
      return;
    }

    if (!trimmed && search) {
      setUserList(allUsers);
      return;
    }

    const exactMatch = allUsers.find(
      (u) => u.username.toLowerCase() === trimmed.toLowerCase()
    );
    if (exactMatch) {
      setUserList([]);
      return;
    }

    const filtered = allUsers.filter((u) =>
      u.username.toLowerCase().includes(trimmed.toLowerCase())
    );

    if (filtered.length === 0) {
      setUserList([{ id: "__noresults__", username: "__NO_RESULTS__" }]);
    } else {
      setUserList(filtered);
    }
  }, [search, allUsers]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setUserList([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // SELECT USER
  const handleUserSelect = async (user) => {
    try {
      setSearch(user.username);
      setUserList([]);

      const res = await axios.get(`/api/usermaster/users/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fullUser = res.data;

      setProfileFile(null);

      const storedPic = fullUser.profilePicUrl;
      const profileUrl = storedPic
            ? storedPic.startsWith("http")
              ? storedPic + "?t=" + Date.now()
              : baseUrl + storedPic + "?t=" + Date.now()
            : "";

      setFormData({
        profilePicUrl: profileUrl,
        username: fullUser.username || "",
        role: fullUser.role || "",
        email: fullUser.email || "",
        countryCode: fullUser.countryCode || "+91",
        phone: fullUser.phone || "",
        password: "",
        id: fullUser.id || null,
      });

      setIsNewUser(false);
      setEditing(false);
      setShowPermission(true);
      setSelectedUser(fullUser);
      setActive(fullUser.active ?? true);

      if (modules.length === 0) await fetchModules();

      const permsRes = await axios.get(`/api/usermaster/users/${user.id}/permissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const perms = Array.isArray(permsRes.data?.modules) ? permsRes.data.modules : [];

      const newModulePerms = modules.reduce((acc, m) => {
        const perm = perms.find((pm) => pm.id === m.id);
        acc[m.id] = {
          ...m,
          canView: perm?.canView || false,
          canAdd: perm?.canAdd || false,
          canEdit: perm?.canEdit || false,
          canDelete: perm?.canDelete || false,
        };
        return acc;
      }, {});
      setModulePermissions(newModulePerms);

    } catch (err) {
      console.error(err);
    }
  };

  const handleCancel = async () => {
    // Only show confirmation if editing or creating a new user
    if (editing) {
      const confirmed = await showConfirm("Are you sure you want to cancel changes?");
      if (!confirmed) return;
    }

    resetForm();
    setShowSearch(false);
    setSearchActive(false);
  };

  const handleSearchClear = () => setSearch("");

  return (
    <div className="d-flex app-wrapper moduleBody">
      <Sidebar expanded={sidebarExpanded} onToggle={setSidebarExpanded} />
      <div
        className="main-content p-4"
        style={{
          flex: 1,
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
              top: 7,
              right: 5,
              zIndex: 9999,
              borderRadius: 8,
              padding: "10px 20px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)", // optional shadow
            }}
          >
            {notification}  {timer > 0 && `(${timer}s)`}
          </div>
        )}


        {/* HEADER + SEARCH */}
        <div
          className="d-flex align-items-center justify-content-between moduleFormBackground"
          style={{
            position: "sticky",
            top: 3,
            zIndex: 10,
            marginBottom: 5,
            textAlign: "center",
          }}
        >
          <h2 className="mb-0 text-center flex-grow-1" style={{ margin: 0, fontWeight: 700, color: "#333" }}>User Master</h2>
          <div
            className="d-flex align-items-center gap-0 position-relative" style={{margin: "5px"}}
            ref={dropdownRef}
          >
            <div
              className="d-flex align-items-center"
              style={{
                overflow: "hidden",
                transition: "width 0.3s ease",
                width: showSearch ? 360 : 0,
                opacity: showSearch ? 1 : 0,
              }}
            >
              <input
                type="text"
                className="form-control me-2"
                placeholder="Search username"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button
                className="btn btn-outline-secondary"
                onClick={handleSearchClear}
              >
                Clear
              </button>
            </div>
            {!showSearch && (
              <button
                className="btn btn-outline-primary"
                onClick={() => {
                  setShowSearch(true);
                  setSearchActive(true);
                  setShowPermission(false);
                }}
              >
                <FaSearch /> Search
              </button>
            )}
            <button
              className="btn btn-secondary ms-2"
              onClick={handleCancel}
            >
              Cancel
            </button>

            {showSearch &&
              Array.isArray(userList) &&
              userList.length > 0 && (
                <ul
                  className="dropdown-menu show"
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    width: "64%",
                    zIndex: 1000,
                  }}
                >
                  {userList.map((u) =>
                    u.id === "__noresults__" ? (
                      <li
                        key="noresults"
                        className="dropdown-item text-muted fst-italic"
                      >
                        No users found
                      </li>
                    ) : (
                      <li
                        key={u.id}
                        className="dropdown-item"
                        style={{ cursor: "pointer" }}
                        onClick={() => handleUserSelect(u)}
                      >
                        {u.username} ({u.role})
                      </li>
                    )
                  )}
                </ul>
              )}
          </div>
        </div>

        {/* FORM */}
        <div
          className="card p-4 shadow-sm mt-1"
          style={{
            borderRadius: 15,
            flex: 1,
            display: "flex",
            flexDirection: "row",
            gap: 40,
            overflowY: "auto",
            background: "rgba(255, 255, 255, 0.7)"
          }}
        >
          {/* PROFILE LEFT */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 280,
                height: 280,
                borderRadius: "50%",
                overflow: "hidden",
                //background: "#f3f4f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: formData.profilePic ? "pointer" : "default",
              }}
              onClick={() => formData.profilePicUrl && setShowFullImage(true)}
            >
              {formData.profilePicUrl ? (
                <img src={formData.profilePicUrl} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <FaUserCircle
                  style={{
                    width: "100%",       // full width
                    height: "100%",      // full height
                    color: "#9ca3af",   // keep color
                  }}
                />
              )}

            </div>
            <button
              className="btn btn-outline-dark mt-2"
              onClick={() => document.getElementById("profileUpload").click()}
              disabled={searchActive || (!editing && !isNewUser)}
            >
              Change Picture
            </button>
            <input
              type="file"
              id="profileUpload"
              name="profilePicUrl"
              accept="image/*"
              onChange={handleChange}
              style={{ display: "none" }}
            />
          </div>

          {/* DETAILS RIGHT */}
          <div
            style={{
              flex: 2,
              display: "flex",
              flexDirection: "column",
              gap: 20,
              position: "relative",
            }}
          >
            {/* Buttons */}
            <div style={{ position: "absolute", top: "10px", right: "0px" }}>
              {isNewUser || editing ? (
                <>
                  <button
                    className="btn btn-sm btn-success me-2"
                    onClick={handleSave}
                    disabled={(!editing && !isNewUser) || searchActive}
                  >
                    <FaSave /> Save
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn btn-sm btn-primary me-2"
                    onClick={() => {
                      setEditing(true);
                      setSearchActive(false);
                    }}
                  >
                    <FaEdit /> Edit
                  </button>
                  <button
                    className="btn btn-sm btn-danger me-2"
                    onClick={handleDelete}
                  >
                    <FaTrash /> Delete
                  </button>
                </>
              )}
            </div>

            {/* FORM FIELDS */}
            <div style={{ marginTop: 50 }}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label>Username *</label>
                  <input type="text" className="form-control" name="username" value={formData.username || ""} onChange={handleChange} disabled={searchActive || (!editing && !isNewUser)} />
                </div>
                <div className="col-md-6">
                  <label>Role *</label>
                  <select className="form-control" name="role" value={formData.role || ""} onChange={handleChange} disabled={searchActive || (!editing && !isNewUser)}>
                    <option value="">Select Role</option>
                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div className="row g-3" style={{ marginTop: "0px", marginBottom: "15px" }}>
                {/* Phone */}
                <div className="col-md-6">
                  <label style={{ fontWeight: "bold" }}>
                    <FaPhone style={{ marginRight: "8px" }} /> Mobile *
                  </label>
                  <div style={{ display: "flex", gap: "5px", marginTop: "5px" }}>
                    <input
                      type="text"
                      name="countryCode"
                      value={formData.countryCode || "+91"}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d+]/g, "");
                        setFormData((prev) => ({ ...prev, countryCode: value }));
                      }}
                      disabled={searchActive || (!editing && !isNewUser)}
                      placeholder="+91"
                      style={{
                        width: "70px",
                        padding: "12px",
                        borderRadius: "6px",
                        border: "1px solid #ccc",
                        textAlign: "center",
                      }}
                      required
                    />

                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone || ""}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setFormData((prev) => ({ ...prev, phone: value }));
                      }}
                      disabled={searchActive || (!editing && !isNewUser)}
                      placeholder="10-digit mobile"
                      maxLength={10}
                      style={{
                        flex: 1,
                        padding: "12px",
                        borderRadius: "6px",
                        border: "1px solid #ccc",
                      }}
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="col-md-6">
                  <label style={{ fontWeight: "bold" }}>
                    <FaEnvelope style={{ marginRight: "8px" }} /> Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFormData((prev) => ({ ...prev, email: value }));

                      if (value && !/^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/.test(value)) {
                        setEmailError("Invalid email format");
                      } else {
                        setEmailError("");
                      }
                    }}
                    disabled={searchActive || (!editing && !isNewUser)}
                    placeholder="Enter your email"
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "6px",
                      border: emailError ? "1px solid red" : "1px solid #ccc",
                      marginTop: "5px",
                    }}
                    required
                  />
                  {emailError && (
                    <div style={{ color: "red", marginTop: "5px", fontWeight: "bold" }}>
                      {emailError}
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-3 mt-2">
                <label className="form-label">Password</label>
                <div className="input-group">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control"
                    name="password"
                    value={formData.password || ""}
                    onChange={handleChange}
                    disabled={searchActive || (!editing && !isNewUser)}
                  />
                  <span className="input-group-text" style={{ cursor: "pointer" }} onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
              </div>

              {/* ACTIVE */}
              <div className="form-check mt-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  disabled={searchActive || (!editing && !isNewUser)}
                />
                <label className="form-check-label">Active</label>
              </div>

              {/* Permissions button aligned to right under password */}
              <div className="d-flex justify-content-end mt-2">
                <button
                  className="btn btn-sm btn-info"
                  onClick={() => setShowPermissionsModal(true)}
                  disabled={!showPermission}
                >
                  <FaLock /> Permissions
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* FULLSCREEN IMAGE */}
        {showFullImage && (
          <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200 }}
            onWheel={(e) => { e.preventDefault(); const delta = e.deltaY > 0 ? -0.1 : 0.1; setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 3)); }}
          >
            <div style={{ position: "absolute", top: 20, right: 30, color: "#fff", fontSize: 24, cursor: "pointer" }} onClick={() => { setShowFullImage(false); setZoom(1); }}>✕</div>
            <img src={formData.profilePicUrl} alt="Full" style={{ maxWidth: "90%", maxHeight: "90%", transform: `scale(${zoom})`, transition: "transform 0.2s" }} />
          </div>
        )}

        {/* PERMISSIONS MODAL */}
        {showPermissionsModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.6)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1300,
            }}
          >
            <div
              style={{
                background: "#fff",
                padding: 20,
                borderRadius: 10,
                width: "50%",
                height: "85vh",
                display: "flex",
                flexDirection: "column",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 10,
                  right: 15,
                  cursor: "pointer",
                  fontSize: 20,
                  fontWeight: 700,
                }}
                onClick={() => {
                  setShowPermissionsModal(false);
                  setSearchActive(false);
                }}
              >
                ✕
              </div>
              <h5 className="mb-3">Module Permissions</h5>

              {/* Table */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  scrollbarWidth: "none", // Firefox
                  msOverflowStyle: "none", // IE 10+
                }}
                className="hidden-scroll"
              >
                <table
                    className="table text-center"
                    style={{
                      border: "3px solid #1f2937", // Table border color
                      borderCollapse: "collapse",
                      width: "100%",
                    }}
                  >
                  <thead style={{ backgroundColor: "#1f2937" }}>
                    <tr>
                      {["Module", "View", "Add", "Edit", "Delete"].map((heading) => (
                        <th
                          key={heading}
                          style={{
                            color: "#fff",          // Header text color
                           // border: "1px solid #000", // Header cell border
                            backgroundColor: "#1f2937",
                            fontWeight: "bold",
                            textAlign: "center",
                            padding: "10px",
                          }}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const filteredModules = Object.values(modulePermissions).filter((mod) => {
                        // Hide MASTER modules if role is EMPLOYEE
                        if (formData.role === "EMPLOYEE" && mod.category === "MASTER") {
                          return false;
                        }
                        return mod.active && allowedModules.some((am) => String(am.id) === String(mod.id));
                      });

                      const maxVisibleRows = 7;
                      const hasScroll = filteredModules.length > maxVisibleRows;

                      const displayModules = hasScroll
                        ? filteredModules.slice(0, filteredModules.length)
                        : filteredModules;

                      const fillerRows =
                        !hasScroll && displayModules.length < maxVisibleRows
                          ? maxVisibleRows - displayModules.length
                          : 0;

                      return (
                        <>
                          {displayModules.map((mod) => (
                            <tr key={mod.id} style={{ height: "50px" }}>
                              <td>{mod.name}</td>
                              {["canView", "canAdd", "canEdit", "canDelete"].map((permKey) => (
                                <td key={permKey}>
                                  <input
                                    type="checkbox"
                                    checked={mod[permKey] || false}
                                    onChange={() => {
                                      setModulePermissions((prev) => {
                                        const newState = { ...prev };
                                        const currentRow = { ...newState[mod.id] };

                                        // Toggle the clicked permission
                                        currentRow[permKey] = !currentRow[permKey];

                                        // Logic to auto-check VIEW if ADD/EDIT/DELETE is checked
                                        if (permKey !== "canView") {
                                          if (currentRow[permKey]) {
                                            currentRow.canView = true;
                                          }
                                        }

                                        // Logic to uncheck all if VIEW is unchecked
                                        if (permKey === "canView" && !currentRow.canView) {
                                          currentRow.canAdd = false;
                                          currentRow.canEdit = false;
                                          currentRow.canDelete = false;
                                        }

                                        newState[mod.id] = currentRow;
                                        return newState;
                                      });
                                    }}
                                    disabled={!editing && !isNewUser}
                                  />
                                </td>
                              ))}

                            </tr>
                          ))}

                          {/* Blank filler rows */}
                          {Array.from({ length: fillerRows }).map((_, idx) => (
                            <tr key={`blank-${idx}`} style={{ height: "50px" }}>
                              <td colSpan={5}>&nbsp;</td>
                            </tr>
                          ))}
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default UserMaster;
