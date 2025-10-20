// src/App.jsx
import './App.css'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import axios from 'axios';

import { MessageAndConfirmationProvider, useMessageAndConfirmation } from "./context/MessageAndConfirmation";

// Fixed imports
import Login from './components/Login'
import HeaderComponent from './components/HeaderComponent'
import FooterComponent from './components/FooterComponent'

// Dynamic modules
import Dashboard from './components/Dashboard'
import Retailer from './components/Retailer'
import Item from './components/Item'
import Purchase from './components/Purchase'
import Order from './components/Order'
import Sale from './components/Sale'
import Collection from './components/Collection'
import SaleReturn from './components/SaleReturn'
import Stock from './components/Stock'
import Supplier from './components/Supplier'
import Packing from './components/Packing'
import UserMaster from './components/UserMaster'
import ModuleMaster from './components/ModuleMaster'
import FinancialReport from './components/FinancialReport'
import MyAccount from './components/MyAccount'
import Settings from './components/Settings'
import FinancialYearMaster from './components/FinancialYearMaster'

import ProtectedRoute from './context/ProtectedRoute';

const INACTIVITY_LIMIT = 600 * 60 * 1000; // 15 minutes
const API_BASE = "http://localhost:9070/api";

const routeMap = {
  DASHBOARD: <Dashboard />,
  PURCHASE: <Purchase />,
  ORDER: <Order />,
  SALE: <Sale />,
  COLLECTION: <Collection />,
  SALE_RETURN: <SaleReturn />,
  STOCK: <Stock />,
  SUPPLIER: <Supplier />,
  RETAILER: <Retailer />,
  ITEM: <Item />,
  PACKING: <Packing />,
  USER_MASTER: <UserMaster />,
  MODULE_MASTER: <ModuleMaster />,
  FINANCIAL_YEAR_MASTER: <FinancialYearMaster />,
  FINANCIAL_REPORT: <FinancialReport />,
};

// Helper for safe parse
function loadModulesFromStorage() {
  const stored = localStorage.getItem("allowedModules");
  if (!stored || stored === "undefined" || stored === "null") return [];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Failed to parse allowedModules from localStorage:", e, "Value was:", stored);
    return [];
  }
}

// App wrapper to access context
function AppWrapper() {
  const { showMessage } = useMessageAndConfirmation();
  return <App showMessage={showMessage} />;
}

function App({ showMessage }) {
  const [modules, setModules] = useState([]);
  const navigate = useNavigate();
  const [serverInfo, setServerInfo] = useState(null);
  const [wasOffline, setWasOffline] = useState(false);

  // ✅ Token check: if missing, redirect to login
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token && window.location.pathname !== "/login") {
      //navigate("/login", { replace: true });
      window.location.replace("/login");
    }
  }, [navigate]);

  // ✅ Server heartbeat check
//    useEffect(() => {
//       let interval;
//
//       const checkServer = async () => {
//         try {
//           const res = await axios.get(`${API_BASE}/health`, { timeout: 3000 });
//           setServerInfo(res.data);
//
//           if (wasOffline) {
//             showMessage && showMessage("✅ Server is back online");
//             setWasOffline(false); // reset flag after recovery
//           }
//         } catch (err) {
//           if (serverInfo !== null) {
//             showMessage && showMessage("⚠️ Server is offline. Some actions may not work.");
//           }
//           setServerInfo(null);
//           setWasOffline(true); // mark offline state
//         }
//       };
//
//       checkServer(); // run once at mount
//       interval = setInterval(checkServer, 1000); // check every 10s
//
//       return () => clearInterval(interval);
//     }, [serverInfo, wasOffline, showMessage]);

  // Load modules from storage
  useEffect(() => {
    const load = () => setModules(loadModulesFromStorage());
    load();
    window.addEventListener("allowedModulesUpdated", load);
    return () => window.removeEventListener("allowedModulesUpdated", load);
  }, []);

  // Auto logout effect
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    let logoutTimer;

    const logout = async () => {
      // Clear all user-related data
      localStorage.removeItem("token");
      localStorage.removeItem("id");
      localStorage.removeItem("userName");
      localStorage.removeItem("role");
      localStorage.removeItem("profilePicThumbUrl");
      localStorage.removeItem("allowedModules");

      // Show session timeout message and wait for OK
      if (showMessage) {
        await showMessage("Session time-out. Please re-login");
      }

      // Redirect to login safely
      window.location.replace("/login");
    };

    const resetTimer = () => {
      clearTimeout(logoutTimer);
      logoutTimer = setTimeout(logout, INACTIVITY_LIMIT);
    };

    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(logoutTimer);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [showMessage]);

  return (
    <>
      <HeaderComponent />

      {/* Banner for offline / health info */}
{/*       {!serverInfo ? ( */}
{/*         <div style={{ background: "red", color: "white", padding: "6px", textAlign: "center" }}> */}
{/*           ⚠️ Server is currently offline. Please try again later. */}
{/*         </div> */}
{/*       ) : ( */}
{/*         <div style={{ background: "#333", color: "white", padding: "6px", textAlign: "center" }}> */}
{/*           ✅ Server Online | Version: {serverInfo.version} | DB: {serverInfo.database} | */}
{/*           Profiles: {serverInfo.profiles.join(", ")} */}
{/*         </div> */}
{/*       )} */}

      <Routes>
        {/* Public route */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-account"
          element={
            <ProtectedRoute>
              <MyAccount />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* Dynamic modules */}
        {modules.map((mod) => {
          const path = '/' + mod.name.toLowerCase().replace(/_/g, '-');
          return (
            <Route
              key={mod.id}
              path={path}
              element={
                <ProtectedRoute>
                  {routeMap[mod.name.toUpperCase()] || <Dashboard />}
                </ProtectedRoute>
              }
            />
          );
        })}
      </Routes>

      <FooterComponent />
    </>
  );
}

export default function AppWithProvider() {
  return (
    <MessageAndConfirmationProvider>
      <BrowserRouter>
        <AppWrapper />
      </BrowserRouter>
    </MessageAndConfirmationProvider>
  );
}
