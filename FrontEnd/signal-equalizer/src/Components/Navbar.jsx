import Button from "./Button";

const Navbar = ({ currentMode, onModeChange, selectedCategory, onCategoryChange }) => {
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
                {/* Category Dropdown - Only show in Customized Mode */}
                {currentMode === "customized" && (
                    <div className="category-dropdown">
                        <select
                            value={selectedCategory}
                            onChange={(e) => onCategoryChange(e.target.value)}
                            style={{
                                backgroundColor: "#2A2E36",
                                border: "1px solid #3A3E46",
                                borderRadius: "4px",
                                color: "#FFFFFF",
                                padding: "0.3rem 0.75rem",
                                fontWeight: "600",
                                fontSize: "0.875rem",
                                cursor: "pointer",
                                minWidth: "160px",
                            }}
                        >
                            <option value="Human Voices">Human Voices</option>
                            <option value="Animal Sounds">Animal Sounds</option>
                            <option value="Musical Instruments">Musical Instruments</option>
                        </select>
                    </div>
                )}

                <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => onModeChange("generic")}
                    style={{
                        backgroundColor: currentMode === "generic" ? "#1FD5F9" : "#2A2E36",
                        border: currentMode === "generic" ? "1px solid transparent" : "1px solid #3A3E46",
                        borderRadius: "4px",
                        color: currentMode === "generic" ? "#000000" : "#FFFFFF",
                        paddingTop: "0.3rem",
                        paddingBottom: "0.3rem",
                        fontWeight: "600",
                        fontSize: "0.875rem",
                        transition: "all 0.2s ease",
                    }}
                >
                    Generic Mode
                </Button>
                <Button
                    size="lg"
                    onClick={() => onModeChange("customized")}
                    style={{
                        backgroundColor: currentMode === "customized" ? "#1FD5F9" : "#2A2E36",
                        border: currentMode === "customized" ? "1px solid transparent" : "1px solid #3A3E46",
                        borderRadius: "4px",
                        color: currentMode === "customized" ? "#000000" : "#FFFFFF",
                        paddingTop: "0.3rem",
                        paddingBottom: "0.3rem",
                        fontWeight: "600",
                        fontSize: "0.875rem",
                        transition: "all 0.2s ease",
                    }}
                >
                    Customized Mode
                </Button>
            </div>
        </div>
    );
};

export default Navbar;