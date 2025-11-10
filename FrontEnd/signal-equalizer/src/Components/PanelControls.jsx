import React from "react";
import Button from "./Button";

const PanelControls = ({ type = "audio" }) => {
  if (type === "audio") {
    return (
      <div className="audio-controls">
        <div className="progress-bar">
          <span className="time-start">0:00</span>
          <div className="slider-container">
            <div className="slider-track">
              <div className="slider-progress" style={{ right: "100%" }}></div>
            </div>
            <div className="slider-thumb" style={{ left: "0%" }}></div>
          </div>
          <span className="time-end">1:40</span>
        </div>
        <div className="controls-row">
          <div className="playback-controls">
            <Button variant="primary" className="play-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polygon points="6 3 20 12 6 21 6 3"></polygon>
              </svg>
            </Button>
            <Button variant="default" className="stop-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect width="18" height="18" x="3" y="3" rx="2"></rect>
              </svg>
            </Button>
            <Button variant="default" className="reset-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                <path d="M3 3v5h5"></path>
              </svg>
            </Button>
          </div>
          <div className="speed-control">
            <span>Speed:</span>
            <div className="slider-container">
              <div className="slider-track">
                <div
                  className="slider-progress"
                  style={{ right: "57.1429%" }}
                ></div>
              </div>
              <div className="slider-thumb" style={{ left: "42.8571%" }}></div>
            </div>
            <span className="speed-value">1.00x</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cine-controls">
      <div className="playback-controls">
        <Button variant="primary" className="play-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <polygon points="6 3 20 12 6 21 6 3"></polygon>
          </svg>
        </Button>
        <Button variant="default" className="stop-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect width="18" height="18" x="3" y="3" rx="2"></rect>
          </svg>
        </Button>
      </div>
      <div className="speed-control">
        <span>Speed:</span>
        <div className="slider-container">
          <div className="slider-track">
            <div
              className="slider-progress"
              style={{ right: "57.1429%" }}
            ></div>
          </div>
          <div className="slider-thumb" style={{ left: "42.8571%" }}></div>
        </div>
        <span className="speed-value">1.00x</span>
      </div>
      <div className="zoom-control">
        <Button variant="default" className="zoom-out">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" x2="16.65" y1="21" y2="16.65"></line>
            <line x1="8" x2="14" y1="11" y2="11"></line>
          </svg>
        </Button>
        <div className="slider-container small">
          <div className="slider-track">
            <div className="slider-progress" style={{ right: "80%" }}></div>
          </div>
          <div className="slider-thumb" style={{ left: "20%" }}></div>
        </div>
        <Button variant="default" className="zoom-in">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" x2="16.65" y1="21" y2="16.65"></line>
            <line x1="11" x2="11" y1="8" y2="14"></line>
            <line x1="8" x2="14" y1="11" y2="11"></line>
          </svg>
        </Button>
        <span className="zoom-value">1.00x</span>
      </div>
      <Button variant="default" className="reset-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
          <path d="M3 3v5h5"></path>
        </svg>
        Reset
      </Button>
    </div>
  );
};

export default PanelControls;
