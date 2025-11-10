import React from "react";
import Button from "./Button";
import Subdivision from "./Subdivision";

const GenericEqualizer = () => {
  return (
    <div className="generic-equalizer">
      <div className="equalizer-content">
        <div className="equalizer-header">
          <div className="equalizer-title">
            <svg
              className="equalizer-icon"
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
            <h3>Equalizer Controls</h3>
          </div>
          <div className="equalizer-actions">
            <label htmlFor="settings-upload" className="upload-setting-label">
              <div className="upload-setting-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" x2="12" y1="3" y2="15"></line>
                </svg>
                <span>Upload Setting</span>
              </div>
            </label>
            <input
              id="settings-upload"
              type="file"
              accept=".json"
              className="file-input"
            />
            <Button variant="primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M5 12h14"></path>
                <path d="M12 5v14"></path>
              </svg>
              Add Band
            </Button>
            <Button variant="default">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                <path d="M3 3v5h5"></path>
              </svg>
              Reset All
            </Button>
            <Button variant="default">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"></path>
                <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"></path>
                <path d="M7 3v4a1 1 0 0 0 1 1h7"></path>
              </svg>
              Save Scheme
            </Button>
            <Button variant="ghost" className="close-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
            </Button>
          </div>
        </div>
        <div className="equalizer-canvas">
          <Subdivision />
        </div>
      </div>
    </div>
  );
};

export default GenericEqualizer;
