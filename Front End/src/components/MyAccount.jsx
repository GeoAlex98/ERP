// src/components/MyAccount.jsx
import "../styles/common.css";
import axios from "axios";
import React, { useState, useEffect } from "react";
import { FaUserCircle, FaEnvelope, FaPhone, FaSave, FaLock, FaEdit } from "react-icons/fa";
import Sidebar from "./SideBar";
import { useMessageAndConfirmation } from "../context/MessageAndConfirmation";

const MyAccount = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState(null);
  const [showFullImage, setShowFullImage] = useState(false);
  const [zoom, setZoom] = useState(1); // 🔹 zoom leve

  const [form, setForm] = useState({
    username: "",
    phone: "",
    countryCode: "+91", // default
    email: ""
  });
  const [saveHover, setSaveHover] = useState(false);
  const [cancelHover, setCancelHover] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const { showMessage, showConfirm } = useMessageAndConfirmation();

  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [selectedFile, setSelectedFile] = useState(null); // add this at top
  const [emailError, setEmailError] = useState("");
  // 🔹 Password validation function
  const validatePassword = (pwd) => {
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
    return pwd.length >= 8 && hasUpper && hasLower && hasNumber && hasSpecial;
  };
  const baseUrl = "http://localhost:9070/";

  // Fetch user details
   useEffect(() => {
     setLoading(true);
     const token = localStorage.getItem("token");
     setForm({
       username: localStorage.getItem("username") || "",
       phone: localStorage.getItem("phone") || "",
       email: localStorage.getItem("email") || "",
       countryCode: "+91",
     });

     const storedPic = localStorage.getItem("profilePicUrl");
     if (storedPic) {
       setProfilePicUrl(storedPic.startsWith("http") ? storedPic : baseUrl + storedPic);
       console.log("Profile Pic URL:", storedPic.startsWith("http") ? storedPic : baseUrl + storedPic);
     }

     setLoading(false);
   }, []);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ Now we just let user input a URL or pick file to upload and get URL from backend if needed
   const handleProfilePicChange = (e) => {
     const file = e.target.files[0];
     if (!file) return;

     // Store the file locally to upload later when saving
     setSelectedFile(file);

     // Show a preview immediately
     const reader = new FileReader();
     reader.onload = () => setProfilePicUrl(reader.result);
     reader.readAsDataURL(file);
   };


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.username.trim()) return showMessage("Name is required.");
    if (!form.phone || form.phone.length !== 10) return showMessage("Please enter a valid 10-digit mobile number.");
    if (!form.email.trim()) return showMessage("Email is required.");
    const emailPattern = /^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(form.email)) return showMessage("Please enter a valid email address.");

    const confirmed = await showConfirm("Are you sure you want to update your account?");
    if (!confirmed) return;

    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      const formData = new FormData();
      formData.append("username", form.username);
      formData.append("email", form.email);
      formData.append("phone", form.phone);
      formData.append("countryCode", form.countryCode);
      if (selectedFile) formData.append("profilePic", selectedFile);

      const res = await axios.put("http://localhost:9070/account/update", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const data = res.data;
      localStorage.setItem("token", data.token);
      localStorage.setItem("username", data.username);
      localStorage.setItem("email", data.email);
      localStorage.setItem("phone", data.phone);
      localStorage.setItem("profilePicUrl", data.profilePicUrl);

      setForm({
        username: data.username,
        phone: data.phone,
        email: data.email,
        countryCode: data.countryCode || "+91",
      });

      const baseUrl = "http://localhost:9070/";
      setProfilePicUrl(
        data.profilePicUrl ? `${baseUrl}${data.profilePicUrl}?t=${new Date().getTime()}` : null
      );
      window.dispatchEvent(new CustomEvent("profilePicUpdated", { detail: data.profilePicUrl }));
      setSelectedFile(null);

      showMessage("Account updated successfully!");
    } catch (err) {
      console.error(err);
      showMessage(err.response?.data?.message || "Error updating account.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match!");
      return;
    }

    if (!validatePassword(passwordForm.newPassword)) {
      setPasswordError(
        "Password must be at least 8 characters, include uppercase, lowercase, number, and special character."
      );
      return;
    }

    const confirmed = await showConfirm("Are you sure you want to reset your password?");
    if (!confirmed) return;

    setLoading(true);
    axios
      .put(
        "http://localhost:9070/account/change-password",
        {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      )
      .then(() => {
        showMessage("Password updated successfully! Please login again.").then(() => {
          localStorage.removeItem("token");
          window.location.href = "/login";
        });
      })
      .catch((err) => {
        console.error(err);
        setPasswordError(err.response?.data?.message || "Error changing password.");
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="d-flex app-wrapper moduleBody">
      <Sidebar expanded={sidebarExpanded} onToggle={setSidebarExpanded} />

      <div
        style={{
          flexGrow: 1,
          marginLeft: sidebarExpanded ? "200px" : "60px",
          transition: "margin-left 0.3s ease",
          maxHeight: "100vh",
          padding: "20px",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          paddingTop: "30px",
        }}
      >
        {!showPasswordForm ? (
          <form className= "moduleFormBackground"
            onSubmit={handleSubmit}
            style={{
              width: "100%",
              maxWidth: "850px",
              padding: "30px",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              display: "flex",
              gap: "40px",
              position: "relative",
            }}
          >
            {loading && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(255,255,255,0.7)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  zIndex: 10,
                }}
              >
                Loading...
              </div>
            )}

            <div style={{ flex: "1", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div
                style={{
                  position: "relative",
                  width: "280px",
                  height: "280px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  marginTop: "75px",
                  cursor: profilePicUrl  ? "pointer" : "default",
                }}
                onClick={() => profilePicUrl && setShowFullImage(true)}
              >
                {profilePicUrl  ? (
                  <img
                    src={profilePicUrl || "/default-profile.png"} // fallback if URL is null
                    alt="Profile"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      e.target.onerror = null; // prevent infinite loop if default also fails
                      e.target.src = "/default-profile.png"; // path to your default image
                    }}
                  />

                ) : (
                  <FaUserCircle style={{ width: "100%", height: "100%", color: "#9ca3af" }} />
                )}
              </div>

              <div
                style={{
                  marginTop: "30px",
                  position: "absolute",
                  top: "50%",
                  right: "560px",
                  transform: "translateY(-50%)",
                  borderRadius: "50%",
                  padding: "0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: "none"
                }}
                onClick={() => document.getElementById("profileUpload").click()}
              >
                <FaEdit size={30} color="#1f2937" />
              </div>

              <input
                type="file"
                id="profileUpload"
                accept="image/*"
                onChange={handleProfilePicChange}
                style={{ display: "none" }}
              />
            </div>

            {showFullImage && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  width: "100vw",
                  height: "100vh",
                  background: "rgba(0,0,0,0.7)",
                  backdropFilter: "blur(8px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1000,
                  overflow: "hidden",
                }}
                onWheel={(e) => {
                  e.preventDefault();
                  const delta = e.deltaY > 0 ? -0.1 : 0.1;
                  setZoom((prev) => Math.min(Math.max(prev + delta, 0.5), 3));
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "20px",
                    right: "30px",
                    color: "#fff",
                    fontSize: "28px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    zIndex: 1010,
                  }}
                  onClick={() => { setShowFullImage(false); setZoom(1); }}
                >
                  &times;
                </div>

                <img
                  src={profilePicUrl}
                  alt="Full Profile"
                  style={{
                    transform: `scale(${zoom})`,
                    transition: "transform 0.1s ease",
                    maxWidth: "90%",
                    maxHeight: "90%",
                    borderRadius: "12px",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.5)",
                  }}
                  draggable={false}
                />
              </div>
            )}

            <div style={{ flex: "2" }}>
              <h2 className="mb-0 text-center flex-grow-1" style={{ margin: 0, fontWeight: 700, color: "#333" }}>My Account</h2>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ fontWeight: "bold" }}>
                  <FaUserCircle style={{ marginRight: "8px" }} /> Name
                </label>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    marginTop: "5px",
                  }}
                />
              </div>

              <div style={{ marginBottom: "15px" }}>
                <label style={{ fontWeight: "bold" }}>
                  <FaPhone style={{ marginRight: "8px" }} /> Mobile *
                </label>
                <div style={{ display: "flex", gap: "5px", marginTop: "5px" }}>
                  <input
                    type="text"
                    name="countryCode"
                    value={form.countryCode || "+91"}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d+]/g, "");
                      setForm((prev) => ({ ...prev, countryCode: value }));
                    }}
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
                    value={form.phone || ""}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setForm((prev) => ({ ...prev, phone: value }));
                    }}
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

              <div style={{ marginBottom: "15px" }}>
                <label style={{ fontWeight: "bold" }}>
                  <FaEnvelope style={{ marginRight: "8px" }} /> Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm((prev) => ({ ...prev, email: value }));

                    if (value && !/^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/.test(value)) {
                      setEmailError("Invalid email format");
                    } else {
                      setEmailError("");
                    }
                  }}
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

              <button
                type="submit"
                style={{
                  width: "100%",
                  backgroundColor: "#1f2937",
                  color: "#fff",
                  padding: "14px",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  fontWeight: "bold",
                  marginBottom: "10px",
                }}
              >
                <FaSave /> Save Changes
              </button>

              <button
                type="button"
                onClick={() => setShowPasswordForm(true)}
                style={{
                  width: "100%",
                  backgroundColor: "#f97316",
                  color: "#fff",
                  padding: "14px",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  fontWeight: "bold",
                }}
              >
                <FaLock /> Change Password
              </button>
            </div>
          </form>
        ) : (
          // Password form stays unchanged
          <form className= "moduleFormBackground"
            onSubmit={handlePasswordSubmit}
            style={{
              width: "100%",
              maxWidth: "500px",
              padding: "30px",
              borderRadius: "12px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
            }}
          >
            <h2 style={{ marginBottom: "20px", color: "#1f2937" }}>Change Password</h2>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ fontWeight: "bold" }}>Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                placeholder="Enter current password"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  marginTop: "5px",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ fontWeight: "bold" }}>New Password</label>
              <input
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                placeholder="Enter new password"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "6px",
                  border: passwordError ? "1px solid red" : "1px solid #ccc",
                  marginTop: "5px",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ fontWeight: "bold" }}>Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Confirm new password"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "6px",
                  border: passwordError ? "1px solid red" : "1px solid #ccc",
                  marginTop: "5px",
                }}
              />
            </div>

            {/* 🔹 Show error */}
            {passwordError && (
              <div style={{ color: "red", marginBottom: "10px", fontWeight: "bold" }}>
                {passwordError}
              </div>
            )}

            <button
              type="submit"
              onMouseEnter={() => setSaveHover(true)}
              onMouseLeave={() => setSaveHover(false)}
              style={{
                width: "100%",
                backgroundColor: saveHover ? "#111827" : "#1f2937", // darken on hover
                color: "#fff",
                padding: "14px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
                marginBottom: "10px",
                transition: "background-color 0.2s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
            >
              <FaSave /> Save Password
            </button>

            <button
              type="button"
                onClick={async () => {
                  const confirmClear = await showConfirm("Are you sure you want to cancel?");
                  if (confirmClear) {
                    setShowPasswordForm(false);
                    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                  }
                }}
              onMouseEnter={() => setCancelHover(true)}
              onMouseLeave={() => setCancelHover(false)}
              style={{
                width: "100%",
                backgroundColor: cancelHover ? "#b91c1c" : "#ef4444", // red normally, darker red on hover
                color: "#fff",
                padding: "14px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
                transition: "background-color 0.2s ease",
              }}
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default MyAccount;
