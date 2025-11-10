// SelectViewer.jsx
import React from "react";
import Card from "./Card";

const SelectViewer = () => {
  const viewers = [
    { id: 1, label: "Frequency Graph", checked: false },
    { id: 2, label: "Spectrogram Viewers", checked: false },
    { id: 3, label: "Audio Playbacks", checked: false },
    { id: 4, label: "Linked Viewers", checked: false },
    { id: 5, label: "Equalizer Controls", checked: false },
  ];

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
          <h3 className="text-base font-semibold">Select Viewers</h3>
        </div>
        <div className="viewer-options">
          {viewers.map((viewer) => (
            <label key={viewer.id} className="viewer-option">
              <input
                type="checkbox"
                defaultChecked={viewer.checked}
                className="checkbox-input rounded-4"
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
