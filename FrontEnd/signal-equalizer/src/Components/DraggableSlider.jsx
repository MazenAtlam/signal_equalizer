import React, { useState, useRef, useCallback } from "react";

const DraggableSlider = ({
  band,
  onGainChange,
  onPositionChange,
  onBandwidthChange,
  onRemove,
  bandsPosition = "below",
  positionToFreq,
  freqToPosition,
  isActive,
}) => {
  const [isDraggingGain, setIsDraggingGain] = useState(false);
  const [isDraggingPosition, setIsDraggingPosition] = useState(false);
  const [isDraggingWidth, setIsDraggingWidth] = useState(false);
  const sliderRef = useRef(null);
  const widthDragRef = useRef({ startX: 0, startWidth: 0 });
  const dragStartRef = useRef({ x: 0, y: 0, value: 0, position: 0 });

  // Format frequency for display
  const formatFrequencyDisplay = (freq) => {
    if (freq < 1000) {
      return `${Math.round(freq)}Hz`;
    } else {
      return `${(freq / 1000).toFixed(1)}kHz`.replace(".0", "");
    }
  };

  // Calculate frequency range based on bandwidth
  const calculateFrequencyRange = () => {
    const centerFreq = positionToFreq(band.position);
    const bandwidth = band.bandwidth || 1;

    // Calculate frequency range based on bandwidth (logarithmic scaling)
    const minFreq = 20;
    const maxFreq = 20000;
    const minLog = Math.log10(minFreq);
    const maxLog = Math.log10(maxFreq);

    const centerLog = Math.log10(centerFreq);
    const range = (maxLog - minLog) * (bandwidth * 0.02);

    const lowerFreq = Math.pow(10, centerLog - range);
    const upperFreq = Math.pow(10, centerLog + range);

    return {
      lower: Math.max(minFreq, lowerFreq),
      upper: Math.min(maxFreq, upperFreq),
      center: centerFreq,
    };
  };

  const frequencyRange = calculateFrequencyRange();
  const rangeLabel = `${formatFrequencyDisplay(
    frequencyRange.lower
  )} - ${formatFrequencyDisplay(frequencyRange.upper)}`;

  // Calculate positions for the width handles and connecting line
  const bandwidth = band.bandwidth || 1;
  const handleSpacing = bandwidth * 40;
  const leftHandlePosition = -handleSpacing / 2;
  const rightHandlePosition = handleSpacing / 2;

  // Handle vertical dragging for gain adjustment
  const handleGainMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingGain(true);

      if (!sliderRef.current) return;

      const rect = sliderRef.current.getBoundingClientRect();
      dragStartRef.current.value = band.value;
      dragStartRef.current.y = e.clientY;

      const handleMouseMove = (moveEvent) => {
        if (!sliderRef.current) return;

        const deltaY = dragStartRef.current.y - moveEvent.clientY;
        const sensitivity = 0.5;
        const valueChange = deltaY * sensitivity;

        const newValue = dragStartRef.current.value + valueChange;
        const clampedValue = Math.max(band.min, Math.min(band.max, newValue));

        onGainChange(band.id, clampedValue);
      };

      const handleMouseUp = () => {
        setIsDraggingGain(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [band, onGainChange]
  );

  // Handle horizontal dragging for position adjustment
  const handlePositionMouseDown = useCallback(
    (e) => {
      if (
        e.target.classList.contains("width-handle") ||
        e.target.classList.contains("width-connector")
      )
        return;

      e.preventDefault();
      e.stopPropagation();
      setIsDraggingPosition(true);

      const handleMouseMove = (moveEvent) => {
        const subdivisionContainer = document.querySelector(
          ".subdivision-container"
        );
        if (!subdivisionContainer) return;

        const containerRect = subdivisionContainer.getBoundingClientRect();
        const containerWidth = containerRect.width;

        const mouseX = moveEvent.clientX - containerRect.left;
        let percentage = (mouseX / containerWidth) * 100;

        percentage = Math.max(0, Math.min(100, percentage));

        if (onPositionChange) {
          onPositionChange(band.id, percentage, true);
        }
      };

      const handleMouseUp = () => {
        setIsDraggingPosition(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      handleMouseMove(e);
    },
    [band.id, onPositionChange]
  );

  // Handle width dragging for bandwidth adjustment
  const handleWidthMouseDown = useCallback(
    (e, isLeftHandle = false) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingWidth(true);

      widthDragRef.current.startX = e.clientX;
      widthDragRef.current.startWidth = band.bandwidth || 1;

      const handleMouseMove = (moveEvent) => {
        const deltaX = moveEvent.clientX - widthDragRef.current.startX;
        const sensitivity = 0.02;
        let widthChange = deltaX * sensitivity;

        if (isLeftHandle) {
          widthChange = -widthChange;
        }

        let newBandwidth = widthDragRef.current.startWidth + widthChange;
        newBandwidth = Math.max(0.1, newBandwidth);

        if (onBandwidthChange) {
          onBandwidthChange(band.id, newBandwidth, true);
        }
      };

      const handleMouseUp = () => {
        setIsDraggingWidth(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [band.id, band.bandwidth, onBandwidthChange]
  );

  // Handle click for gain adjustment
  const handleGainClick = useCallback(
    (e) => {
      e.stopPropagation();
      if (!sliderRef.current) return;

      const rect = sliderRef.current.getBoundingClientRect();
      const sliderHeight = rect.height;
      const clickY = e.clientY - rect.top;
      const percentage = 1 - clickY / sliderHeight;

      const newValue = band.min + percentage * (band.max - band.min);
      const clampedValue = Math.max(band.min, Math.min(band.max, newValue));

      onGainChange(band.id, clampedValue);
    },
    [band, onGainChange]
  );

  // Calculate slider fill percentage for visual feedback
  const fillPercentage =
    ((band.value - band.min) / (band.max - band.min)) * 100;

  // Calculate z-index based on active state
  const zIndex = isActive
    ? 30
    : isDraggingPosition || isDraggingGain || isDraggingWidth
    ? 20
    : 10;

  return (
    <div
      style={{
        position: "absolute",
        left: `${band.position}%`,
        top: bandsPosition === "below" ? "120px" : "0px",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        zIndex: zIndex,
        cursor: isDraggingPosition ? "grabbing" : "grab",
        transition:
          isDraggingPosition || isDraggingWidth ? "none" : "left 0.1s ease",
      }}
      onMouseDown={handlePositionMouseDown}
    >
      {/* Dynamic Frequency Range Label */}
      <div
        style={{
          fontSize: "10px",
          color: "#1FD5F9",
          marginBottom: "8px",
          textAlign: "center",
          maxWidth: "140px",
          wordBreak: "break-word",
          cursor: "grab",
          userSelect: "none",
          backgroundColor: isDraggingPosition
            ? "rgba(31, 213, 249, 0.2)"
            : "transparent",
          borderRadius: "4px",
          padding: "2px 6px",
          border: isDraggingPosition
            ? "1px solid #1FD5F9"
            : "1px solid transparent",
          transition: "all 0.2s ease",
          fontWeight: "bold",
        }}
      >
        {rangeLabel}
      </div>

      {/* Width Control Section */}
      <div
        style={{
          position: "relative",
          width: `${Math.max(60, handleSpacing + 40)}px`,
          height: "20px",
          marginBottom: "8px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Left Width Handle */}
        <div
          className="width-handle"
          onMouseDown={(e) => handleWidthMouseDown(e, true)}
          style={{
            position: "absolute",
            left: `${leftHandlePosition}px`,
            width: "12px",
            height: "12px",
            backgroundColor: "#1FD5F9",
            borderRadius: "50%",
            cursor: "ew-resize",
            opacity: isDraggingWidth ? 1 : 0.8,
            transition: "all 0.2s ease",
            zIndex: 15,
            boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
          }}
        />

        {/* Connecting Line */}
        <div
          className="width-connector"
          style={{
            position: "absolute",
            left: `${leftHandlePosition + 6}px`,
            right: `${-rightHandlePosition + 6}px`,
            height: "2px",
            backgroundColor: isActive ? "#10B981" : "#1FD5F9",
            borderRadius: "1px",
            opacity: isDraggingWidth ? 1 : 0.7,
            transition: "all 0.2s ease",
            cursor: "move",
          }}
          onMouseDown={handlePositionMouseDown}
        />

        {/* Right Width Handle */}
        <div
          className="width-handle"
          onMouseDown={(e) => handleWidthMouseDown(e, false)}
          style={{
            position: "absolute",
            right: `${rightHandlePosition}px`,
            width: "12px",
            height: "12px",
            backgroundColor: "#1FD5F9",
            borderRadius: "50%",
            cursor: "ew-resize",
            opacity: isDraggingWidth ? 1 : 0.8,
            transition: "all 0.2s ease",
            zIndex: 15,
            boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
          }}
        />
      </div>

      {/* Value Display */}
      <div
        style={{
          fontSize: "9px",
          color: "#1FD5F9",
          fontWeight: "bold",
          marginBottom: "5px",
          userSelect: "none",
        }}
      >
        {band.value > 0 ? "+" : ""}
        {band.value}dB
      </div>

      {/* Fixed Width Vertical Slider */}
      <div
        ref={sliderRef}
        onClick={handleGainClick}
        onMouseDown={handleGainMouseDown}
        style={{
          position: "relative",
          width: "30px",
          height: "120px",
          backgroundColor: "#374151",
          borderRadius: "15px",
          cursor: isDraggingGain ? "grabbing" : "ns-resize",
          border: `2px solid ${
            isActive ? "#10B981" : isDraggingGain ? "#1FD5F9" : "#4B5563"
          }`,
          overflow: "hidden",
          userSelect: "none",
          boxShadow: isActive
            ? "0 0 15px rgba(16, 185, 129, 0.4)"
            : isDraggingGain
            ? "0 0 10px rgba(31, 213, 249, 0.5)"
            : "none",
          transition: isDraggingGain ? "none" : "all 0.2s ease",
        }}
      >
        {/* Slider Track Fill */}
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "0",
            right: "0",
            height: `${fillPercentage}%`,
            backgroundColor: isActive ? "#10B981" : "#1FD5F9",
            borderRadius: "13px",
            transition: isDraggingGain ? "none" : "height 0.1s ease",
          }}
        />

        {/* Slider Thumb */}
        <div
          style={{
            position: "absolute",
            left: "0",
            right: "0",
            bottom: `calc(${fillPercentage}% - 8px)`,
            height: "16px",
            backgroundColor: "#FFFFFF",
            borderRadius: "8px",
            border: `2px solid ${isActive ? "#10B981" : "#1FD5F9"}`,
            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
            cursor: isDraggingGain ? "grabbing" : "ns-resize",
            transform: isDraggingGain ? "scale(1.15)" : "scale(1)",
            transition: isDraggingGain
              ? "none"
              : "transform 0.2s ease, bottom 0.1s ease",
          }}
        />

        {/* Center line for reference */}
        <div
          style={{
            position: "absolute",
            left: "0",
            right: "0",
            bottom: "50%",
            height: "1px",
            backgroundColor: "rgba(255,255,255,0.3)",
          }}
        />
      </div>

      {/* Bandwidth indicator */}
      <div
        style={{
          fontSize: "8px",
          color: isActive ? "#10B981" : "#9CA3AF",
          marginTop: "5px",
          userSelect: "none",
          fontWeight: isActive ? "bold" : "normal",
        }}
      >
        Range: {(band.bandwidth || 1).toFixed(1)}
      </div>

      {/* Remove Button for custom bands */}
      {band.id.startsWith("custom-") && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(band.id);
          }}
          style={{
            marginTop: "10px",
            fontSize: "8px",
            color: "#ef4444",
            background: "transparent",
            border: "1px solid #ef4444",
            borderRadius: "3px",
            padding: "2px 6px",
            cursor: "pointer",
            opacity: isDraggingPosition ? 0 : 1,
            transition: "opacity 0.2s ease",
          }}
        >
          Remove
        </button>
      )}
    </div>
  );
};

export default DraggableSlider;
