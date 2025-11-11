// Navbar.jsx
import Button from "./Button";

const Navbar = () => {
  return (
    <div className="equalizer-navbar px-5">
      <div className="navbar-brand">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="navbar-icon"
        >
          <path d="M3 3v16a2 2 0 0 0 2 2h16"></path>
          <path d="M18 17V9"></path>
          <path d="M13 17V5"></path>
          <path d="M8 17v-3"></path>
        </svg>
        <h1 className="text-2xl font-bold mb-0 gradient-text">Signal Equalizer</h1>
      </div>
      <div className="d-flex align-items-center gap-3">
        <Button
          variant="secondary"
          size="lg"
          style={{
            backgroundColor: "#1FD5F9",
            border: "1px solid transparent",
            borderRadius: "4px",
            color: "#000000",
            paddingTop: "0.3rem",
            paddingBottom: "0.3rem",
            fontWeight: "600",
            fontSize: "0.875rem",
          }}
        >
          Generic Mode
        </Button>
        <Button
          size="lg"
          style={{
            backgroundColor: "#2A2E36 !important",
            border: "1px solid #3A3E46",
            borderRadius: "4px",
            color: "#FFFFFF",
            paddingTop: "0.3rem",
            paddingBottom: "0.3rem",
            fontWeight: "600",
            fontSize: "0.875rem",
          }}
        >
          Customized Mode
        </Button>
      </div>
    </div>
  );
};

export default Navbar;
