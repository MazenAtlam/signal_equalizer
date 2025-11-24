import React, { useEffect, useRef, useState, useMemo } from "react";
import Card from "./Card";
import Button from "./Button";
import PanelControls from "./PanelControls";
import { drawWaveform, drawPlaybackPosition } from "../utils/visualization";

const sanitizeNumericArray = (arr = []) =>
  Array.isArray(arr)
    ? arr.filter((value) => typeof value === "number" && Number.isFinite(value))
    : [];

const CineViewer = ({
  inputTimeSeries = [],
  outputTimeSeries = [],
  sampleRate = 44100,
  playbackPosition = 0,
  isPlaying = false,
  isVisible = true,
  onClose,
  onPlay, // Add these callback props
  onStop,
  onReset,
  onSpeedChange,
  onTimeChange,
}) => {
  const inputCanvasRef = useRef(null);
  const outputCanvasRef = useRef(null);
  const inputContainerRef = useRef(null);
  const outputContainerRef = useRef(null);
  const [status, setStatus] = useState("Paused");
  const [hovered, setHovered] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0); // Add local state for playback rate

  const sanitizedInputSeries = useMemo(
    () => sanitizeNumericArray(inputTimeSeries),
    [inputTimeSeries]
  );
  const sanitizedOutputSeries = useMemo(
    () => sanitizeNumericArray(outputTimeSeries),
    [outputTimeSeries]
  );
  const safeSampleRate = useMemo(
    () => (Number.isFinite(sampleRate) && sampleRate > 0 ? sampleRate : 44100),
    [sampleRate]
  );
  const safePlaybackPosition = Number.isFinite(playbackPosition)
    ? playbackPosition
    : 0;

  useEffect(() => {
    setStatus(isPlaying ? "Playing" : "Paused");
  }, [isPlaying]);

  // Calculate duration from the longer of input or output time series
  const duration = useMemo(() => {
    const inputDuration =
      sanitizedInputSeries.length > 0
        ? sanitizedInputSeries.length / safeSampleRate
        : 0;
    const outputDuration =
      sanitizedOutputSeries.length > 0
        ? sanitizedOutputSeries.length / safeSampleRate
        : 0;
    return Math.max(inputDuration, outputDuration);
  }, [sanitizedInputSeries, sanitizedOutputSeries, safeSampleRate]);

  const setupCanvas = (canvas, container, timeSeries, sampleRate) => {
    if (!canvas || !container) return;

    // Get the content dimensions (excluding padding)
    const computedStyle = getComputedStyle(container);
    const paddingX =
        parseFloat(computedStyle.paddingLeft) +
        parseFloat(computedStyle.paddingRight);
    const paddingY =
        parseFloat(computedStyle.paddingTop) +
        parseFloat(computedStyle.paddingBottom);

    const contentWidth = container.clientWidth - paddingX;
    const contentHeight = container.clientHeight - paddingY;

    // Set canvas dimensions to match content area
    canvas.width = contentWidth || 500;
    canvas.height = contentHeight || 200;

    // Draw waveform if we have data
    if (timeSeries.length > 0) {
      drawWaveform(canvas, timeSeries, sampleRate);

      // Draw playback position if playing
      if (isPlaying) {
        const signalDuration = timeSeries.length / sampleRate;
        if (signalDuration > 0) {
          const position = Math.min(
              1,
              Math.max(0, safePlaybackPosition / signalDuration)
          );
          drawPlaybackPosition(canvas, position);
        }
      }
    }
  };

  useEffect(() => {
    if (
        sanitizedInputSeries.length > 0 &&
        inputCanvasRef.current &&
        inputContainerRef.current
    ) {
      setupCanvas(
          inputCanvasRef.current,
          inputContainerRef.current,
          sanitizedInputSeries,
          safeSampleRate
      );
    }
  }, [
    setupCanvas,
    sanitizedInputSeries,
    safePlaybackPosition,
    isPlaying,
    safeSampleRate,
  ]);

  useEffect(() => {
    if (
        sanitizedOutputSeries.length > 0 &&
        outputCanvasRef.current &&
        outputContainerRef.current
    ) {
      setupCanvas(
          outputCanvasRef.current,
          outputContainerRef.current,
          sanitizedOutputSeries,
          safeSampleRate
      );
    }
  }, [
    setupCanvas,
    sanitizedOutputSeries,
    safePlaybackPosition,
    isPlaying,
    safeSampleRate,
  ]);

  // Handle speed change locally if not provided via props
  const handleSpeedChange = (newSpeed) => {
    const safeSpeed = Number.isFinite(newSpeed) ? newSpeed : 1;
    if (onSpeedChange) {
      onSpeedChange(safeSpeed);
    } else {
      setPlaybackRate(safeSpeed);
    }
  };

  // Handle time change locally if not provided via props
  const handleTimeChange = (newTime) => {
    const safeTime = Number.isFinite(newTime) ? newTime : 0;
    if (onTimeChange) {
      onTimeChange(safeTime);
    }
    console.log("Time change requested:", safeTime);
  };

  // Default handlers if not provided
  const handlePlay = () => {
    if (onPlay) {
      onPlay();
    } else {
      console.log("Play requested");
    }
  };

  const handleStop = () => {
    if (onStop) {
      onStop();
    } else {
      console.log("Stop requested");
    }
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
    } else {
      console.log("Reset requested");
    }
  };

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) {
      return "0:00.00";
    }
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return `${mins}:${secs.padStart(5, "0")}`;
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Card className="cine-viewer col-10 mx-auto">
      <div className="cine-viewer-header d-flex justify-content-between pt-3 pe-4">
        <div className="cine-viewer-title d-flex px-4 pt-2">
          <svg
            className="cine-icon"
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
          <h5 className="ms-2">Linked Viewers</h5>
        </div>
        <Button
          variant="secondary"
          className="close-btn border-0"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={() => onClose && onClose()}
          style={
            hovered
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
      <div className="cine-grid px-4 d-flex gap-3 my-4">
        <Card className="cine-panel col-6">
          <div className="panel-header d-flex justify-content-between align-items-center ps-4 pt-4 pb-2 col-9">
            <h4
              className="panel-title m-0 h-6 "
              style={{
                fontSize: "13px",
              }}
            >
              Input Signal
            </h4>
            <div className="status-indicator d-flex align-items-center gap-2">
              <div
                className="status-dot mx-1"
                style={{
                  backgroundColor: isPlaying ? "#7bf447ff" : "#979595ff",
                }}
              ></div>
              <span
                className="time-display d-flex gap-1"
                style={{
                  color: "#b8b6b6a2",
                  fontSize: "13px",
                }}
              >
                <span>{status}</span> <span>Time:</span>{" "}
                {formatTime(safePlaybackPosition)}
              </span>
            </div>
          </div>
          <div
            ref={inputContainerRef}
            className="cine-content"
            style={{
              width: "100%",
              height: "300px",
              position: "relative",
              padding: "12px",
            }}
          >
            <canvas
              ref={inputCanvasRef}
              className="cine-canvas"
              style={{
                width: "100%",
                height: "100%",
                display: "block",
                borderRadius: "4px",
                backgroundColor: "#2b2b2bff",
              }}
            ></canvas>
          </div>
        </Card>
        <Card className="cine-panel col-6">
          <div className="panel-header d-flex  justify-content-between align-items-center ps-4 pt-4 pb-2 col-9">
            <h4
              className="panel-title m-0 h-6 col-7"
              style={{
                fontSize: "13px",
              }}
            >
              Output Signal
            </h4>
            <div className="status-indicator d-flex align-items-center gap-2">
              <div
                className="status-dot mx-1"
                style={{
                  backgroundColor: isPlaying ? "#7bf447ff" : "#979595ff",
                }}
              ></div>
              <span
                className="time-display d-flex gap-1"
                style={{
                  color: "#b8b6b6a2",
                  fontSize: "13px",
                }}
              >
                <span>{status}</span> <span>Time:</span>{" "}
                {formatTime(safePlaybackPosition)}
              </span>
            </div>
          </div>
          <div
            ref={outputContainerRef}
            className="cine-content"
            style={{
              width: "100%",
              height: "300px",
              position: "relative",
              padding: "12px",
            }}
          >
            <canvas
              ref={outputCanvasRef}
              className="cine-canvas"
              style={{
                width: "100%",
                height: "100%",
                display: "block",
                borderRadius: "4px",
                backgroundColor: "#242425ff",
              }}
            ></canvas>
          </div>
        </Card>
      </div>
      <Card className="cine-controls-panel mx-4 mb-4">
        <PanelControls
          type="cine"
          isPlaying={isPlaying}
          currentTime={playbackPosition}
          duration={duration}
          playbackRate={playbackRate}
          onPlay={handlePlay}
          onStop={handleStop}
          onReset={handleReset}
          onSpeedChange={handleSpeedChange}
          onTimeChange={handleTimeChange}
        />
      </Card>
    </Card>
  );
};

export default CineViewer;
