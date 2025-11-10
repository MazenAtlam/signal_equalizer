import React from "react";

const Card = ({ className = "", children, ...props }) => {
  return (
    <div
      className={`rounded-lg shadow-sm ${className}`}
      {...props}
      style={{ backgroundColor: "#1A1D23", border: "1px solid #2A2E36" }}
    >
      {children}
    </div>
  );
};

export default Card;
