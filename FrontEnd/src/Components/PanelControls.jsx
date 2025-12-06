import React, { useState, useRef, useEffect } from "react";
import Button from "./Button";

const PanelControls = ({
                           type = "audio",
                           isPlaying = false,
                           currentTime = 0,
                           duration = 0,
                           playbackRate = 1.0,
                           zoomLevel = 1.0,
                           onPlay,
                           onStop,
                           onReset,
                           onSpeedChange,
                           onTimeChange,
                           onZoomChange,
                           onZoomIn,        // Add this
                           onZoomOut,       // Add this
                           isZoomInDisabled = false,  // Add this
                           isZoomOutDisabled = false, // Add this
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isSpeedDragging, setIsSpeedDragging] = useState(false);
  const [isZoomDragging, setIsZoomDragging] = useState(false);
  const progressRef = useRef(null);
  const speedRef = useRef(null);
  const zoomRef = useRef(null);

  const [resetHovered, setResetHovered] = useState(false);
  const [stopHovered, setStopHovered] = useState(false);
  const [playHovered, setPlayHovered] = useState(false);

  const formatTime = (seconds) => {
    if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Progress calculations for audio controls
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const progressRight = Math.max(0, 100 - progress);

  // Speed control: 0.25x to 2.0x, snap to predefined stops
  const speedSteps = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  const speedMin = speedSteps[0];
  const speedMax = 2.0;
  const speedRange = speedMax - speedMin;
  const snapSpeed = (value) => {
    const clamped = Math.min(speedMax, Math.max(speedMin, value));
    return speedSteps.reduce((closest, step) =>
      Math.abs(step - clamped) < Math.abs(closest - clamped) ? step : closest
    );
  };
  const normalizedPlaybackRate = snapSpeed(playbackRate);
  const speedProgress =
    ((normalizedPlaybackRate - speedMin) / speedRange) * 100;
  const speedProgressRight = Math.max(0, 100 - speedProgress);

  // Zoom control: 0.1x to 10x
  const zoomMin = 0.1;
  const zoomMax = 10;
  const zoomRange = zoomMax - zoomMin;
  const normalizedZoomLevel = Math.min(zoomMax, Math.max(zoomMin, zoomLevel));
  const zoomProgress = ((normalizedZoomLevel - zoomMin) / zoomRange) * 100;
  const zoomProgressRight = Math.max(0, 100 - zoomProgress);

  const handleProgressClick = (e) => {
    if (!progressRef.current || !onTimeChange || duration === 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * duration;
    onTimeChange(newTime);
  };

  const handleProgressDrag = (e) => {
    if (!isDragging || !progressRef.current || !onTimeChange || duration === 0)
      return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * duration;
    onTimeChange(newTime);
  };

  const handleSpeedClick = (e) => {
    if (!speedRef.current || !onSpeedChange) return;
    const rect = speedRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newSpeed = snapSpeed(speedMin + percentage * speedRange);
    onSpeedChange(newSpeed);
  };

  const handleSpeedDrag = (e) => {
    if (!isSpeedDragging || !speedRef.current || !onSpeedChange) return;
    const rect = speedRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newSpeed = snapSpeed(speedMin + percentage * speedRange);
    onSpeedChange(newSpeed);
  };

  const handleZoomClick = (e) => {
    if (!zoomRef.current || !onZoomChange) return;
    const rect = zoomRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newZoom = zoomMin + percentage * zoomRange;
    onZoomChange(newZoom);
  };

  const handleZoomDrag = (e) => {
    if (!isZoomDragging || !zoomRef.current || !onZoomChange) return;
    const rect = zoomRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newZoom = zoomMin + percentage * zoomRange;
    onZoomChange(newZoom);
  };

  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
      setIsSpeedDragging(false);
      setIsZoomDragging(false);
    };

    const handleMouseMove = (e) => {
      if (isDragging) {
        handleProgressDrag(e);
      }
      if (isSpeedDragging) {
        handleSpeedDrag(e);
      }
      if (isZoomDragging) {
        handleZoomDrag(e);
      }
    };

    if (isDragging || isSpeedDragging || isZoomDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isSpeedDragging, isZoomDragging]);

  if (type === "audio") {
    return (
      <div className="audio-controls" style={{ padding: "1rem" }}>
        {/* Progress bar row - current time, slider, and duration on same line */}
        <div
          className="progress-bar"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "10px",
            marginBottom: "1rem",
          }}
        >
          <span
            className="time-start"
            style={{ minWidth: "50px", textAlign: "left" }}
          >
            {formatTime(currentTime)}
          </span>
          <div
            ref={progressRef}
            className="slider-container"
            style={{
              flex: 1,
              width: "125px",
              position: "relative",
              height: "20px",
              cursor: "pointer",
            }}
            onClick={handleProgressClick}
            onMouseDown={(e) => {
              setIsDragging(true);
              handleProgressClick(e);
            }}
          >
            <div
              className="slider-track"
              style={{
                position: "absolute",
                top: "50%",
                left: 0,
                right: 0,
                height: "6px",
                transform: "translateY(-50%)",
                borderRadius: "5px",
              }}
            >
              <div
                className="slider-progress"
                style={{
                  position: "absolute",
                  top: 0,
                  right: `${progressRight}%`,
                  left: 0,
                  height: "100%",
                  backgroundColor: "#1FD5F9",
                  borderRadius: "5px",
                }}
              ></div>
            </div>
            <div
              className="slider-thumb"
              style={{
                position: "absolute",
                top: "50%",
                left: `${progress}%`,
                width: "15px",
                height: "15px",
                backgroundColor: "#080808ff",
                borderRadius: "50%",
                transform: "translate(-50%, -50%)",
                cursor: "grab",
              }}
            ></div>
          </div>
          <span
            className="time-end"
            style={{ minWidth: "50px", textAlign: "right" }}
          >
            {formatTime(duration)}
          </span>
        </div>

        {/* Controls row - all controls on same line below progress bar */}
        <div
          className="controls-row"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          {/* Play/Pause, Stop, Reset buttons */}
          <div
            className="playback-controls"
            style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
          >
            <Button
              variant="secondary"
              className="play-btn py-2"
              onClick={onPlay}
              onMouseEnter={() => setPlayHovered(true)}
              onMouseLeave={() => setPlayHovered(false)}
              style={
                playHovered
                  ? {
                      backgroundColor: "#7bf447ff",
                      borderRadius: "4px",
                      color: "#000000 !important",
                      border: "none",
                      padding: "4px 4px",
                      fontWeight: "bold",
                    }
                  : {
                      backgroundColor: "#1FD5F9",
                      borderRadius: "4px",
                      border: "none",
                      padding: "4px 4px",
                      color: "#FFF !important",
                    }
              }
            >
              {isPlaying ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#000000"
                  width="20"
                  height="20"
                >
                  <rect x="6" y="4" width="4" height="16"></rect>
                  <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  width="16"
                  height="16"
                >
                  <polygon points="6 3 20 12 6 21 6 3"></polygon>
                </svg>
              )}
            </Button>
            <Button
              variant="secondary"
              className="stop-btn py-2"
              onClick={onStop}
              onMouseEnter={() => setStopHovered(true)}
              onMouseLeave={() => setStopHovered(false)}
              style={
                stopHovered
                  ? {
                      backgroundColor: "#7bf447ff",
                      borderRadius: "4px",
                      color: "#000000 !important",
                      border: "none",
                      padding: "4px 4px",
                    }
                  : {
                      backgroundColor: "transparent",
                      borderRadius: "4px",
                      border: "none",
                      padding: "4px 4px",
                      color: "#FFF",
                    }
              }
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke={stopHovered ? "#000000" : "currentColor"}
                width="16"
                height="16"
              >
                <rect width="18" height="18" x="3" y="3" rx="2"></rect>
              </svg>
            </Button>
            <Button
              variant="secondary"
              className="reset-btn py-2"
              onClick={onReset}
              onMouseEnter={() => setResetHovered(true)}
              onMouseLeave={() => setResetHovered(false)}
              style={
                resetHovered
                  ? {
                      backgroundColor: "#7bf447ff",
                      borderRadius: "4px",
                      color: "#000000 !important",
                      border: "none",
                      padding: "4px 4px",
                    }
                  : {
                      backgroundColor: "transparent",
                      borderRadius: "4px",
                      border: "none",
                      padding: "4px 4px",
                      color: "#FFF",
                    }
              }
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke={resetHovered ? "#000000" : "currentColor"}
                width="16"
                height="16"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                <path d="M3 3v5h5"></path>
              </svg>
            </Button>
          </div>

          {/* Speed control */}
          <div
            className="speed-control"
            style={{ display: "flex", alignItems: "center", gap: "10px" }}
          >
            <span style={{ fontSize: "0.875rem", whiteSpace: "nowrap" }}>
              Speed:
            </span>
            <div
              ref={speedRef}
              className="slider-container"
              style={{
                width: "125px",
                position: "relative",
                height: "20px",
                cursor: "pointer",
              }}
              onClick={handleSpeedClick}
              onMouseDown={(e) => {
                setIsSpeedDragging(true);
                handleSpeedClick(e);
              }}
            >
              <div
                className="slider-track"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: 0,
                  right: 0,
                  height: "6px",
                  backgroundColor: "#333",
                  transform: "translateY(-50%)",
                  borderRadius: "5px",
                }}
              >
                <div
                  className="slider-progress"
                  style={{
                    position: "absolute",
                    top: 0,
                    right: `${speedProgressRight}%`,
                    left: 0,
                    height: "100%",
                    backgroundColor: "#1FD5F9",
                    borderRadius: "2px",
                  }}
                ></div>
              </div>
              <div
                className="slider-thumb"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: `${speedProgress}%`,
                  width: "15px",
                  height: "15px",
                  backgroundColor: "#080808ff",
                  borderRadius: "50%",
                  transform: "translate(-50%, -50%)",
                  cursor: "grab",
                }}
              ></div>
            </div>
            <span
              className="speed-value"
              style={{
                minWidth: "45px",
                fontSize: "0.875rem",
                whiteSpace: "nowrap",
              }}
            >
              x{playbackRate.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Cine controls - with zoom instead of progress bar
  return (
    <div className="cine-controls" style={{ padding: "1rem" }}>
        {/* Zoom controls row */}
        <div
            className="zoom-controls"
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "10px",
                marginBottom: "1rem",
            }}
        >
        <span
            className="zoom-label"
            style={{ minWidth: "50px", textAlign: "left", fontSize: "0.875rem" }}
        >
          Zoom:
        </span>
            <div
                className="zoom-control-group"
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    flex: 1,
                }}
            >
                <Button
                    variant="secondary"
                    className="zoom-out-btn"
                    onClick={onZoomOut}
                    disabled={isZoomOutDisabled}
                    style={{
                        backgroundColor: isZoomOutDisabled ? "#333" : "transparent",
                        border: `1px solid ${isZoomOutDisabled ? "#666" : "#666"}`,
                        borderRadius: "4px",
                        padding: "4px 8px",
                        color: isZoomOutDisabled ? "#888" : "#FFF",
                        fontSize: "0.875rem",
                        cursor: isZoomOutDisabled ? "not-allowed" : "pointer",
                        opacity: isZoomOutDisabled ? 0.5 : 1,
                    }}
                >
                    -
                </Button>
                <div
                    ref={zoomRef}
                    className="slider-container"
                    style={{
                        flex: 1,
                        position: "relative",
                        height: "20px",
                        cursor: "pointer",
                    }}
                    onClick={handleZoomClick}
                    onMouseDown={(e) => {
                        setIsZoomDragging(true);
                        handleZoomClick(e);
                    }}
                >
                    <div
                        className="slider-track"
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: 0,
                            right: 0,
                            height: "6px",
                            backgroundColor: "#333",
                            transform: "translateY(-50%)",
                            borderRadius: "5px",
                        }}
                    >
                        <div
                            className="slider-progress"
                            style={{
                                position: "absolute",
                                top: 0,
                                right: `${zoomProgressRight}%`,
                                left: 0,
                                height: "100%",
                                backgroundColor: "#1FD5F9",
                                borderRadius: "2px",
                            }}
                        ></div>
                    </div>
                    <div
                        className="slider-thumb"
                        style={{
                            position: "absolute",
                            top: "50%",
                            left: `${zoomProgress}%`,
                            width: "15px",
                            height: "15px",
                            backgroundColor: "#080808ff",
                            borderRadius: "50%",
                            transform: "translate(-50%, -50%)",
                            cursor: "grab",
                        }}
                    ></div>
                </div>
                <Button
                    variant="secondary"
                    className="zoom-in-btn"
                    onClick={onZoomIn}
                    disabled={isZoomInDisabled}
                    style={{
                        backgroundColor: isZoomInDisabled ? "#333" : "transparent",
                        border: `1px solid ${isZoomInDisabled ? "#666" : "#666"}`,
                        borderRadius: "4px",
                        padding: "4px 8px",
                        color: isZoomInDisabled ? "#888" : "#FFF",
                        fontSize: "0.875rem",
                        cursor: isZoomInDisabled ? "not-allowed" : "pointer",
                        opacity: isZoomInDisabled ? 0.5 : 1,
                    }}
                >
                    +
                </Button>
            </div>
            <span
                className="zoom-value"
                style={{ minWidth: "50px", textAlign: "right", fontSize: "0.875rem" }}
            >
          {zoomLevel.toFixed(1)}x
        </span>
        </div>

      {/* Controls row */}
      <div
        className="controls-row"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        {/* Play/Pause, Stop, Reset buttons */}
        <div
          className="playback-controls"
          style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
        >
          <Button
            variant="secondary"
            className="play-btn py-2"
            onClick={onPlay}
            onMouseEnter={() => setPlayHovered(true)}
            onMouseLeave={() => setPlayHovered(false)}
            style={
              playHovered
                ? {
                    backgroundColor: "#7bf447ff",
                    borderRadius: "4px",
                    color: "#000000 !important",
                    border: "none",
                    padding: "4px 4px",
                    fontWeight: "bold",
                  }
                : {
                    backgroundColor: "#1FD5F9",
                    borderRadius: "4px",
                    border: "none",
                    padding: "4px 4px",
                    color: "#FFF !important",
                  }
            }
          >
            {isPlaying ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="#000000"
                width="20"
                height="20"
              >
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                width="16"
                height="16"
              >
                <polygon points="6 3 20 12 6 21 6 3"></polygon>
              </svg>
            )}
          </Button>
          <Button
            variant="secondary"
            className="stop-btn py-2"
            onClick={onStop}
            onMouseEnter={() => setStopHovered(true)}
            onMouseLeave={() => setStopHovered(false)}
            style={
              stopHovered
                ? {
                    backgroundColor: "#7bf447ff",
                    borderRadius: "4px",
                    color: "#000000 !important",
                    border: "none",
                    padding: "4px 4px",
                  }
                : {
                    backgroundColor: "transparent",
                    borderRadius: "4px",
                    border: "none",
                    padding: "4px 4px",
                    color: "#FFF",
                  }
            }
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke={stopHovered ? "#000000" : "currentColor"}
              width="16"
              height="16"
            >
              <rect width="18" height="18" x="3" y="3" rx="2"></rect>
            </svg>
          </Button>
          <Button
            variant="secondary"
            className="reset-btn py-2"
            onClick={onReset}
            onMouseEnter={() => setResetHovered(true)}
            onMouseLeave={() => setResetHovered(false)}
            style={
              resetHovered
                ? {
                    backgroundColor: "#7bf447ff",
                    borderRadius: "4px",
                    color: "#000000 !important",
                    border: "none",
                    padding: "4px 4px",
                  }
                : {
                    backgroundColor: "transparent",
                    borderRadius: "4px",
                    border: "none",
                    padding: "4px 4px",
                    color: "#FFF",
                  }
            }
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke={resetHovered ? "#000000" : "currentColor"}
              width="16"
              height="16"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
              <path d="M3 3v5h5"></path>
            </svg>
          </Button>
        </div>

        {/* Speed control */}
        <div
          className="speed-control"
          style={{ display: "flex", alignItems: "center", gap: "10px" }}
        >
          <span style={{ fontSize: "0.875rem", whiteSpace: "nowrap" }}>
            Speed:
          </span>
          <div
            ref={speedRef}
            className="slider-container"
            style={{
              width: "125px",
              position: "relative",
              height: "20px",
              cursor: "pointer",
            }}
            onClick={handleSpeedClick}
            onMouseDown={(e) => {
              setIsSpeedDragging(true);
              handleSpeedClick(e);
            }}
          >
            <div
              className="slider-track"
              style={{
                position: "absolute",
                top: "50%",
                left: 0,
                right: 0,
                height: "6px",
                backgroundColor: "#333",
                transform: "translateY(-50%)",
                borderRadius: "5px",
              }}
            >
              <div
                className="slider-progress"
                style={{
                  position: "absolute",
                  top: 0,
                  right: `${speedProgressRight}%`,
                  left: 0,
                  height: "100%",
                  backgroundColor: "#1FD5F9",
                  borderRadius: "2px",
                }}
              ></div>
            </div>
            <div
              className="slider-thumb"
              style={{
                position: "absolute",
                top: "50%",
                left: `${speedProgress}%`,
                width: "15px",
                height: "15px",
                backgroundColor: "#080808ff",
                borderRadius: "50%",
                transform: "translate(-50%, -50%)",
                cursor: "grab",
              }}
            ></div>
          </div>
          <span
            className="speed-value"
            style={{
              minWidth: "45px",
              fontSize: "0.875rem",
              whiteSpace: "nowrap",
            }}
          >
            x{playbackRate.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PanelControls;
