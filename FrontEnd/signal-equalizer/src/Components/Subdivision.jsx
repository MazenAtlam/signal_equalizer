import React from "react";

const Subdivision = ({ bands = [], onBandChange, onRemoveBand }) => {
  // Logarithmic distribution for audio frequencies (20Hz to 20kHz)
  const frequencies = [
    { freq: 20, label: "20Hz" },
    { freq: 30, label: "30Hz" },
    { freq: 40, label: "40Hz" },
    { freq: 50, label: "50Hz" },
    { freq: 60, label: "60Hz" },
    { freq: 70, label: "70Hz" },
    { freq: 80, label: "80Hz" },
    { freq: 90, label: "90Hz" },
    { freq: 100, label: "100Hz" },
    { freq: 200, label: "200Hz" },
    { freq: 300, label: "300Hz" },
    { freq: 400, label: "400Hz" },
    { freq: 500, label: "500Hz" },
    { freq: 600, label: "600Hz" },
    { freq: 700, label: "700Hz" },
    { freq: 800, label: "800Hz" },
    { freq: 900, label: "900Hz" },
    { freq: 1000, label: "1kHz" },
    { freq: 2000, label: "2kHz" },
    { freq: 3000, label: "3kHz" },
    { freq: 4000, label: "4kHz" },
    { freq: 5000, label: "5kHz" },
    { freq: 6000, label: "6kHz" },
    { freq: 7000, label: "7kHz" },
    { freq: 8000, label: "8kHz" },
    { freq: 9000, label: "9kHz" },
    { freq: 10000, label: "10kHz" },
    { freq: 15000, label: "15kHz" },
    { freq: 20000, label: "20kHz" },
  ];

  // Convert frequency to logarithmic position (0% to 100%)
  const freqToPosition = (freq) => {
    const minFreq = 20;
    const maxFreq = 20000;
    const minLog = Math.log10(minFreq);
    const maxLog = Math.log10(maxFreq);
    const freqLog = Math.log10(freq);

    return ((freqLog - minLog) / (maxLog - minLog)) * 100;
  };

  // Major frequencies for prominent labels
  const majorFrequencies = [
    20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000,
  ];

  // Simple slider component for bands
  const BandSlider = ({ band, onRemove }) => {
    const position = 10 + Math.random() * 80; // Random position for demo

    return (
      <div
        style={{
          position: "absolute",
          left: `${position}%`,
          bottom: "50px",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 10,
        }}
      >
        {/* Band Label */}
        <div
          style={{
            fontSize: "10px",
            color: "#374151",
            marginBottom: "5px",
            textAlign: "center",
            maxWidth: "80px",
            wordBreak: "break-word",
          }}
        >
          {band.label}
        </div>

        {/* Value Display */}
        <div
          style={{
            fontSize: "9px",
            color: "#1FD5F9",
            fontWeight: "bold",
            marginBottom: "5px",
          }}
        >
          {band.value > 0 ? "+" : ""}
          {band.value}dB
        </div>

        {/* Vertical Slider */}
        <div
          style={{
            position: "relative",
            height: "120px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <input
            type="range"
            min={band.min}
            max={band.max}
            value={band.value}
            onChange={(e) =>
              onBandChange(band.id, [parseFloat(e.target.value)])
            }
            style={{
              transform: "rotate(-90deg)",
              width: "120px",
              height: "20px",
              margin: "50px 0",
              cursor: "pointer",
            }}
          />
        </div>

        {/* Remove Button for custom bands */}
        {band.id.startsWith("custom-") && bands.length > 3 && (
          <button
            onClick={() => onRemove(band.id)}
            style={{
              marginTop: "10px",
              fontSize: "8px",
              color: "#ef4444",
              background: "transparent",
              border: "1px solid #ef4444",
              borderRadius: "3px",
              padding: "2px 6px",
              cursor: "pointer",
            }}
          >
            Remove
          </button>
        )}
      </div>
    );
  };

  return (
    <div
      className="subdivision-container"
      style={{ position: "relative", width: "100%", height: "100%" }}
    >
      <div
        className="placeholder-text"
        style={{
          textAlign: "center",
          color: "#666",
          fontSize: "14px",
          marginBottom: "20px",
          padding: "10px",
        }}
      >
        Equalizer Bands - Drag sliders to adjust levels
      </div>

      <div
        style={{
          position: "relative",
          width: "100%",
          height: "60px",
          padding: "0 20px",
        }}
      >
        {/* Frequency line */}
        <div
          style={{
            position: "absolute",
            top: "30px",
            left: "20px",
            right: "20px",
            height: "2px",
            backgroundColor: "#e5e7eb",
          }}
        />

        {/* Frequency markers */}
        {frequencies.map((freqObj, index) => {
          const position = freqToPosition(freqObj.freq);
          const isMajor = majorFrequencies.includes(freqObj.freq);

          return (
            <div
              key={index}
              style={{
                position: "absolute",
                left: `${position}%`,
                top: "25px",
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              {/* Marker line */}
              <div
                style={{
                  width: isMajor ? "2px" : "1px",
                  height: isMajor ? "10px" : "6px",
                  backgroundColor: isMajor ? "#374151" : "#9ca3af",
                }}
              />

              {/* Label for major frequencies */}
              {isMajor && (
                <div
                  style={{
                    marginTop: "12px",
                    fontSize: "10px",
                    color: "#f3f5f8ff",
                    fontWeight: "500",
                    whiteSpace: "nowrap",
                  }}
                >
                  {freqObj.label}
                </div>
              )}
            </div>
          );
        })}

        {/* Render band sliders */}
        {bands.map((band) => (
          <BandSlider key={band.id} band={band} onRemove={onRemoveBand} />
        ))}
      </div>
    </div>
  );
};

export default Subdivision;
