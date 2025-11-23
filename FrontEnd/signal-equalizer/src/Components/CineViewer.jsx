import React, { useEffect, useRef, useState } from "react";
import Card from "./Card";
import Button from "./Button";
import PanelControls from "./PanelControls";
import { drawWaveform, drawPlaybackPosition } from "../utils/visualization";

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

  if (!isVisible) {
    return null;
  }

  useEffect(() => {
    setStatus(isPlaying ? "Playing" : "Paused");
  }, [isPlaying]);

  // Calculate duration from the longer of input or output time series
  const getDuration = () => {
    const inputDuration =
      inputTimeSeries.length > 0 ? inputTimeSeries.length / sampleRate : 0;
    const outputDuration =
      outputTimeSeries.length > 0 ? outputTimeSeries.length / sampleRate : 0;
    return Math.max(inputDuration, outputDuration);
  };

  const duration = getDuration();

  const setupCanvas = (canvas, container, timeSeries) => {
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
      drawWaveform(canvas, timeSeries);

      // Draw playback position if playing
      if (isPlaying) {
        const signalDuration = timeSeries.length / sampleRate;
        if (signalDuration > 0) {
          const position = Math.min(
            1,
            Math.max(0, playbackPosition / signalDuration)
          );
          drawPlaybackPosition(canvas, position);
        }
      }
    }
  };

  useEffect(() => {
    if (
      inputTimeSeries.length > 0 &&
      inputCanvasRef.current &&
      inputContainerRef.current
    ) {
      setupCanvas(
        inputCanvasRef.current,
        inputContainerRef.current,
        inputTimeSeries
      );
    }
  }, [inputTimeSeries, playbackPosition, isPlaying, sampleRate]);

  useEffect(() => {
    if (
      outputTimeSeries.length > 0 &&
      outputCanvasRef.current &&
      outputContainerRef.current
    ) {
      setupCanvas(
        outputCanvasRef.current,
        outputContainerRef.current,
        outputTimeSeries
      );
    }
  }, [outputTimeSeries, playbackPosition, isPlaying, sampleRate]);

  // Handle speed change locally if not provided via props
  const handleSpeedChange = (newSpeed) => {
    if (onSpeedChange) {
      onSpeedChange(newSpeed);
    } else {
      setPlaybackRate(newSpeed);
    }
  };

  // Handle time change locally if not provided via props
  const handleTimeChange = (newTime) => {
    if (onTimeChange) {
      onTimeChange(newTime);
    }
    // If no onTimeChange prop provided, you might need to manage time state locally
    console.log("Time change requested:", newTime);
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
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return `${mins}:${secs.padStart(5, "0")}`;
  };

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
                {formatTime(playbackPosition)}
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
                {formatTime(playbackPosition)}
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
