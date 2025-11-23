import React, { useState } from "react";
import Card from "./Card";
import Button from "./Button";
import Subdivision from "./Subdivision";

const GenericEqualizer = ({ isVisible = true, onClose }) => {
  const [hovered1, setHovered1] = useState(false);
  const [hovered2, setHovered2] = useState(false);
  const [hovered3, setHovered3] = useState(false);
  const [hovered4, setHovered4] = useState(false);
  const [hovered5, setHovered5] = useState(false);

  if (!isVisible) {
    return null;
  }

  return (
    <div style={styles.stickyWrapper}>
      <Card
        className="generic-equalizer col-11 mx-auto px-4 pb-4"
        style={styles.card}
      >
        <div className="equalizer-header d-flex justify-content-between pt-3">
          <div className="equalizer-title d-flex pt-2">
            <svg
              className="equalizer-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              width="28"
              height="28"
            >
              <line x1="4" x2="4" y1="21" y2="14"></line>
              <line x1="4" x2="4" y1="10" y2="3"></line>
              <line x1="12" x2="12" y1="21" y2="12"></line>
              <line x1="12" x2="12" y1="8" y2="3"></line>
              <line x1="20" x2="20" y1="21" y2="16"></line>
              <line x1="20" x2="20" y1="12" y2="3"></line>
              <line x1="2" x2="6" y1="14" y2="14"></line>
              <line x1="10" x2="14" y1="8" y2="8"></line>
              <line x1="18" x2="22" y1="16" y2="16"></line>
            </svg>
            <h5 className="ms-2">Equalizer Controls</h5>
          </div>
          <div className="equalizer-controls px-2 pt-2 d-flex gap-3 mb-4">
            {/* Upload Setting Button */}
            <Button
              onMouseEnter={() => setHovered1(true)}
              onMouseLeave={() => setHovered1(false)}
              variant="secondary text-light"
              style={
                hovered1
                  ? {
                      backgroundColor: "#7bf447ff",
                      color: "#000000",
                      fontWeight: "600",
                      fontSize: "0.875rem",
                      paddingTop: "0.3rem",
                      paddingBottom: "0.3rem",
                      borderRadius: "4px",
                      border: "1px solid transparent",
                    }
                  : {
                      backgroundColor: "#111317",
                      color: "#FFFFFF",
                      fontWeight: "600",
                      fontSize: "0.875rem",
                      paddingTop: "0.3rem",
                      paddingBottom: "0.3rem",
                      borderRadius: "4px",
                      border: "1px solid transparent",
                    }
              }
              onClick={() =>
                document.getElementById("settings-upload")?.click()
              }
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                width="16"
                height="16"
                className="me-2"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" x2="12" y1="3" y2="15"></line>
              </svg>
              Upload Setting
            </Button>
            <input
              id="settings-upload"
              type="file"
              accept=".json"
              style={{ display: "none" }}
            />

            {/* Add Band Button */}
            <Button
              onMouseEnter={() => setHovered2(true)}
              onMouseLeave={() => setHovered2(false)}
              variant="secondary text-light"
              style={
                hovered2
                  ? {
                      backgroundColor: "#7bf447ff",
                      color: "#000000",
                      fontWeight: "600",
                      fontSize: "0.875rem",
                      paddingTop: "0.3rem",
                      paddingBottom: "0.3rem",
                      borderRadius: "4px",
                      border: "1px solid transparent",
                    }
                  : {
                      backgroundColor: "#1FD5F9",
                      color: "#000000",
                      fontWeight: "600",
                      fontSize: "0.875rem",
                      paddingTop: "0.3rem",
                      paddingBottom: "0.3rem",
                      borderRadius: "4px",
                      border: "1px solid transparent",
                    }
              }
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                width="16"
                height="16"
                className="me-2"
              >
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg>
              Add Band
            </Button>

            {/* Reset All Button */}
            <Button
              onMouseEnter={() => setHovered3(true)}
              onMouseLeave={() => setHovered3(false)}
              variant="secondary text-light"
              style={
                hovered3
                  ? {
                      backgroundColor: "#7bf447ff",
                      color: "#000000",
                      fontWeight: "600",
                      fontSize: "0.875rem",
                      paddingTop: "0.3rem",
                      paddingBottom: "0.3rem",
                      borderRadius: "4px",
                      border: "1px solid transparent",
                    }
                  : {
                      backgroundColor: "#111317",
                      color: "#FFFFFF",
                      fontWeight: "600",
                      fontSize: "0.875rem",
                      paddingTop: "0.3rem",
                      paddingBottom: "0.3rem",
                      borderRadius: "4px",
                      border: "1px solid transparent",
                    }
              }
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                width="16"
                height="16"
                className="me-2"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                <path d="M3 3v5h5"></path>
              </svg>
              Reset All
            </Button>

            {/* Save Scheme Button */}
            <Button
              onMouseEnter={() => setHovered4(true)}
              onMouseLeave={() => setHovered4(false)}
              variant="secondary text-light"
              style={
                hovered4
                  ? {
                      backgroundColor: "#7bf447ff",
                      color: "#000000",
                      fontWeight: "600",
                      fontSize: "0.875rem",
                      paddingTop: "0.3rem",
                      paddingBottom: "0.3rem",
                      borderRadius: "4px",
                      border: "1px solid transparent",
                    }
                  : {
                      backgroundColor: "#111317",
                      color: "#FFFFFF",
                      fontWeight: "600",
                      fontSize: "0.875rem",
                      paddingTop: "0.3rem",
                      paddingBottom: "0.3rem",
                      borderRadius: "4px",
                      border: "1px solid transparent",
                    }
              }
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                width="16"
                height="16"
                className="me-2"
              >
                <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"></path>
                <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"></path>
                <path d="M7 3v4a1 1 0 0 0 1 1h7"></path>
              </svg>
              Save Scheme
            </Button>

            {/* Close Button */}
            <Button
              variant="secondary"
              className="close-btn border-0"
              onMouseEnter={() => setHovered5(true)}
              onMouseLeave={() => setHovered5(false)}
              onClick={() => onClose && onClose()}
              style={
                hovered5
                  ? {
                      backgroundColor: "#7bf447ff",
                      borderRadius: "4px",
                      color: "#000000 !important",
                    }
                  : { backgroundColor: "transparent", borderRadius: "4px" }
              }
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
                width="16"
                height="16"
              >
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
            </Button>
          </div>
        </div>
        <div
          className="equalizer-canvas"
          style={{
            width: "100%",
            height: `calc(100% - 80px)`,
            position: "relative",
            overflow: "auto",
          }}
        >
          <Subdivision />
        </div>
      </Card>
    </div>
  );
};

const styles = {
  stickyWrapper: {
    position: "fixed",
    bottom: "0",
    left: "0",
    right: "0",
    zIndex: 1000,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  card: {
    boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.3)",
    marginBottom: "0",
    position: "relative",
    overflow: "auto", // Required for resize
    borderBottomLeftRadius: "0",
    borderBottomRightRadius: "0",
    width: "91.666%",
    resize: "vertical", // This enables browser-native resize
    minHeight: "200px",
    maxHeight: "80vh",
    height: "400px", // Initial height
  },
};

export default GenericEqualizer;
