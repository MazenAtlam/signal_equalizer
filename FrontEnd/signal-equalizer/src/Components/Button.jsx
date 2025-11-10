import React from "react";

const Button = ({
  variant = "default",
  size = "default",
  className = "",
  children,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50";

  const variants = {
    default: "bg-black hover:bg-gray-50 text-gray-900",
    primary: "bg-gray-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-600 text-black hover:bg-gray-700",
    ghost: "hover:bg-gray-100 text-gray-700",
  };

  const sizes = {
    default: "h-9 px-3",
    sm: "h-8 px-2",
    lg: "h-10 px-4",
  };

  const styles = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button className={styles} {...props}>
      {children}
    </button>
  );
};

export default Button;
