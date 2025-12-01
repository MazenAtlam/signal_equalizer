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
                             rowHeight = 160,
                             rowMarginTop = 130,
                             onDragStart, // Add this prop
                             disabled = false, // New disabled prop
                         }) => {
    const [isDraggingGain, setIsDraggingGain] = useState(false);
    const [isDraggingPosition, setIsDraggingPosition] = useState(false);
    const [isDraggingWidth, setIsDraggingWidth] = useState(false);

    const sliderRef = useRef(null);
    const rootRef = useRef(null);
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

    // Calculate top position based on row - with margin for rows beyond the first
    const calculateTopPosition = () => {
        const baseTop = bandsPosition === "below" ? 70 : 0;
        const rowOffset = (band.row || 0) * rowHeight;

        // Add margin top for rows beyond the first (row 0)
        const additionalMargin = (band.row || 0) > 0 ? (band.row || 0) * rowMarginTop : 0;

        return baseTop + rowOffset + additionalMargin;
    };

    // Handle vertical dragging for gain adjustment - with natural sensitivity
    const handleGainMouseDown = useCallback(
        (e) => {
            if (disabled) return; // Don't allow dragging when disabled

            e.preventDefault();
            e.stopPropagation();
            setIsDraggingGain(true);
            onDragStart?.(); // Notify parent that dragging started

            if (!sliderRef.current) return;

            const rect = sliderRef.current.getBoundingClientRect();
            const sliderHeight = rect.height;
            const clickY = e.clientY - rect.top;
            const percentage = 1 - clickY / sliderHeight;

            const newValue = band.min + percentage * (band.max - band.min);
            const clampedValue = Math.max(band.min, Math.min(band.max, newValue));

            onGainChange(band.id, clampedValue);

            dragStartRef.current.value = clampedValue;
            dragStartRef.current.y = e.clientY;

            const handleMouseMove = (moveEvent) => {
                if (!sliderRef.current) return;

                const deltaY = dragStartRef.current.y - moveEvent.clientY;

                // Much lower sensitivity for natural dragging
                const sensitivity = 0.3; // Reduced from 0.5 to 0.3
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
        [band, onGainChange, onDragStart, disabled]
    );

    // Handle horizontal dragging for position adjustment
    const handlePositionMouseDown = useCallback(
        (e) => {
            if (disabled) return; // Don't allow dragging when disabled

            if (e.target.classList.contains("width-handle")) return;

            e.preventDefault();
            e.stopPropagation();
            setIsDraggingPosition(true);
            onDragStart?.(); // Notify parent that dragging started

            const handleMouseMove = (moveEvent) => {
                const subdivisionContainer = document.querySelector(
                    ".subdivision-container"
                );
                const container = subdivisionContainer || rootRef.current?.offsetParent;
                if (!container) return;

                const containerRect = container.getBoundingClientRect();
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
        [band.id, onPositionChange, onDragStart, disabled]
    );

    // Handle width dragging for bandwidth adjustment
    const handleWidthMouseDown = useCallback(
        (e, isLeftHandle = false) => {
            if (disabled) return; // Don't allow dragging when disabled

            e.preventDefault();
            e.stopPropagation();
            setIsDraggingWidth(true);
            onDragStart?.(); // Notify parent that dragging started

            const startX = e.clientX;
            const startBandwidth = band.bandwidth || 1;
            const startPosition = band.position;

            let containerWidth = 1000;
            if (rootRef.current && rootRef.current.offsetParent) {
                containerWidth = rootRef.current.offsetParent.getBoundingClientRect().width;
            }

            const handleMouseMove = (moveEvent) => {
                const deltaX = moveEvent.clientX - startX;
                const currentWidthPx = startBandwidth * 40;
                const minWidthPx = 15;

                let newWidthPx;
                let shiftPx;

                if (isLeftHandle) {
                    newWidthPx = currentWidthPx - deltaX;
                    newWidthPx = Math.max(minWidthPx, newWidthPx);
                    shiftPx = (currentWidthPx - newWidthPx) / 2;
                } else {
                    newWidthPx = currentWidthPx + deltaX;
                    newWidthPx = Math.max(minWidthPx, newWidthPx);
                    shiftPx = (newWidthPx - currentWidthPx) / 2;
                }

                const newBandwidth = newWidthPx / 40;
                const shiftPercentage = (shiftPx / containerWidth) * 100;
                const newPosition = startPosition + shiftPercentage;

                if (onBandwidthChange) onBandwidthChange(band.id, newBandwidth, true);
                if (onPositionChange) onPositionChange(band.id, newPosition, true);
            };

            const handleMouseUp = () => {
                setIsDraggingWidth(false);
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
            };

            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
        },
        [band.id, band.bandwidth, band.position, onBandwidthChange, onPositionChange, onDragStart, disabled]
    );

    // Handle click for gain adjustment
    const handleGainClick = useCallback(
        (e) => {
            if (disabled) return; // Don't allow clicking when disabled

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
        [band, onGainChange, disabled]
    );

    // Calculate slider fill percentage for linear gain (0 to 4)
    const fillPercentage = ((band.value - band.min) / (band.max - band.min)) * 100;

    // Calculate z-index based on active state and row
    const zIndex = isActive
        ? 30
        : isDraggingPosition || isDraggingGain || isDraggingWidth
            ? 20
            : 10 - (band.row || 0);

    const topPosition = calculateTopPosition();
    const isMainRow = (band.row || 0) === 0;

    return (
        <div
            ref={rootRef}
            style={{
                position: "absolute",
                left: `${band.position}%`,
                top: `${topPosition}px`,
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                zIndex: zIndex,
                cursor: disabled ? 'not-allowed' : (isDraggingPosition ? "grabbing" : "grab"),
                transition: isDraggingPosition || isDraggingWidth ? "none" : "all 0.2s ease",
                padding: "10px 0",
                // Add background for better visibility in higher rows
                backgroundColor: !isMainRow ? "rgba(31, 213, 249, 0.05)" : "transparent",
                borderRadius: "8px",
                border: !isMainRow ? "1px solid rgba(31, 213, 249, 0.2)" : "none",
                opacity: disabled ? 0.7 : 1, // Visual indication when disabled
            }}
            onMouseDown={disabled ? undefined : handlePositionMouseDown}
        >
            {/* Row indicator */}
            <div
                style={{
                    fontSize: "7px",
                    color: isMainRow ? "#1FD5F9" : "#10B981",
                    marginBottom: "4px",
                    userSelect: "none",
                    fontWeight: "bold",
                    padding: "2px 8px",
                    backgroundColor: isMainRow ? "rgba(31, 213, 249, 0.1)" : "rgba(16, 185, 129, 0.1)",
                    borderRadius: "12px",
                    border: isMainRow ? "1px solid #1FD5F9" : "1px solid #10B981",
                }}
            >
                {isMainRow ? "MAIN" : `Row ${(band.row || 0) + 1}`}
            </div>

            {/* Frequency range label */}
            <div
                style={{
                    fontSize: "9px",
                    color: isMainRow ? "#1FD5F9" : "#10B981",
                    marginBottom: "10px",
                    textAlign: "center",
                    maxWidth: "160px",
                    wordBreak: "break-word",
                    cursor: disabled ? 'not-allowed' : 'grab',
                    userSelect: "none",
                    backgroundColor: isDraggingPosition
                        ? isMainRow ? "rgba(31, 213, 249, 0.3)" : "rgba(16, 185, 129, 0.3)"
                        : isMainRow ? "rgba(31, 213, 249, 0.15)" : "rgba(16, 185, 129, 0.15)",
                    borderRadius: "6px",
                    padding: "4px 8px",
                    border: isDraggingPosition
                        ? isMainRow ? "1px solid #1FD5F9" : "1px solid #10B981"
                        : isMainRow ? "1px solid rgba(31, 213, 249, 0.5)" : "1px solid rgba(16, 185, 129, 0.5)",
                    transition: "all 0.2s ease",
                    fontWeight: "bold",
                }}
            >
                {band.label} ({rangeLabel})
            </div>

            {/* Width control section */}
            <div
                style={{
                    position: "relative",
                    width: "0px",
                    height: "20px",
                    marginBottom: "10px",
                }}
            >
                {/* Connecting line */}
                <div
                    className="width-connector"
                    style={{
                        position: "absolute",
                        left: `${-handleSpacing / 2}px`,
                        width: `${handleSpacing}px`,
                        top: "9px",
                        height: "2px",
                        backgroundColor: isMainRow ? "#1FD5F9" : "#10B981",
                        borderRadius: "1px",
                        opacity: isDraggingWidth ? 1 : 0.7,
                        transition: "all 0.2s ease",
                        cursor: disabled ? 'not-allowed' : 'move',
                    }}
                    onMouseDown={disabled ? undefined : handlePositionMouseDown}
                />

                {/* Left width handle */}
                <div
                    className="width-handle"
                    onMouseDown={disabled ? undefined : (e) => handleWidthMouseDown(e, true)}
                    style={{
                        position: "absolute",
                        left: `${-handleSpacing / 2}px`,
                        transform: "translateX(-50%)",
                        top: "4px",
                        width: "14px",
                        height: "14px",
                        backgroundColor: isMainRow ? "#1FD5F9" : "#10B981",
                        borderRadius: "50%",
                        cursor: disabled ? 'not-allowed' : 'ew-resize',
                        opacity: isDraggingWidth ? 1 : 0.9,
                        transition: "all 0.2s ease",
                        zIndex: 15,
                        boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
                        border: "2px solid white",
                    }}
                />

                {/* Right width handle */}
                <div
                    className="width-handle"
                    onMouseDown={disabled ? undefined : (e) => handleWidthMouseDown(e, false)}
                    style={{
                        position: "absolute",
                        left: `${handleSpacing / 2}px`,
                        transform: "translateX(-50%)",
                        top: "4px",
                        width: "14px",
                        height: "14px",
                        backgroundColor: isMainRow ? "#1FD5F9" : "#10B981",
                        borderRadius: "50%",
                        cursor: disabled ? 'not-allowed' : 'ew-resize',
                        opacity: isDraggingWidth ? 1 : 0.9,
                        transition: "all 0.2s ease",
                        zIndex: 15,
                        boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
                        border: "2px solid white",
                    }}
                />
            </div>

            {/* Value display - now showing linear gain */}
            <div
                style={{
                    fontSize: "10px",
                    color: isMainRow ? "#1FD5F9" : "#10B981",
                    fontWeight: "bold",
                    marginBottom: "8px",
                    userSelect: "none",
                    padding: "2px 6px",
                    backgroundColor: isMainRow ? "rgba(31, 213, 249, 0.1)" : "rgba(16, 185, 129, 0.1)",
                    borderRadius: "4px",
                }}
            >
                Gain: {band.value.toFixed(2)}x
            </div>

            {/* REDESIGNED Vertical Slider with Speed Slider Styling */}
            <div
                ref={sliderRef}
                className="slider-container"
                style={{
                    width: "15px",
                    position: "relative",
                    height: "140px",
                    cursor: disabled ? 'not-allowed' : 'pointer',
                }}
                onClick={disabled ? undefined : handleGainClick}
            >
                {/* Vertical Slider Track */}
                <div
                    className="slider-track"
                    style={{
                        position: "absolute",
                        left: "50%",
                        top: 0,
                        bottom: 0,
                        height: "100%",
                        width: "6px",
                        backgroundColor: "#333",
                        transform: "translateX(-50%)",
                        borderRadius: "5px",
                    }}
                >
                    {/* Vertical Slider Progress - fills from bottom to top */}
                    <div
                        className="slider-progress"
                        style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: `${fillPercentage}%`,
                            backgroundColor: "#1FD5F9",
                            borderRadius: "5px",
                            transition: isDraggingGain ? "none" : "height 0.1s ease",
                        }}
                    ></div>
                </div>

                {/* Vertical Slider Thumb - Now with proper drag handling */}
                <div
                    className="slider-thumb"
                    style={{
                        position: "absolute",
                        left: "50%",
                        bottom: `${fillPercentage}%`,
                        width: "15px",
                        height: "15px",
                        backgroundColor: "#080808",
                        borderRadius: "50%",
                        transform: "translate(-50%, 50%)",
                        cursor: disabled ? 'not-allowed' : (isDraggingGain ? "grabbing" : "grab"),
                        transition: isDraggingGain ? "none" : "bottom 0.1s ease",
                        zIndex: 10,
                    }}
                    onMouseDown={disabled ? undefined : (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleGainMouseDown(e);
                    }}
                ></div>
            </div>

            {/* Bandwidth indicator */}
            <div
                style={{
                    fontSize: "9px",
                    color: isMainRow ? "#1FD5F9" : "#10B981",
                    marginTop: "8px",
                    userSelect: "none",
                    fontWeight: isActive ? "bold" : "normal",
                    padding: "2px 6px",
                    backgroundColor: isMainRow ? "rgba(31, 213, 249, 0.1)" : "rgba(16, 185, 129, 0.1)",
                    borderRadius: "4px",
                }}
            >
                Bandwidth: {(band.bandwidth || 1).toFixed(1)}
            </div>

            {/* Remove button for custom bands */}
            {band.id.startsWith("custom-") && (
                <button
                    onClick={(e) => {
                        if (disabled) return;
                        e.stopPropagation();
                        onRemove(band.id);
                    }}
                    style={{
                        marginTop: "12px",
                        fontSize: "9px",
                        color: "#ef4444",
                        background: "rgba(239, 68, 68, 0.1)",
                        border: "1px solid #ef4444",
                        borderRadius: "4px",
                        padding: "3px 8px",
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        opacity: isDraggingPosition || disabled ? 0 : 1,
                        transition: "all 0.2s ease",
                        fontWeight: "bold",
                    }}
                    onMouseEnter={disabled ? undefined : (e) => {
                        e.target.style.background = "rgba(239, 68, 68, 0.2)";
                        e.target.style.transform = "scale(1.05)";
                    }}
                    onMouseLeave={disabled ? undefined : (e) => {
                        e.target.style.background = "rgba(239, 68, 68, 0.1)";
                        e.target.style.transform = "scale(1)";
                    }}
                    disabled={disabled}
                >
                    Remove Band
                </button>
            )}
        </div>
    );
};

export default DraggableSlider;