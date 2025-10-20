import React from 'react';

const FooterComponent = () => {
  return (
    <footer
      style={{
        padding: "5px 15px", // reduced from 15px to 8px
        backgroundColor: "#1f2937",
        color: "#fff",
        textAlign: "center",
        fontSize: "9px", // slightly smaller text
        boxShadow: "0 -2px 8px rgba(0,0,0,0.1)",
        position: "fixed",
        bottom: 0,
        width: "100%",
        zIndex: 500,
      }}
    >
      <span>© 2025 Geo. All Rights Reserved.</span>
    </footer>
  );
};

export default FooterComponent;
