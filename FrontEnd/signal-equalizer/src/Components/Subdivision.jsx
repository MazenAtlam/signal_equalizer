import React, { useState, useEffect } from "react";
import DraggableSlider from "./DraggableSlider";

const Subdivision = ({
  bands = [],
  onBandChange,
  onBandPositionChange,
  onBandBandwidthChange,
  onRemoveBand,
  bandsPosition = "below",
  orientation = "vertical",
}) => {
  // Use local state to manage band positions and bandwidth
  const [localBands, setLocalBands] = useState([]);
  const [activeBandId, setActiveBandId] = useState(null); // Track which band is being actively modified

  // Initialize bands with positions and bandwidth when component mounts or bands prop changes
  useEffect(() => {
    if (bands.length > 0) {
      const bandsWithProperties = bands.map((band, index) => ({
        ...band,
        position:
          band.position !== undefined
            ? band.position
            : getBandInitialPosition(band.label, index, bands.length),
        bandwidth: band.bandwidth !== undefined ? band.bandwidth : 1, // Default bandwidth
      }));
      setLocalBands(bandsWithProperties);
    }
  }, [bands]);

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

  // Convert position to frequency (inverse of freqToPosition)
  const positionToFreq = (position) => {
    const minFreq = 20;
    const maxFreq = 20000;
    const minLog = Math.log10(minFreq);
    const maxLog = Math.log10(maxFreq);
    const freqLog = minLog + (position / 100) * (maxLog - minLog);
    return Math.pow(10, freqLog);
  };

  // Major frequencies for prominent labels
  const majorFrequencies = [
    20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000,
  ];

  // Map band labels to approximate frequency positions
  const getBandInitialPosition = (bandLabel, index, totalBands) => {
    const positionMap = {
      sub: 10, // ~30Hz
      bass: 20, // ~100Hz
      "low-mid": 35, // ~350Hz
      mid: 50, // ~1kHz
      "high-mid": 65, // ~3kHz
      presence: 80, // ~5kHz
      brilliance: 90, // ~8kHz
    };

    // Extract key from label for custom bands or exact matches
    const key = bandLabel.toLowerCase().split(" ")[0];
    const exactPosition = positionMap[key];

    if (exactPosition) {
      return exactPosition;
    }

    // For custom bands, distribute evenly
    return (index / Math.max(1, totalBands - 1)) * 80 + 10;
  };

  // Handle band position change
  const handleBandPositionChange = (
    bandId,
    newPosition,
    isActiveModification = false
  ) => {
    if (isActiveModification) {
      setActiveBandId(bandId);
    }

    setLocalBands((prevBands) =>
      prevBands.map((band) =>
        band.id === bandId ? { ...band, position: newPosition } : band
      )
    );

    if (onBandPositionChange) {
      onBandPositionChange(bandId, newPosition);
    }
  };

  // Handle band gain change
  const handleBandGainChange = (bandId, newValue) => {
    setLocalBands((prevBands) =>
      prevBands.map((band) =>
        band.id === bandId ? { ...band, value: newValue } : band
      )
    );

    if (onBandChange) {
      onBandChange(bandId, [newValue]);
    }
  };

  // Handle band bandwidth change (unlimited)
  const handleBandBandwidthChange = (
    bandId,
    newBandwidth,
    isActiveModification = false
  ) => {
    if (isActiveModification) {
      setActiveBandId(bandId);
    }

    setLocalBands((prevBands) =>
      prevBands.map((band) =>
        band.id === bandId ? { ...band, bandwidth: newBandwidth } : band
      )
    );

    if (onBandBandwidthChange) {
      onBandBandwidthChange(bandId, newBandwidth);
    }
  };

  // Handle band removal
  const handleRemoveBand = (bandId) => {
    setLocalBands((prevBands) =>
      prevBands.filter((band) => band.id !== bandId)
    );

    if (onRemoveBand) {
      onRemoveBand(bandId);
    }
  };

  // Reset active band when mouse is released anywhere
  useEffect(() => {
    const handleMouseUp = () => {
      setActiveBandId(null);
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div
      className="subdivision-container"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: "250px",
        backgroundColor: "#1a1a1a",
        borderRadius: "8px",
        padding: "10px",
      }}
    >
      <div
        className="placeholder-text"
        style={{
          textAlign: "center",
          color: "#888",
          fontSize: "12px",
          marginBottom: "15px",
          padding: "5px",
          fontStyle: "italic",
        }}
      >
        Drag bands to reposition, drag vertically for gain, drag dots for
        unlimited width adjustment
      </div>

      {/* Main container with frequency line and bands */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: bandsPosition === "below" ? "200px" : "150px",
          padding: "0 10px",
        }}
      >
        {/* Frequency line - Always at the top */}
        <div
          style={{
            position: "absolute",
            top: "30px",
            left: "10px",
            right: "10px",
            height: "2px",
            backgroundColor: "#4B5563",
            zIndex: 5,
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
                zIndex: 5,
              }}
            >
              {/* Marker line */}
              <div
                style={{
                  width: isMajor ? "2px" : "1px",
                  height: isMajor ? "12px" : "8px",
                  backgroundColor: isMajor ? "#1FD5F9" : "#6B7280",
                }}
              />

              {/* Label for major frequencies */}
              {isMajor && (
                <div
                  style={{
                    marginTop: "14px",
                    fontSize: "9px",
                    color: "#e5e7eb",
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

        {/* Render draggable band sliders */}
        {localBands.map((band) => (
          <DraggableSlider
            key={band.id}
            band={band}
            onGainChange={handleBandGainChange}
            onPositionChange={handleBandPositionChange}
            onBandwidthChange={handleBandBandwidthChange}
            onRemove={handleRemoveBand}
            bandsPosition={bandsPosition}
            positionToFreq={positionToFreq}
            freqToPosition={freqToPosition}
            isActive={band.id === activeBandId}
          />
        ))}
      </div>
    </div>
  );
};

export default Subdivision;
