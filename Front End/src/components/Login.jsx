// src/components/Login.jsx
import bgImage from "/src/assets/LogInBackground.jpg";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaEye, FaEyeSlash, FaExclamationCircle, FaCheckCircle, FaArrowLeft } from "react-icons/fa";
import HeaderComponent from "./HeaderComponent";
import FooterComponent from "./FooterComponent";

const ATTEMPT_LOCK = 5;
const LOGIN_COOLDOWN_MINUTES = 15;
const CODE_VALIDITY_SECONDS = 300;
const RESET_EMAIL_LOCK = 4;
const RESET_EMAIL_COOLDOWN_MINUTES = 60;

const Login = () => {
  const navigate = useNavigate();

  const [view, setView] = useState("login");
  const [step, setStep] = useState(1);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  const [failedResetAttempts, setFailedResetAttempts] = useState(0);
  const [resetCooldownRemaining, setResetCooldownRemaining] = useState(0);
  const [codeTimer, setCodeTimer] = useState(CODE_VALIDITY_SECONDS);

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [showAttemptsLeft, setShowAttemptsLeft] = useState(false);

  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const formatTime = (ms) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const validatePassword = (pwd) => {
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
    return pwd.length >= 8 && hasUpper && hasLower && hasNumber && hasSpecial;
  };

  const resetMessages = () => {
    setError("");
    setSuccess("");
    setShowAttemptsLeft(false);
  };

  // Load attempts from localStorage
  useEffect(() => {
    const attemptsData = JSON.parse(localStorage.getItem("failedAttemptsData"));
    if (attemptsData) {
      const { count, timestamp } = attemptsData;
      const elapsed = Date.now() - timestamp;
      const cooldown = LOGIN_COOLDOWN_MINUTES * 60 * 1000;
      if (count >= ATTEMPT_LOCK && elapsed < cooldown) setCooldownRemaining(cooldown - elapsed);
      setFailedAttempts(count);
    }
    const resetData = JSON.parse(localStorage.getItem("failedResetData"));
    if (resetData) {
      const { count, timestamp } = resetData;
      const elapsed = Date.now() - timestamp;
      const cooldown = RESET_EMAIL_COOLDOWN_MINUTES * 60 * 1000;
      if (count >= RESET_EMAIL_LOCK && elapsed < cooldown) setResetCooldownRemaining(cooldown - elapsed);
      setFailedResetAttempts(count);
    }
  }, []);

  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const interval = setInterval(() => setCooldownRemaining((prev) => (prev <= 1000 ? 0 : prev - 1000)), 1000);
    return () => clearInterval(interval);
  }, [cooldownRemaining]);

  useEffect(() => {
    if (resetCooldownRemaining <= 0) return;
    const interval = setInterval(() => setResetCooldownRemaining((prev) => (prev <= 1000 ? 0 : prev - 1000)), 1000);
    return () => clearInterval(interval);
  }, [resetCooldownRemaining]);

  useEffect(() => {
    if (view !== "reset" || step !== 2) return;
    if (codeTimer <= 0) {
      setError("Verification code expired. Please request a new one.");
      setStep(1);
      setCodeTimer(CODE_VALIDITY_SECONDS);
      return;
    }
    const interval = setInterval(() => setCodeTimer((prev) => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [view, step, codeTimer]);

  // --- Login ---
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:9070/auth/login",
        { email: identifier, password },
        { withCredentials: true }
      );

      // reset attempts
      localStorage.removeItem("failedAttemptsData");
      setFailedAttempts(0);
      setCooldownRemaining(0);
      setShowAttemptsLeft(false);

      // store user data
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("id", res.data.id);
      localStorage.setItem("username", res.data.name);
      localStorage.setItem("role", res.data.role);

      // ✅ profile pic URL handling
      const profilePicThumbUrl = res.data.profilePicThumbUrl
        ? res.data.profilePicThumbUrl.startsWith("http")
          ? `${res.data.profilePicThumbUrl}?t=${Date.now()}`
          : `http://localhost:9070/${res.data.profilePicThumbUrl}?t=${Date.now()}`
        : "";
      localStorage.setItem("profilePicThumbUrl", profilePicThumbUrl);

      localStorage.setItem("allowedModules", JSON.stringify(res.data.allowedModules));

      setSuccess("Login successful!");
      setTimeout(() => (window.location.href = "/dashboard"), 2000);
    } catch (err) {
      let message = "Invalid credentials!";
      if (err.response?.data?.message) message = err.response.data.message;

      if (message === "Invalid credentials!") {
        const newAttempts = failedAttempts + 1;
        localStorage.setItem("failedAttemptsData", JSON.stringify({ count: newAttempts, timestamp: Date.now() }));
        setFailedAttempts(newAttempts);
        setShowAttemptsLeft(newAttempts >= ATTEMPT_LOCK - 3);
        if (newAttempts >= ATTEMPT_LOCK) setCooldownRemaining(LOGIN_COOLDOWN_MINUTES * 60 * 1000);
      }
      setError(message);
      setLoading(false);
    }
  };

  // --- Forgot password ---
  const handleForgotPassword = () => {
    resetMessages();
    setView("reset");
    setStep(1);
  };

  // --- Send code ---
  const handleSendCode = async () => {
    resetMessages();
    if (!identifier) return setError("Please enter your email.");
    if (resetCooldownRemaining > 0) return setError(`Cannot request code yet. Cooldown: ${formatTime(resetCooldownRemaining)}`);

    setLoading(true);
    try {
      const check = await axios.post("http://localhost:9070/auth/check-email", { email: identifier }, { withCredentials: true });
      if (!check.data.exists) {
        setError("Email not found.");
        setLoading(false);
        return;
      }
      await axios.post("http://localhost:9070/auth/send-reset-code", { email: identifier }, { withCredentials: true });
      setStep(2);
      setCodeTimer(CODE_VALIDITY_SECONDS);
      setSuccess("Verification code sent! Valid for 5 minutes.");
      localStorage.setItem("failedResetData", JSON.stringify({ count: 0, timestamp: Date.now() }));
      setFailedResetAttempts(0);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send verification code.");
    } finally {
      setLoading(false);
    }
  };

  // --- Reset password ---
  const handleResetPassword = async () => {
    resetMessages();
    if (!code || !newPassword || !confirmPassword) return setError("All fields are required.");
    if (newPassword !== confirmPassword) return setError("Passwords do not match.");
    if (!validatePassword(newPassword)) return setError("Password must be 8+ chars, contain uppercase, lowercase, number, and special char.");

    setLoading(true);
    try {
      await axios.post(
        "http://localhost:9070/auth/reset-password",
        { email: identifier, code, newPassword },
        { withCredentials: true }
      );

      localStorage.removeItem("failedResetData");
      setFailedResetAttempts(0);
      setResetCooldownRemaining(0);
      setSuccess("Password reset successfully!");
      setIdentifier("");
      setPassword("");
      setCode("");
      setNewPassword("");
      setConfirmPassword("");
      setCodeTimer(CODE_VALIDITY_SECONDS);

      setView("login");
      resetMessages();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", position: "relative" }}>
        <HeaderComponent />

        {/* Loading */}
        {loading && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
            <div style={{ width: 50, height: 50, border: "5px solid #ccc", borderTopColor: "#764ba2", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            <style>{`@keyframes spin {0% {transform: rotate(0deg);}100% {transform: rotate(360deg);}}`}</style>
          </div>
        )}

        <div
          style={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: `url(${bgImage}) center/cover no-repeat`, // background image
            padding: 20,
          }}
        >
          <div
            style={{
              position: "relative",
              background: "rgba(0, 0, 0, 0.5)", // fully transparent
              padding: 40,
              borderRadius: 15,
              boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
              width: 400,
              backdropFilter: "blur(10px)", // frosted glass blur effect
              color: "#fff", // text color white
            }}
          >
            <style>
                  {`
                    h2, h3, label, div, span, p {
                      color: #fff !important;
                    }
                    input {
                      background: rgba(255, 255, 255, 0.15);
                      border: 1px solid rgba(255,255,255,0.4);
                      color: #fff;
                    }
                    input::placeholder {
                      color: rgba(255,255,255,0.7);
                    }
                    button {
                      background: rgba(255,255,255,0.15);
                      border: 1px solid rgba(255,255,255,0.4);
                      color: #fff;
                    }
                    button:hover {
                      background: rgba(255,255,255,0.25);
                    }
                    input:-webkit-autofill,
                        input:-webkit-autofill:hover,
                        input:-webkit-autofill:focus,
                        input:-webkit-autofill:active {
                          -webkit-box-shadow: 0 0 0px 1000px rgba(255,255,255,0.15) inset !important;
                          -webkit-text-fill-color: #fff !important;
                          transition: background-color 5000s ease-in-out 0s;
                        }
                    input:focus {
                          outline: none; /* remove default outline */
                          border-color: black !important; /* set border to black */
                          box-shadow: 0 0 0 2px rgba(0,0,0,0.2); /* optional subtle glow */
                        }
                  `}
                </style>

            <h2 style={{ textAlign: "center", marginBottom: 20 }}>{view === "login" ? "Welcome Back" : "Reset Password"}</h2>

            {/* Back arrow */}{/*
            {view === "reset" && (
              <FaArrowLeft
                onClick={() => {
                  setIdentifier("");
                  setPassword("");
                  setCode("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setCodeTimer(CODE_VALIDITY_SECONDS);
                  setStep(1);
                  setView("login");
                  resetMessages();

                  }
                }
                style={{ position: "absolute", top: 20, left: 20, cursor: "pointer", fontSize: 18, color: "#764ba2" }}
              />
            )} */}

            {/* Developer Reset */}
            {process.env.NODE_ENV === "development" && (
              <button
                onClick={() => {
                  setFailedAttempts(0); setCooldownRemaining(0);
                  setFailedResetAttempts(0); setResetCooldownRemaining(0);
                  localStorage.removeItem("failedAttemptsData");
                  localStorage.removeItem("failedResetData");
                  setSuccess("Developer override: attempts & timers reset!");
                }}
                style={{ position: "absolute", top: 10, right: 10, padding: "5px 10px", fontSize: "0.8rem", borderRadius: 5, background: "#ff5722", color: "#fff", border: "none", cursor: "pointer" }}
              >
                DEV RESET
              </button>
            )}

           {success && (
             <div
               style={{
                 background: "rgba(76, 175, 80, 0.3)", // semi-transparent green
                 color: "#fff", // white text
                 padding: 10,
                 borderRadius: 6,
                 marginBottom: 15,
                 textAlign: "center",
                 display: "flex",
                 alignItems: "center",
                 justifyContent: "center",
                 gap: 8
               }}
             >
               <FaCheckCircle /> {success}
             </div>
           )}


            {/* Login Form */}
            {view === "login" && (
              <form onSubmit={handleLoginSubmit}>
                {error && !showAttemptsLeft && (
                  <div style={{ background: "rgba(170, 60, 50, 0.3)", color: "rgb(255, 27, 27)", padding: 10, borderRadius: 6, marginBottom: 15, textAlign: "center" }}>
                    <FaExclamationCircle style={{ marginRight: 8 }} /> {error}
                  </div>
                )}

                <div className="mb-3">
                  <label>Email or Username</label>
                  <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc" }} />
                </div>

                <div className="mb-3">
                  <label>Password</label>
                  <div style={{ position: "relative" }}>
                    <input type={passwordVisible ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc" }} />
                    <span onClick={() => setPasswordVisible(!passwordVisible)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", cursor: "pointer" }}>
                      {passwordVisible ? <FaEyeSlash /> : <FaEye />}
                    </span>
                  </div>
                  {showAttemptsLeft && failedAttempts < ATTEMPT_LOCK && (
                    <div style={{ fontSize: "0.85rem", color: "#b91c1c", marginTop: 5 }}>
                      {ATTEMPT_LOCK - failedAttempts} attempt{ATTEMPT_LOCK - failedAttempts > 1 ? "s" : ""} left
                    </div>
                  )}
                </div>

                {/* Forgot Password link */}
                {failedAttempts >= 1 && (
                  <div className="mb-3 text-end">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={cooldownRemaining > 0}
                      style={{ fontSize: "0.9rem", textDecoration: "underline", border: "none", background: "none", color: "#764ba2", cursor: cooldownRemaining > 0 ? "not-allowed" : "pointer" }}
                    >
                      Forgot Password?
                    </button>
                    {cooldownRemaining > 0 && <div style={{ fontSize: "0.8rem", color: "#555" }}>Available in {formatTime(cooldownRemaining)}</div>}
                  </div>
                )}

                <button type="submit" disabled={loading} style={{ width: "100%", padding: 10, borderRadius: 6, background: "#764ba2", color: "#fff", fontWeight: "bold" }}>
                  Login
                </button>
              </form>
            )}

            {/* Reset Form */}
            {view === "reset" && (
              <>
                {step === 1 && (
                  <>
                    <h3 style={{ textAlign: "left", marginBottom: 20, fontWeight: "normal", fontSize: "20px" }}>
                      Step 1: Verification
                    </h3>


                    {/* Back arrow: clears password fields only */}
                    <FaArrowLeft
                      onClick={() => {
                        setPassword("");
                        setCode("");
                        setNewPassword("");
                        setConfirmPassword("");
                        setCodeTimer(CODE_VALIDITY_SECONDS);
                        resetMessages();
                      }}
                      style={{ position: "absolute", top: 20, left: 20, cursor: "pointer", fontSize: 18, color: "#764ba2" }}
                    />

                    {error && (
                      <div style={{ background: "#fef3f3", color: "#b91c1c", padding: 10, borderRadius: 6, marginBottom: 15, textAlign: "center" }}>
                        <FaExclamationCircle style={{ marginRight: 8 }} /> {error}
                      </div>
                    )}
                    <div className="mb-3">
                      <label>Email</label>
                      <input type="email" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Enter your email" style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc" }} />
                    </div>
                    <button onClick={handleSendCode} disabled={loading || resetCooldownRemaining > 0} style={{ width: "100%", padding: 10, borderRadius: 6, background: "#764ba2", color: "#fff", fontWeight: "bold" }}>
                      Send Verification Code
                    </button>
                    {resetCooldownRemaining > 0 && <div style={{ fontSize: "0.8rem", color: "#555", marginTop: 5 }}>Next code available in {formatTime(resetCooldownRemaining)}</div>}
                  </>
                )}

                {step === 2 && (
                  <>
                    <h3 style={{ textAlign: "left", marginBottom: 20, fontWeight: "normal", fontSize: "20px" }}>
                        Step 2: New Password
                    </h3>

                    {error && (
                      <div style={{ background: "#fef3f3", color: "#b91c1c", padding: 10, borderRadius: 6, marginBottom: 15, textAlign: "center" }}>
                        <FaExclamationCircle style={{ marginRight: 8 }} /> {error}
                      </div>
                    )}

                    <div className="mb-3">
                      <label>Verification Code</label>
                      <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter code" style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc" }} />
                    </div>

                    <div className="mb-3">
                      <label>New Password</label>
                      <div style={{ position: "relative" }}>
                        <input
                          type={newPasswordVisible ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter new password"
                          style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
                        />
                        <span
                          onClick={() => setNewPasswordVisible(!newPasswordVisible)}
                          style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", cursor: "pointer" }}
                        >
                          {newPasswordVisible ? <FaEyeSlash /> : <FaEye />}
                        </span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label>Confirm Password</label>
                      <div style={{ position: "relative" }}>
                        <input
                          type={confirmPasswordVisible ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm password"
                          style={{ width: "100%", padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
                        />
                        <span
                          onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                          style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", cursor: "pointer" }}
                        >
                          {confirmPasswordVisible ? <FaEyeSlash /> : <FaEye />}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginTop: 10 }}>


                      <button
                        onClick={() => {
                          if (window.confirm("Are you sure you want to cancel? All entered data will be cleared.")) {
                            setIdentifier("");
                            setPassword("");
                            setCode("");
                            setNewPassword("");
                            setConfirmPassword("");
                            setStep(1);
                            setView("login");
                            resetMessages();
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: 10,
                          borderRadius: 6,
                          background: "#e0e0e0",
                          color: "#333",
                          fontWeight: "bold",
                          cursor: "pointer"
                        }}
                      >
                        Cancel
                      </button>

                      <button
                         onClick={handleResetPassword}
                         disabled={loading}
                         style={{
                            flex: 1,
                            padding: 10,
                            borderRadius: 6,
                            background: "#764ba2",
                            color: "#fff",
                            fontWeight: "bold",
                            cursor: loading ? "not-allowed" : "pointer"
                         }}
                         >
                            Reset Password
                      </button>
                    </div>

                  </>
                )}
              </>
            )}

          </div>
        </div>
      </div>
    );
  };

  export default Login;