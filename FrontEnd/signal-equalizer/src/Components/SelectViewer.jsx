// SelectViewer.jsx
import React from "react";
import Card from "./Card";

const SelectViewer = ({ viewerVisibility, onVisibilityChange, hasAudioData = false }) => {
  const viewers = [
    { id: 1, label: "Frequency Graph", viewerName: "frequencyGraph" },
    { id: 2, label: "Spectrogram Viewers", viewerName: "spectrogramAnalyzer" },
    { id: 3, label: "Audio Playbacks", viewerName: "audioPlayer" },
    { id: 4, label: "Linked Viewers", viewerName: "cineViewer" },
    { id: 5, label: "Equalizer Controls", viewerName: "genericEqualizer" },
  ];

  const handleCheckboxChange = (viewerName, checked) => {
    // Always call the parent handler - it will check for audio data and show error if needed
    if (onVisibilityChange) {
      onVisibilityChange(viewerName, checked);
    }
  };

  return (
    <Card className="p-4">
      <div className="d-flex align-items-center justify-content-between gap-6">
        <div className="d-flex align-items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 text-amber-400"
          >
            <path d="M21 10.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.5"></path>
            <path d="m9 11 3 3L22 4"></path>
          </svg>
          <h3 className="text-base font-semibold mb-0">Select Viewers</h3>
        </div>
        <div className="viewer-options">
          {viewers.map((viewer) => (
            <label 
              key={viewer.id} 
              className="viewer-option"
              style={!hasAudioData && !viewerVisibility[viewer.viewerName] ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
            >
              <input
                type="checkbox"
                checked={viewerVisibility && viewerVisibility[viewer.viewerName] !== undefined 
                  ? viewerVisibility[viewer.viewerName] 
                  : false}
                onChange={(e) => {
                  const newChecked = e.target.checked;
                  // Call the handler - it will check for audio data and show error if needed
                  handleCheckboxChange(viewer.viewerName, newChecked);
                }}
                className="checkbox-input rounded-1"
              />
              <span className="text-sm font-bold">{viewer.label}</span>
            </label>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default SelectViewer;
