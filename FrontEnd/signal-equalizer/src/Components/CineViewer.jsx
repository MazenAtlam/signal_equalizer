import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
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

  // Calculate visible time range based on zoom level and duration
  const visibleDuration = useMemo(() => {
    const baseVisibleDuration = Math.min(10, duration);
    return Math.min(duration, baseVisibleDuration / zoomLevel);
  }, [duration, zoomLevel]);

  // Update data ref when dependencies change
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
  }, [
    currentTime,
    isPlaying,
    playbackRate,
    sanitizedInputSeries,
    sanitizedOutputSeries,
    safeSampleRate,
    visibleDuration,
    duration,
  ]);

  // Zoom limits
  const minZoom = 0.1;
  const maxZoom = 10.0;

  // Check zoom button disabled states
  const isZoomOutDisabled = zoomLevel <= minZoom;
  const isZoomInDisabled = zoomLevel >= maxZoom;

  // Setup canvas dimensions
  const setupCanvas = useCallback((canvas, container) => {
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

  useEffect(() => {
    if (inputCanvasRef.current && inputContainerRef.current) {
      setupCanvas(inputCanvasRef.current, inputContainerRef.current);
    }
  }, [setupCanvas]);

  useEffect(() => {
    if (outputCanvasRef.current && outputContainerRef.current) {
      setupCanvas(outputCanvasRef.current, outputContainerRef.current);
    }
  }, [setupCanvas]);

  // ★ FIXED: Draw function without dependencies that cause re-renders
  const drawFrame = useCallback(() => {
    const canvas1 = inputCanvasRef.current;
    const canvas2 = outputCanvasRef.current;
    if (!canvas1 || !canvas2) return;

    const {
      currentTime,
      sanitizedInputSeries,
      sanitizedOutputSeries,
      safeSampleRate,
      visibleDuration,
      duration,
    } = dataRef.current;

    // Draw input signal
    if (sanitizedInputSeries.length > 0) {
      const ctx = canvas1.getContext("2d");
      if (!ctx) return;

      const width = canvas1.width;
      const height = canvas1.height;

      // Clear canvas
      ctx.fillStyle = "#2b2b2bff";
      ctx.fillRect(0, 0, width, height);

      // Calculate visible time window for scrolling effect
      const visibleStartTime = Math.max(0, currentTime - visibleDuration * 0.2);
      const visibleEndTime = Math.min(
        duration,
        visibleStartTime + visibleDuration
      );

      // Calculate which portion of the signal to display
      const startSample = Math.floor(visibleStartTime * safeSampleRate);
      const endSample = Math.floor(visibleEndTime * safeSampleRate);
      const visibleSamples = sanitizedInputSeries.slice(
        Math.max(0, startSample),
        Math.min(sanitizedInputSeries.length, endSample)
      );

      if (visibleSamples.length > 0) {
        // Draw the waveform using existing function
        drawWaveform(canvas1, visibleSamples, safeSampleRate, {
          startTime: visibleStartTime,
          endTime: visibleEndTime,
          backgroundColor: "#2b2b2bff",
        });
      }
    }

    // Draw output signal
    if (sanitizedOutputSeries.length > 0) {
      const ctx = canvas2.getContext("2d");
      if (!ctx) return;

      const width = canvas2.width;
      const height = canvas2.height;

      // Clear canvas
      ctx.fillStyle = "#242425ff";
      ctx.fillRect(0, 0, width, height);

      // Calculate visible time window for scrolling effect
      const visibleStartTime = Math.max(0, currentTime - visibleDuration * 0.2);
      const visibleEndTime = Math.min(
        duration,
        visibleStartTime + visibleDuration
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
  }, []); // ★ Empty dependencies - uses dataRef instead

  // ★ FIXED: Animation loop with proper dependency management
  useEffect(() => {
    let mounted = true;

    const animate = (currentTimeStamp) => {
      if (!mounted || !dataRef.current.isPlaying) return;

      // Calculate delta time for smooth playback
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = currentTimeStamp;
      }

      const deltaTime = (currentTimeStamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTimeStamp;

      // Update current time using the ref data
      const newTime =
        dataRef.current.currentTime + deltaTime * dataRef.current.playbackRate;

      // Stop when reaching the end
      if (newTime >= dataRef.current.duration) {
        setIsPlaying(false);
        setStatus("Paused");
        setCurrentTime(dataRef.current.duration);
        if (onPlaybackUpdate) {
          onPlaybackUpdate(dataRef.current.duration, false);
        }
        return;
      }

      // Update state and notify parent
      setCurrentTime(newTime);
      if (onPlaybackUpdate) {
        onPlaybackUpdate(newTime, true);
      }

      // Redraw the waveforms
      drawFrame();

      // Continue the animation loop
      if (mounted && dataRef.current.isPlaying) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    // Initial draw
    drawFrame();

    // Start animation if playing
    if (isPlaying) {
      lastTimeRef.current = 0;
      animationRef.current = requestAnimationFrame(animate);
    }

    // Cleanup
    return () => {
      mounted = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, onPlaybackUpdate, drawFrame]); // ★ Only depends on isPlaying and callbacks

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
