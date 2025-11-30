import React, { useState, useRef, useEffect, useCallback } from "react";
import Card from "./Card";
import Button from "./Button";
import Subdivision from "./Subdivision";
import { equalizeAudio } from "../utils/api";
import { useToast } from "./Toast";

// Band configuration interface
const getDefaultBands = () => [
  { id: "sub", label: "Sub (20-60 Hz)", value: 0, min: -20, max: 20 },
  { id: "bass", label: "Bass (60-250 Hz)", value: 0, min: -20, max: 20 },
  { id: "low-mid", label: "Low-Mid (250-500 Hz)", value: 0, min: -20, max: 20 },
  { id: "mid", label: "Mid (500-2k Hz)", value: 0, min: -20, max: 20 },
  { id: "high-mid", label: "High-Mid (2k-4k Hz)", value: 0, min: -20, max: 20 },
  { id: "presence", label: "Presence (4k-6k Hz)", value: 0, min: -20, max: 20 },
  {
    id: "brilliance",
    label: "Brilliance (6k+ Hz)",
    value: 0,
    min: -20,
    max: 20,
  },
];

const GenericEqualizer = ({ isVisible = true, onClose }) => {
  const [hovered1, setHovered1] = useState(false);
  const [hovered2, setHovered2] = useState(false);
  const [hovered3, setHovered3] = useState(false);
  const [hovered4, setHovered4] = useState(false);
  const [hovered5, setHovered5] = useState(false);
  const [height, setHeight] = useState(500);
  const [isDraggingHeight, setIsDraggingHeight] = useState(false);
  const [bands, setBands] = useState([]); // Start with empty array
  const [signalId, setSignalId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const pendingRequestRef = useRef(null);
  const containerRef = useRef(null);
  const { showToast } = useToast();

  // Initialize bands only once on mount
  useEffect(() => {
    setBands(getDefaultBands());
  }, []);

  // Mouse move handler for resizing
  const handleMouseMove = (e) => {
    if (isDraggingHeight && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const newHeight = rect.bottom - e.clientY;
      setHeight(Math.max(200, Math.min(600, newHeight)));
    }
  };

  // Mouse up handler
  const handleMouseUp = () => {
    setIsDraggingHeight(false);
  };

  // Mouse down handler for resize handle
  const handleMouseDownResize = (e) => {
    e.preventDefault();
    setIsDraggingHeight(true);
  };

  // Add Band functionality
  const addBand = () => {
    const newBand = {
      id: `custom-${Date.now()}`,
      label: "Custom Band",
      value: 0,
      min: -20,
      max: 20,
    };
    setBands((prevBands) => [...prevBands, newBand]);
  };

  // Remove Band functionality
  const removeBand = (id) => {
    if (bands.length > 3) {
      // Keep minimum 3 bands
      setBands((prevBands) => prevBands.filter((band) => band.id !== id));
    }
  };

  // Handle slider value change
  const handleSliderChange = (id, value) => {
    setBands((prevBands) =>
        prevBands.map((band) =>
            band.id === id ? { ...band, value: value[0] } : band
        )
    );
  };

  // Handle band position change
  const handleBandPositionChange = (bandId, newPosition) => {
    setBands((prevBands) =>
        prevBands.map((band) =>
            band.id === bandId ? { ...band, position: newPosition } : band
        )
    );
  };

  // Handle band bandwidth change
  const handleBandBandwidthChange = (bandId, newBandwidth) => {
    setBands((prevBands) =>
        prevBands.map((band) =>
            band.id === bandId ? { ...band, bandwidth: newBandwidth } : band
        )
    );
  };

  // Reset all bands to default values
  const resetAllBands = () => {
    setBands(getDefaultBands());
  };

  // Convert bands to equalizer scheme format
  const bandsToEqualizerScheme = useCallback((bands) => {
    const minFreq = 20;
    const maxFreq = 20000;
    const minLog = Math.log10(minFreq);
    const maxLog = Math.log10(maxFreq);

    const positionToFreq = (position) => {
      const freqLog = minLog + (position / 100) * (maxLog - minLog);
      return Math.pow(10, freqLog);
    };

    return bands.map((band) => {
      const centerFreq = positionToFreq(band.position || 50);
      const bandwidth = band.bandwidth || 1;

      const centerLog = Math.log10(centerFreq);
      const range = (maxLog - minLog) * (bandwidth * 0.02);

      const startFrequency = Math.max(minFreq, Math.pow(10, centerLog - range));
      const endFrequency = Math.min(maxFreq, Math.pow(10, centerLog + range));

      return {
        freq_start_hz: Math.round(startFrequency),
        freq_end_hz: Math.round(endFrequency),
        scale_factor: band.value
      };
    });
  }, []);

  // Send equalizer request to API
  const sendEqualizerRequest = useCallback(async (bands) => {
    if (!signalId) {
      console.warn("No signal ID available for equalizer request");
      return;
    }

    if (pendingRequestRef.current) {
      clearTimeout(pendingRequestRef.current);
    }

    pendingRequestRef.current = setTimeout(async () => {
      try {
        setIsProcessing(true);
        const equalizerScheme = bandsToEqualizerScheme(bands);

        console.log("Sending equalizer request:", {
          signal_id: signalId,
          count: equalizerScheme.length,
          equalizer_scheme: equalizerScheme
        });

        const result = await equalizeAudio(signalId, equalizerScheme);

        // Handle the result - you might want to update the audio data in the parent component
        console.log("Equalizer applied successfully:", result);
        showToast("Equalizer applied successfully", "success");

      } catch (error) {
        console.error("Failed to apply equalizer:", error);
        showToast("Failed to apply equalizer settings", "error");
      } finally {
        setIsProcessing(false);
        pendingRequestRef.current = null;
      }
    }, 300); // 300ms debounce to ensure user has finished interacting
  }, [signalId, bandsToEqualizerScheme, showToast]);

  // Handle interaction end (mouse up) - send API request
  const handleInteractionEnd = useCallback(() => {
    if (bands.length > 0 && signalId) {
      sendEqualizerRequest(bands);
    }
  }, [bands, signalId, sendEqualizerRequest]);

  // Set up global mouse up listener for interaction end
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      handleInteractionEnd();
    };

    document.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleGlobalMouseUp);
      if (pendingRequestRef.current) {
        clearTimeout(pendingRequestRef.current);
      }
    };
  }, [handleInteractionEnd]);

  // Add global event listeners for resize
  useEffect(() => {
    if (isDraggingHeight) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDraggingHeight]);

  // Load signal ID from somewhere (you might need to pass this as a prop)
  useEffect(() => {
    // This is a placeholder - you'll need to get the actual signal ID from your app state
    // For now, we'll try to get it from localStorage or leave it null
    const currentSignalId = localStorage.getItem('currentSignalId');
    if (currentSignalId) {
      setSignalId(currentSignalId);
    }
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
      <div
          ref={containerRef}
          style={{
            ...styles.stickyWrapper,
            height: `${height}px`,
          }}
      >
        {/* Resize Handle */}
        <div
            style={styles.resizeHandle}
            onMouseDown={handleMouseDownResize}
            className={isDraggingHeight ? "resizing" : ""}
        >
          <div style={styles.resizeIndicator}>···</div>
        </div>

        <Card
            className="generic-equalizer col-10 mx-auto px-4 h-full pb-4"
            style={{
              ...styles.card,
              height: "inherit",
            }}
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
              <h5 className="ms-2">
                Equalizer Controls
                {isProcessing && <span style={styles.processingIndicator}>Processing...</span>}
              </h5>
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

              {/* Add Band Button - Now functional */}
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
                  onClick={addBand}
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

              {/* Reset All Button - Now functional */}
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
                  onClick={resetAllBands}
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
              className="equalizer-canvas px-3"
              style={{
                width: "100%",
                height: `calc(100% - 80px)`,
                position: "relative",
                overflow: "auto",
              }}
          >
            {/* Updated Subdivision with bands - Only render when bands are available */}
            {bands.length > 0 && (
                <Subdivision
                    bands={bands}
                    onBandChange={handleSliderChange}
                    onBandPositionChange={handleBandPositionChange}
                    onBandBandwidthChange={handleBandBandwidthChange}
                    onRemoveBand={removeBand}
                    bandsPosition="below" // New prop to control bands position
                    orientation="vertical" // Ensure vertical sliders
                />
            )}
            {!signalId && (
                <div style={styles.noSignalWarning}>
                  No audio signal loaded. Please upload an audio file first.
                </div>
            )}
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
    transition: "height 0.1s ease",
  },
  card: {
    boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.3)",
    marginBottom: "0",
    position: "relative",
    overflow: "auto",
    borderBottomLeftRadius: "0",
    borderBottomRightRadius: "0",
    width: "91.666%",
    height: "100%",
  },
  resizeHandle: {
    position: "absolute",
    top: "0",
    left: "0",
    right: "0",
    height: "12px",
    cursor: "ns-resize",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    transition: "background-color 0.2s",
    zIndex: 10,
  },
  resizeIndicator: {
    color: "#666",
    fontSize: "16px",
    fontWeight: "bold",
    userSelect: "none",
  },
  processingIndicator: {
    fontSize: "0.75rem",
    color: "#1FD5F9",
    marginLeft: "10px",
    fontStyle: "italic",
  },
  noSignalWarning: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    color: "#ef4444",
    textAlign: "center",
    fontSize: "0.9rem",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    padding: "10px 20px",
    borderRadius: "8px",
    border: "1px solid #ef4444",
  },
};

// Add CSS for better resize experience
const resizeStyles = `
  .resizing {
    background-color: rgba(123, 244, 71, 0.2) !important;
  }
  
  .resizing .resize-indicator {
    color: #7bf447;
  }
`;

// Inject styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = resizeStyles;
  document.head.appendChild(styleSheet);
}

export default GenericEqualizer;