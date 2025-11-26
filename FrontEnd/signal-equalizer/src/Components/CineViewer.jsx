import React, { useEffect, useRef, useState, useMemo } from "react";
import Card from "./Card";
import Button from "./Button";
import PanelControls from "./PanelControls";
import { drawWaveform } from "../utils/visualization";

const sanitizeNumericArray = (arr = []) =>
  Array.isArray(arr)
    ? arr.filter((value) => typeof value === "number" && Number.isFinite(value))
    : [];

const CineViewer = ({
                      inputTimeSeries = [],
                      outputTimeSeries = [],
                      sampleRate = 44100,
                      isVisible = true,
                      onClose,
                      onPlaybackUpdate,
                    }) => {
  const inputCanvasRef = useRef(null);
  const outputCanvasRef = useRef(null);
  const inputContainerRef = useRef(null);
  const outputContainerRef = useRef(null);
  const animationRef = useRef(null);
  const lastTimeRef = useRef(0);

  // Use refs for data that changes frequently to avoid re-renders
  const dataRef = useRef({
    currentTime: 0,
    isPlaying: false,
    playbackRate: 1.0,
    sanitizedInputSeries: [],
    sanitizedOutputSeries: [],
    safeSampleRate: 44100,
    visibleDuration: 1,
    duration: 1,
  });

  const [status, setStatus] = useState("Paused");
  const [hovered, setHovered] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1.0);

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

  // Calculate fixed amplitude range for both signals (symmetric around average)
  const amplitudeRange = useMemo(() => {
    const allInputValues = sanitizedInputSeries.length > 0 ? sanitizedInputSeries : [0];
    const allOutputValues = sanitizedOutputSeries.length > 0 ? sanitizedOutputSeries : [0];

    // Combine both signals to get overall range
    const allValues = [...allInputValues, ...allOutputValues];

    // Use a more efficient approach for large arrays
    let minVal = Infinity;
    let maxVal = -Infinity;

    for (let i = 0; i < allValues.length; i++) {
      const val = allValues[i];
      if (val < minVal) minVal = val;
      if (val > maxVal) maxVal = val;
    }

    // Handle case where all values are the same
    if (minVal === Infinity) {
      minVal = -1;
      maxVal = 1;
    } else if (minVal === maxVal) {
      minVal -= 1;
      maxVal += 1;
    }

    const average = (minVal + maxVal) / 2;

    // Create symmetric range around average
    const range = Math.max(Math.abs(maxVal - average), Math.abs(average - minVal));
    const symmetricMin = average - range;
    const symmetricMax = average + range;

    return {
      min: symmetricMin,
      max: symmetricMax,
      average: average,
      range: range * 2
    };
  }, [sanitizedInputSeries, sanitizedOutputSeries]);

  // Zoom limits
  const minZoom = 0.1;
  const maxZoom = 10.0;

  // Calculate visible time range based on zoom level and duration
  const visibleDuration = useMemo(() => {
    const baseVisibleDuration = Math.min(10, duration); // Show max 10 seconds by default
    return Math.min(duration, baseVisibleDuration / zoomLevel);
  }, [duration, zoomLevel]);

  // Calculate start time for the visible window - always start from 0 when not playing
  const visibleStartTime = useMemo(() => {
    if (!isPlaying) {
      return 0; // Always start from time 0 when not playing
    }

    // When playing, show current time at 20% from left for better visibility
    const targetStart = currentTime - visibleDuration * 0.2;
    return Math.max(0, Math.min(targetStart, duration - visibleDuration));
  }, [currentTime, duration, visibleDuration, isPlaying]);

  // Check zoom button disabled states
  const isZoomOutDisabled = zoomLevel <= minZoom;
  const isZoomInDisabled = zoomLevel >= maxZoom;

  // Animation loop for cine viewer
  useEffect(() => {
    dataRef.current = {
      currentTime,
      isPlaying,
      playbackRate,
      sanitizedInputSeries,
      sanitizedOutputSeries,
      safeSampleRate,
      visibleDuration,
      duration,
    };
  }, [isPlaying, playbackRate, duration, onPlaybackUpdate]);

  // Setup canvas function - moved outside of useCallback to avoid dependency issues
  const setupCanvas = (canvas, container, timeSeries, sampleRate, signalType) => {
    if (!canvas || !container) return;

    const computedStyle = getComputedStyle(container);
    const paddingX =
      parseFloat(computedStyle.paddingLeft) +
      parseFloat(computedStyle.paddingRight);
    const paddingY =
      parseFloat(computedStyle.paddingTop) +
      parseFloat(computedStyle.paddingBottom);

    const contentWidth = container.clientWidth - paddingX;
    const contentHeight = container.clientHeight - paddingY;

    canvas.width = contentWidth || 500;
    canvas.height = contentHeight || 200;
  }, []);

    // Draw waveform if we have data
    if (timeSeries.length > 0) {
      // Calculate which portion of the signal to display based on zoom and current time
      const startSample = Math.floor(visibleStartTime * sampleRate);
      const endSample = Math.floor((visibleStartTime + visibleDuration) * sampleRate);
      const visibleSamples = timeSeries.slice(
          Math.max(0, startSample),
          Math.min(timeSeries.length, endSample)
      );

      if (visibleSamples.length > 0) {
        // Draw the waveform using existing function
        drawWaveform(canvas1, visibleSamples, safeSampleRate, {
          startTime: visibleStartTime,
          visibleDuration: visibleDuration,
          fixedAmplitudeRange: amplitudeRange, // Use fixed amplitude range
          signalType: signalType
        });
      }
    }
  };

  // Setup input canvas
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
          safeSampleRate,
          "input"
      );

      // Calculate which portion of the signal to display
      const startSample = Math.floor(visibleStartTime * safeSampleRate);
      const endSample = Math.floor(visibleEndTime * safeSampleRate);
      const visibleSamples = sanitizedOutputSeries.slice(
        Math.max(0, startSample),
        Math.min(sanitizedOutputSeries.length, endSample)
      );

      if (visibleSamples.length > 0) {
        // Draw the waveform using existing function
        drawWaveform(canvas2, visibleSamples, safeSampleRate, {
          startTime: visibleStartTime,
          endTime: visibleEndTime,
          backgroundColor: "#242425ff",
        });
      }
    }
  }, [sanitizedInputSeries, safeSampleRate, visibleStartTime, visibleDuration, currentTime, amplitudeRange, isPlaying]);

  // Setup output canvas
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
          safeSampleRate,
          "output"
      );
    }
  }, [sanitizedOutputSeries, safeSampleRate, visibleStartTime, visibleDuration, currentTime, amplitudeRange, isPlaying]);

  // Control handlers
  const handlePlay = () => {
    if (duration === 0) return;

    // Only reset to beginning if we're already at the end
    if (currentTime >= duration) {
      setCurrentTime(0);
    }

    setIsPlaying(true);
    setStatus("Playing");

    if (onPlaybackUpdate) {
      onPlaybackUpdate(currentTime, true);
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    setStatus("Paused");

    if (onPlaybackUpdate) {
      onPlaybackUpdate(currentTime, false);
    }
  };

  const handleReset = () => {
    setPlaybackRate(1.0);
    setCurrentTime(0);
    setZoomLevel(1.0);
  };

  const handleSpeedChange = (newSpeed) => {
    const safeSpeed = Number.isFinite(newSpeed) ? newSpeed : 1;
    setPlaybackRate(safeSpeed);
  };

  const handleTimeChange = (newTime) => {
    const safeTime = Math.max(0, Math.min(duration, newTime));
    setCurrentTime(safeTime);

    if (onPlaybackUpdate) {
      onPlaybackUpdate(safeTime, isPlaying);
    }
  };

  const handleZoomChange = (newZoom) => {
    const clampedZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));
    setZoomLevel(clampedZoom);
  };

  const handleZoomIn = () => {
    if (!isZoomInDisabled) {
      const newZoom = Math.min(maxZoom, zoomLevel * 1.5);
      setZoomLevel(newZoom);
    }
  };

  const handleZoomOut = () => {
    if (!isZoomOutDisabled) {
      const newZoom = Math.max(minZoom, zoomLevel / 1.5);
      setZoomLevel(newZoom);
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
            <h4 className="panel-title m-0 h-6" style={{ fontSize: "13px" }}>
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
                {formatTime(currentTime)}
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
          <div className="panel-header d-flex justify-content-between align-items-center ps-4 pt-4 pb-2 col-9">
            <h4
              className="panel-title m-0 h-6 col-7"
              style={{ fontSize: "13px" }}
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
                {formatTime(currentTime)}
              </span>
            </div>
          </Card>
        </div>
        <Card className="cine-controls-panel mx-4 mb-4">
          <PanelControls
              type="cine"
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              playbackRate={playbackRate}
              zoomLevel={zoomLevel}
              onPlay={handlePlay}
              onStop={handleStop}
              onReset={handleReset}
              onSpeedChange={handleSpeedChange}
              onTimeChange={handleTimeChange}
              onZoomChange={handleZoomChange}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              isZoomInDisabled={isZoomInDisabled}
              isZoomOutDisabled={isZoomOutDisabled}
          />
        </Card>
      </div>
      <Card className="cine-controls-panel mx-4 mb-4">
        <PanelControls
          type="cine"
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          playbackRate={playbackRate}
          zoomLevel={zoomLevel}
          onPlay={handlePlay}
          onStop={handleStop}
          onReset={handleReset}
          onSpeedChange={handleSpeedChange}
          onTimeChange={handleTimeChange}
          onZoomChange={handleZoomChange}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          isZoomInDisabled={isZoomInDisabled}
          isZoomOutDisabled={isZoomOutDisabled}
        />
      </Card>
    </Card>
  );
};

export default CineViewer;
