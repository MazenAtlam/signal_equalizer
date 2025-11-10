import React from "react";
import Card from "./Card";
import Button from "./Button";
import PanelControls from "./PanelControls";

const CineViewer = () => {
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
        <Button variant="ghost" className="close-btn">
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
              <div className="status-dot"></div>
              <span>Paused</span>
              <span className="time-display">Time: 0.00s</span>
            </div>
          </div>
          <div className="cine-content">
            <canvas className="cine-canvas"></canvas>
          </div>
        </Card>
        <Card className="cine-panel">
          <div className="cine-panel-header">
            <h4>Output Signal</h4>
            <div className="status-indicator">
              <div className="status-dot"></div>
              <span>Paused</span>
              <span className="time-display">Time: 0.00s</span>
            </div>
          </div>
          <div className="cine-content">
            <canvas className="cine-canvas"></canvas>
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
