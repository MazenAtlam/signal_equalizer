import React from "react";

const Subdivision = () => {
  const frequencies = [
    { position: 0, label: "20Hz" },
    { position: 127.61, label: "50Hz" },
    { position: 224.14, label: "100Hz" },
    { position: 320.67, label: "200Hz" },
    { position: 448.27, label: "500Hz" },
    { position: 544.8, label: "1kHz" },
    { position: 641.33, label: "2kHz" },
    { position: 768.94, label: "5kHz" },
    { position: 865.47, label: "10kHz" },
    { position: 962, label: "20kHz" },
  ];

  return (
    <div className="subdivision-container">
      <div className="placeholder-text">
        Add subdivision to control the signal
      </div>
      <svg className="subdivision-svg" width="100%" height="100">
        <line
          x1="0"
          y1="30"
          x2="100%"
          y2="30"
          stroke="#e5e7eb"
          strokeWidth="2"
        />
        {frequencies.map((freq, index) => (
          <g key={index}>
            <line
              x1={freq.position}
              y1="25"
              x2={freq.position}
              y2="35"
              stroke="#e5e7eb"
              strokeWidth="1"
            />
            <text
              x={freq.position}
              y="20"
              textAnchor="middle"
              fill="#374151"
              fontSize="10"
            >
              {freq.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default Subdivision;
