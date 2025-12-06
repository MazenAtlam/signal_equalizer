import React from "react";

const Alert = ({ variant = "default", className = "", children, ...props }) => {
  const variants = {
    default: "border-gray-200 bg-gray-50 text-gray-800",
    destructive: "border-red-200 bg-red-50 text-red-800",
    success: "border-green-200 bg-green-50 text-green-800",
  };

  return (
    <div
      className={`rounded-lg border p-4 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Alert;
