import React, { createContext, useContext, useState } from "react";

const MessageAndConfirmationContext = createContext();

export const useMessageAndConfirmation = () => useContext(MessageAndConfirmationContext);

export const MessageAndConfirmationProvider = ({ children }) => {
  const [modal, setModal] = useState(null);

  // Show info message (with OK)
  const showMessage = (message) =>
    new Promise((resolve) => {
      setModal({
        type: "message",
        message,
        resolve,
      });
    });

  // Show confirmation (with Yes/No)
  const showConfirm = (message) =>
    new Promise((resolve) => {
      setModal({
        type: "confirm",
        message,
        resolve,
      });
    });

  const closeModal = (result) => {
    modal?.resolve(result);
    setModal(null);
  };

  return (
    <MessageAndConfirmationContext.Provider value={{ showMessage, showConfirm }}>
      {children}

      {modal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10000,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "20px 30px",
              borderRadius: "10px",
              maxWidth: "400px",
              textAlign: "center",
              boxShadow: "0 5px 15px rgba(0,0,0,0.3)",
            }}
          >
            <p style={{ marginBottom: "20px", fontSize: "16px", fontWeight: "500" }}>
              {modal.message}
            </p>

            {modal.type === "message" ? (
              <button
                onClick={() => closeModal(true)}
                style={{
                  background: "#1f2937",
                  color: "#fff",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                OK
              </button>
            ) : (
              <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                <button
                  onClick={() => closeModal(true)}
                  style={{
                    background: "#16a34a",
                    color: "#fff",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Yes
                </button>
                <button
                  onClick={() => closeModal(false)}
                  style={{
                    background: "#dc2626",
                    color: "#fff",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  No
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </MessageAndConfirmationContext.Provider>
  );
};
