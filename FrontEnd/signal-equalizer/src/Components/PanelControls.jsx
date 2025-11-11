import React, { useState, useRef, useEffect } from "react";
import Button from "./Button";

const PanelControls = ({
  type = "audio",
  isPlaying = false,
  currentTime = 0,
  duration = 0,
  playbackRate = 1.0,
  onPlay,
  onStop,
  onReset,
  onSpeedChange,
  onTimeChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isSpeedDragging, setIsSpeedDragging] = useState(false);
  const progressRef = useRef(null);
  const speedRef = useRef(null);

  const [resetHovered, setResetHovered] = useState(false);
  const [stopHovered, setStopHovered] = useState(false);
  const [playHovered, setPlayHovered] = useState(false);

  const formatTime = (seconds) => {
    if (!isFinite(seconds) || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const progressRight = Math.max(0, 100 - progress);

  // Speed control: 0.5x to 2.0x
  const speedMin = 0.5;
  const speedMax = 2.0;
  const speedRange = speedMax - speedMin;
  const speedProgress = ((playbackRate - speedMin) / speedRange) * 100;
  const speedProgressRight = Math.max(0, 100 - speedProgress);

  const handleProgressClick = (e) => {
    if (!progressRef.current || !onTimeChange || duration === 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * duration;
    onTimeChange(newTime);
  };

  const handleProgressDrag = (e) => {
    if (!isDragging || !progressRef.current || !onTimeChange || duration === 0) return;
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
    const newSpeed = speedMin + percentage * speedRange;
    onSpeedChange(newSpeed);
  };

  const handleSpeedDrag = (e) => {
    if (!isSpeedDragging || !speedRef.current || !onSpeedChange) return;
    const rect = speedRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newSpeed = speedMin + percentage * speedRange;
    onSpeedChange(newSpeed);
  };

  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
      setIsSpeedDragging(false);
    };

    const handleMouseMove = (e) => {
      if (isDragging) {
        handleProgressDrag(e);
      }
      if (isSpeedDragging) {
        handleSpeedDrag(e);
      }
    };

    if (isDragging || isSpeedDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, isSpeedDragging]);

  if (type === "audio") {
    return (
      <div className="audio-controls" style={{ padding: "1rem" }}>
        {/* Progress bar row - current time, slider, and duration on same line */}
        <div className="progress-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
          <span className="time-start" style={{ minWidth: "50px", textAlign: "left" }}>
            {formatTime(currentTime)}
          </span>
          <div
            ref={progressRef}
            className="slider-container"
            style={{
              flex: 1,
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
                height: "4px",
                backgroundColor: "#333",
                transform: "translateY(-50%)",
                borderRadius: "2px",
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
                  borderRadius: "2px",
                }}
              ></div>
            </div>
            <div
              className="slider-thumb"
              style={{
                position: "absolute",
                top: "50%",
                left: `${progress}%`,
                width: "12px",
                height: "12px",
                backgroundColor: "#1FD5F9",
                borderRadius: "50%",
                transform: "translate(-50%, -50%)",
                cursor: "grab",
              }}
            ></div>
          </div>
          <span className="time-end" style={{ minWidth: "50px", textAlign: "right" }}>
            {formatTime(duration)}
          </span>
        </div>

        {/* Controls row - all controls on same line below progress bar */}
        <div className="controls-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
          {/* Play/Pause, Stop, Reset buttons */}
          <div className="playback-controls" style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <Button
              variant="secondary"
              className="play-btn"
              onClick={onPlay}
              onMouseEnter={() => setPlayHovered(true)}
              onMouseLeave={() => setPlayHovered(false)}
              style={
                playHovered
                  ? {
                      backgroundColor: "#7bf447ff",
                      borderRadius: "4px",
                      color: "#000000 !important",
                    }
                  : { backgroundColor: "transparent", borderRadius: "4px" }
              }
            >
              {isPlaying ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
                  <rect x="6" y="4" width="4" height="16"></rect>
                  <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
                  <polygon points="6 3 20 12 6 21 6 3"></polygon>
                </svg>
              )}
            </Button>
            <Button
              variant="secondary"
              className="stop-btn"
              onClick={onStop}
              onMouseEnter={() => setStopHovered(true)}
              onMouseLeave={() => setStopHovered(false)}
              style={
                stopHovered
                  ? {
                      backgroundColor: "#7bf447ff",
                      borderRadius: "4px",
                      color: "#000000 !important",
                    }
                  : { backgroundColor: "transparent", borderRadius: "4px" }
              }
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
                <rect width="18" height="18" x="3" y="3" rx="2"></rect>
              </svg>
            </Button>
            <Button
              variant="secondary"
              className="reset-btn"
              onClick={onReset}
              onMouseEnter={() => setResetHovered(true)}
              onMouseLeave={() => setResetHovered(false)}
              style={
                resetHovered
                  ? {
                      backgroundColor: "#7bf447ff",
                      borderRadius: "4px",
                      color: "#000000 !important",
                    }
                  : { backgroundColor: "transparent", borderRadius: "4px" }
              }
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                <path d="M3 3v5h5"></path>
              </svg>
            </Button>
          </div>

          {/* Speed control */}
          <div className="speed-control" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "0.875rem", whiteSpace: "nowrap" }}>Speed:</span>
            <div
              ref={speedRef}
              className="slider-container"
              style={{
                width: "100px",
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
                  height: "4px",
                  backgroundColor: "#333",
                  transform: "translateY(-50%)",
                  borderRadius: "2px",
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
                  width: "12px",
                  height: "12px",
                  backgroundColor: "#1FD5F9",
                  borderRadius: "50%",
                  transform: "translate(-50%, -50%)",
                  cursor: "grab",
                }}
              ></div>
            </div>
            <span className="speed-value" style={{ minWidth: "45px", fontSize: "0.875rem", whiteSpace: "nowrap" }}>
              x{playbackRate.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cine-controls" style={{ padding: "1rem", display: "flex", gap: "1rem", alignItems: "center" }}>
      <div className="playback-controls" style={{ display: "flex", gap: "0.5rem" }}>
        <Button
          variant="primary"
          className="play-btn"
          onClick={onPlay}
          style={{
            padding: "0.5rem",
            minWidth: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
              <rect x="6" y="4" width="4" height="16"></rect>
              <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
              <polygon points="6 3 20 12 6 21 6 3"></polygon>
            </svg>
          )}
        </Button>
        <Button
          variant="default"
          className="stop-btn"
          onClick={onStop}
          style={{
            padding: "0.5rem",
            minWidth: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
            <rect width="18" height="18" x="3" y="3" rx="2"></rect>
          </svg>
        </Button>
      </div>
      <div className="speed-control" style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: "200px" }}>
        <span style={{ fontSize: "0.875rem" }}>Speed:</span>
        <div
          ref={speedRef}
          className="slider-container"
          style={{
            flex: 1,
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
              height: "4px",
              backgroundColor: "#333",
              transform: "translateY(-50%)",
              borderRadius: "2px",
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
              width: "12px",
              height: "12px",
              backgroundColor: "#1FD5F9",
              borderRadius: "50%",
              transform: "translate(-50%, -50%)",
              cursor: "grab",
            }}
          ></div>
        </div>
        <span className="speed-value" style={{ minWidth: "50px", fontSize: "0.875rem" }}>
          {playbackRate.toFixed(2)}x
        </span>
      </div>
      <div className="zoom-control" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Button variant="default" className="zoom-out" style={{ padding: "0.5rem", minWidth: "40px" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" x2="16.65" y1="21" y2="16.65"></line>
            <line x1="8" x2="14" y1="11" y2="11"></line>
          </svg>
        </Button>
        <div className="slider-container small" style={{ width: "100px", position: "relative", height: "20px" }}>
          <div
            className="slider-track"
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              right: 0,
              height: "4px",
              backgroundColor: "#333",
              transform: "translateY(-50%)",
              borderRadius: "2px",
            }}
          >
            <div className="slider-progress" style={{ right: "80%", position: "absolute", top: 0, left: 0, height: "100%", backgroundColor: "#1FD5F9", borderRadius: "2px" }}></div>
          </div>
          <div className="slider-thumb" style={{ left: "20%", position: "absolute", top: "50%", width: "12px", height: "12px", backgroundColor: "#1FD5F9", borderRadius: "50%", transform: "translate(-50%, -50%)" }}></div>
        </div>
        <Button variant="default" className="zoom-in" style={{ padding: "0.5rem", minWidth: "40px" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" x2="16.65" y1="21" y2="16.65"></line>
            <line x1="11" x2="11" y1="8" y2="14"></line>
            <line x1="8" x2="14" y1="11" y2="11"></line>
          </svg>
        </Button>
        <span className="zoom-value" style={{ fontSize: "0.875rem" }}>1.00x</span>
      </div>
      <Button
        variant="default"
        className="reset-btn"
        onClick={onReset}
        style={{ padding: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
          <path d="M3 3v5h5"></path>
        </svg>
        Reset
      </Button>
    </div>
  );
};

export default PanelControls;
