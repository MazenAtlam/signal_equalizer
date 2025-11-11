import React, { useEffect, useRef, useState } from "react";
import Card from "./Card";
import Button from "./Button";
import PanelControls from "./PanelControls";
import { drawWaveform, drawPlaybackPosition } from "../utils/visualization";

const CineViewer = ({ inputTimeSeries = [], outputTimeSeries = [], sampleRate = 44100, playbackPosition = 0, isPlaying = false, isVisible = true, onClose }) => {
  const inputCanvasRef = useRef(null);
  const outputCanvasRef = useRef(null);
  const [status, setStatus] = useState("Paused");

  if (!isVisible) {
    return null;
  }

  useEffect(() => {
    setStatus(isPlaying ? "Playing" : "Paused");
  }, [isPlaying]);

  useEffect(() => {
    if (inputTimeSeries.length > 0 && inputCanvasRef.current) {
      const canvas = inputCanvasRef.current;
      const container = canvas.parentElement;
      
      if (container) {
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width || 500;
        canvas.height = rect.height || 200;
      } else {
        canvas.width = 500;
        canvas.height = 200;
      }

      // Draw waveform first
      drawWaveform(canvas, inputTimeSeries);
      
      // Then draw playback position on top if playing
      if (isPlaying && inputTimeSeries.length > 0) {
        const duration = inputTimeSeries.length / sampleRate;
        if (duration > 0) {
          const position = Math.min(1, Math.max(0, playbackPosition / duration));
          drawPlaybackPosition(canvas, position);
        }
      }
    }
  }, [inputTimeSeries, playbackPosition, isPlaying, sampleRate]);

  useEffect(() => {
    if (outputTimeSeries.length > 0 && outputCanvasRef.current) {
      const canvas = outputCanvasRef.current;
      const container = canvas.parentElement;
      
      if (container) {
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width || 500;
        canvas.height = rect.height || 200;
      } else {
        canvas.width = 500;
        canvas.height = 200;
      }

      // Draw waveform first
      drawWaveform(canvas, outputTimeSeries);
      
      // Then draw playback position on top if playing
      if (isPlaying && outputTimeSeries.length > 0) {
        const duration = outputTimeSeries.length / sampleRate;
        if (duration > 0) {
          const position = Math.min(1, Math.max(0, playbackPosition / duration));
          drawPlaybackPosition(canvas, position);
        }
      }
    }
  }, [outputTimeSeries, playbackPosition, isPlaying, sampleRate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return `${mins}:${secs.padStart(5, '0')}`;
  };

  return (
    <Card className="cine-viewer">
      <div className="cine-viewer-header">
        <div className="cine-viewer-title">
          <svg
            className="cine-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
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
          <h3>Linked Viewers</h3>
        </div>
        <Button variant="ghost" className="close-btn" onClick={() => onClose && onClose()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M18 6 6 18"></path>
            <path d="m6 6 12 12"></path>
          </svg>
        </Button>
      </div>
      <div className="cine-grid">
        <Card className="cine-panel">
          <div className="cine-panel-header">
            <h4>Input Signal</h4>
            <div className="status-indicator">
              <div className="status-dot" style={{ backgroundColor: isPlaying ? "#7bf447ff" : "#666" }}></div>
              <span>{status}</span>
              <span className="time-display">Time: {formatTime(playbackPosition)}</span>
            </div>
          </div>
          <div className="cine-content" style={{ width: "100%", height: "200px", position: "relative" }}>
            <canvas
              ref={inputCanvasRef}
              className="cine-canvas"
              style={{ width: "100%", height: "100%", display: "block" }}
            ></canvas>
          </div>
        </Card>
        <Card className="cine-panel">
          <div className="cine-panel-header">
            <h4>Output Signal</h4>
            <div className="status-indicator">
              <div className="status-dot" style={{ backgroundColor: isPlaying ? "#7bf447ff" : "#666" }}></div>
              <span>{status}</span>
              <span className="time-display">Time: {formatTime(playbackPosition)}</span>
            </div>
          </div>
          <div className="cine-content" style={{ width: "100%", height: "200px", position: "relative" }}>
            <canvas
              ref={outputCanvasRef}
              className="cine-canvas"
              style={{ width: "100%", height: "100%", display: "block" }}
            ></canvas>
          </div>
        </Card>
      </div>
      <Card className="cine-controls-panel">
        <PanelControls type="cine" />
      </Card>
    </Card>
  );
};

export default CineViewer;
