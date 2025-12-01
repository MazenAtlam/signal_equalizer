import React, { useState, useRef, useEffect, useCallback } from "react";
import Card from "./Card";
import Button from "./Button";
import Subdivision from "./Subdivision";
import { equalizeAudio, equalizeWithAI } from "../utils/api";
import { useToast } from "./Toast";

// Import the preset settings
import presetSettings from "../preset_settings/frequency_band.json";

const GenericEqualizer = ({
                              isVisible = true,
                              onClose,
                              frequencyArr,
                              signalId: propSignalId,
                              onEqualizerResponse,
                              onAIEqualizerResponse, // NEW: Add this prop
                              title = "Generic Equalizer",
                              mode = "generic",
                              selectedCategory = "Human Voices"
                          }) => {
    const [hovered1, setHovered1] = useState(false);
    const [hovered2, setHovered2] = useState(false);
    const [hovered3, setHovered3] = useState(false);
    const [hovered4, setHovered4] = useState(false);
    const [hovered5, setHovered5] = useState(false);
    const [height, setHeight] = useState(500);
    const [isDraggingHeight, setIsDraggingHeight] = useState(false);
    const [bands, setBands] = useState([]);
    const [presetBands, setPresetBands] = useState([]); // New state for preset bands
    const [signalId, setSignalId] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const timeoutRef = useRef(null);
    const containerRef = useRef(null);
    const { showToast } = useToast();

    // Mouse move handler for resizing
    const handleMouseMove = (e) => {
        if (isDraggingHeight && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            const newHeight = rect.bottom - e.clientY;
            setHeight(Math.max(200, Math.min(600, newHeight)));
        }
    };

    // Mouse up handler
    const handleMouseUp = () => {
        setIsDraggingHeight(false);
    };

    // Mouse down handler for resize handle
    const handleMouseDownResize = (e) => {
        e.preventDefault();
        setIsDraggingHeight(true);
    };

    // Add Band functionality - create a completely custom band
    const addBand = () => {
        const newBand = {
            id: `custom-${Date.now()}`,
            label: `Band ${bands.length + 1}`,
            value: 1, // Default to 1 (no change) in linear scale
            min: 0,   // Minimum linear gain (0 = mute)
            max: 4,   // Maximum linear gain (4 = 4x boost)
            position: 50, // Default position in the middle
            bandwidth: 1, // Default bandwidth
        };
        setBands((prevBands) => [...prevBands, newBand]);
        showToast(`New band added at ${bands.length > 0 ? "middle frequency" : "center"}`, "success");
    };

    // Remove Band functionality
    const removeBand = (id) => {
        if (bands.length > 0) {
            setBands((prevBands) => prevBands.filter((band) => band.id !== id));
            showToast("Band removed", "info");
        }
    };

    // Handle slider value change
    const handleSliderChange = (id, value) => {
        setBands((prevBands) =>
            prevBands.map((band) =>
                band.id === id ? { ...band, value: value[0] } : band
            )
        );
    };

    // Handle band position change
    const handleBandPositionChange = (bandId, newPosition) => {
        setBands((prevBands) =>
            prevBands.map((band) =>
                band.id === bandId ? { ...band, position: newPosition } : band
            )
        );
    };

    // Handle band bandwidth change
    const handleBandBandwidthChange = (bandId, newBandwidth) => {
        setBands((prevBands) =>
            prevBands.map((band) =>
                band.id === bandId ? { ...band, bandwidth: newBandwidth } : band
            )
        );
    };

    // Reset all bands - clear all bands
    const resetAllBands = () => {
        setBands([]);
        showToast("All bands cleared", "info");
    };

    // Calculate dynamic frequency range from frequencyArr
    const getDynamicFrequencyRange = useCallback(() => {
        if (!frequencyArr || frequencyArr.length === 0) {
            // Fallback to default range if no frequency data
            return { minFreq: 20, maxFreq: 20000 };
        }

        // Filter out any invalid frequencies and get min/max
        const validFrequencies = frequencyArr.filter(freq =>
            typeof freq === 'number' && freq > 0 && isFinite(freq)
        );

        if (validFrequencies.length === 0) {
            return { minFreq: 20, maxFreq: 20000 };
        }

        const minFreq = Math.max(20, Math.min(...validFrequencies)); // At least 20Hz
        const maxFreq = Math.min(20000, Math.max(...validFrequencies)); // At most 20kHz

        console.log("Dynamic frequency range:", { minFreq, maxFreq, source: 'uploaded audio' });
        return { minFreq, maxFreq };
    }, [frequencyArr]);

    // Convert bands to equalizer scheme format - UPDATED: Use linear gain directly
    const bandsToEqualizerScheme = useCallback((bands) => {
        const { minFreq, maxFreq } = getDynamicFrequencyRange();
        const minLog = Math.log10(minFreq);
        const maxLog = Math.log10(maxFreq);

        const positionToFreq = (position) => {
            const freqLog = minLog + (position / 100) * (maxLog - minLog);
            return Math.pow(10, freqLog);
        };

        return bands.map((band) => {
            // Use the actual band position and bandwidth
            const centerFreq = positionToFreq(band.position);
            const bandwidth = band.bandwidth || 1;

            const centerLog = Math.log10(centerFreq);
            const range = (maxLog - minLog) * (bandwidth * 0.02);

            const startFrequency = Math.max(minFreq, Math.pow(10, centerLog - range));
            const endFrequency = Math.min(maxFreq, Math.pow(10, centerLog + range));

            // Use the linear gain value directly (0 to 4 scale)
            const linearGain = band.value;

            return {
                freq_start_hz: Math.round(startFrequency),
                freq_end_hz: Math.round(endFrequency),
                scale_factor: linearGain
            };
        });
    }, [getDynamicFrequencyRange]);

    // NEW: Handle preset slider change
    const handlePresetSliderChange = (presetId, value) => {
        setPresetBands(prevPresetBands =>
            prevPresetBands.map(preset =>
                preset.id === presetId ? { ...preset, value: value[0] } : preset
            )
        );

        // Apply the preset gain to all bands within the preset frequency range
        const preset = presetBands.find(p => p.id === presetId);
        if (preset) {
            setBands(prevBands =>
                prevBands.map(band => {
                    const bandCenterFreq = positionToFreq(band.position);
                    if (bandCenterFreq >= preset.start_frequency && bandCenterFreq <= preset.end_frequency) {
                        return { ...band, value: value[0] };
                    }
                    return band;
                })
            );
        }
    };

    // NEW: Convert position to frequency for preset application
    const positionToFreq = (position) => {
        const { minFreq, maxFreq } = getDynamicFrequencyRange();
        const minLog = Math.log10(minFreq);
        const maxLog = Math.log10(maxFreq);
        const freqLog = minLog + (position / 100) * (maxLog - minLog);
        return Math.pow(10, freqLog);
    };

    // NEW: AI Equalize function
    const handleAIEqualize = async () => {
        if (!signalId) {
            showToast("Please upload an audio file first", "error");
            return;
        }

        // Map category to backend preset name
        const presetMap = {
            "Human Voices": "human",
            "Musical Instruments": "musical",
            "Animal Sounds": "animal"
        };

        const backendPreset = presetMap[selectedCategory];

        if (!backendPreset) {
            showToast("AI Equalize is not supported for this category", "error");
            return;
        }

        // Format equalizer scheme from preset bands
        const equalizerScheme = presetBands.map(band => ({
            name: band.label,
            value: band.value
        }));

        try {
            setIsProcessing(true);
            const result = await equalizeWithAI(signalId, backendPreset, equalizerScheme);

            // Log the response as requested
            console.log("AI Equalize API Response:", result);

            // FIXED: Use onAIEqualizerResponse instead of props.onAIEqualizerResponse
            if (onAIEqualizerResponse) {
                onAIEqualizerResponse(result);
            }

            showToast("AI Equalization applied successfully", "success");

        } catch (error) {
            console.error("AI Equalization failed:", error);
            showToast(`AI Equalization failed: ${error.message}`, "error");
        } finally {
            setIsProcessing(false);
        }
    };

    // Send equalizer request to API
    const sendEqualizerRequest = useCallback(async (bands) => {
        if (!signalId) {
            console.warn("No signal ID available for equalizer request");
            showToast("Please upload an audio file first", "error");
            return;
        }

        if (bands.length === 0) {
            showToast("Please add at least one band to apply equalizer settings", "warning");
            return;
        }

        try {
            setIsProcessing(true);
            const equalizerScheme = bandsToEqualizerScheme(bands);

            console.log("Sending equalizer request:", {
                signal_id: signalId,
                count: equalizerScheme.length,
                equalizer_scheme: equalizerScheme
            });

            const result = await equalizeAudio(signalId, equalizerScheme);

            // Handle the result - pass to parent component
            console.log("Equalizer applied successfully:", result);

            // Call the callback with the equalized data
            if (onEqualizerResponse) {
                onEqualizerResponse(result);
            }

            showToast("Equalizer applied successfully", "success");

        } catch (error) {
            console.error("Failed to apply equalizer:", error);
            showToast("Failed to apply equalizer settings", "error");
        } finally {
            setIsProcessing(false);
        }
    }, [signalId, bandsToEqualizerScheme, showToast, onEqualizerResponse]);

    // Add drag state management
    const handleDragStart = useCallback(() => {
        setIsDragging(true);
        // Clear any pending timeouts when starting new interaction
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);

        // Clear any existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Call sendEqualizerRequest after 100ms, but only if we have bands and signalId
        timeoutRef.current = setTimeout(() => {
            if (bands.length > 0 && signalId) {
                sendEqualizerRequest(bands);
            }
        }, 100);
    }, [bands, signalId, sendEqualizerRequest]);

    // NEW: Load preset settings based on category
    const loadPresetSettings = useCallback(() => {
        let presetData = [];

        switch (selectedCategory) {
            case "Human Voices":
                presetData = presetSettings.human || [];
                break;
            case "Animal Sounds":
                presetData = presetSettings.animal || [];
                break;
            case "Musical Instruments":
                presetData = presetSettings.musical || [];
                break;
            default:
                presetData = [];
        }

        const formattedPresets = presetData.map((preset, index) => ({
            id: `preset-${index}`,
            label: preset.name,
            value: 1, // Default gain
            min: 0,
            max: 4,
            start_frequency: preset.start_frequency,
            end_frequency: preset.end_frequency
        }));

        setPresetBands(formattedPresets);
        showToast(`Loaded ${selectedCategory} preset settings`, "success");
    }, [selectedCategory, showToast]);

    // Set up global mouseup listener for drag end detection
    useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (isDragging) {
                handleDragEnd();
            }
        };

        document.addEventListener("mouseup", handleGlobalMouseUp);
        return () => {
            document.removeEventListener("mouseup", handleGlobalMouseUp);
        };
    }, [isDragging, handleDragEnd]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    // Add global event listeners for resize
    useEffect(() => {
        if (isDraggingHeight) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);

            return () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
            };
        }
    }, [isDraggingHeight]);

    // Use prop signalId if provided, otherwise try localStorage
    useEffect(() => {
        if (propSignalId) {
            setSignalId(propSignalId);
        } else {
            const currentSignalId = localStorage.getItem('currentSignalId');
            if (currentSignalId) {
                setSignalId(currentSignalId);
            }
        }
    }, [propSignalId]);

    // NEW: Load preset settings when component mounts or category changes
    useEffect(() => {
        if (mode === "customized") {
            loadPresetSettings();
        }
    }, [mode, selectedCategory, loadPresetSettings]);

    if (!isVisible) {
        return null;
    }

    // NEW: Check if AI Equalize button should be enabled
    const isAIEqualizeEnabled = mode === "customized" &&
        (selectedCategory === "Human Voices" || selectedCategory === "Musical Instruments");

    return (
        <div
            ref={containerRef}
            style={{
                ...styles.stickyWrapper,
                height: `${height}px`,
            }}
        >
            {/* Resize Handle */}
            <div
                style={styles.resizeHandle}
                onMouseDown={handleMouseDownResize}
                className={isDraggingHeight ? "resizing" : ""}
            >
                <div style={styles.resizeIndicator}>···</div>
            </div>

            <Card
                className="generic-equalizer col-10 mx-auto px-4 h-full pb-4"
                style={{
                    ...styles.card,
                    height: "inherit",
                }}
            >
                <div className="equalizer-header d-flex justify-content-between pt-3">
                    <div className="equalizer-title d-flex pt-2">
                        <svg
                            className="equalizer-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            width="28"
                            height="28"
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
                        <h5 className="ms-2">
                            {title}
                            {isProcessing && <span style={styles.processingIndicator}>Processing...</span>}
                            {isDragging && <span style={styles.draggingIndicator}>Dragging... release to apply</span>}
                            {bands.length === 0 && <span style={styles.noBandsIndicator}> - Add your first band to start</span>}
                        </h5>
                    </div>
                    <div className="equalizer-controls px-2 pt-2 d-flex gap-3 mb-4">
                        {/* AI Equalize Button - Only in Customized Mode */}
                        {mode === "customized" ? (
                            <Button
                                onMouseEnter={() => setHovered1(true)}
                                onMouseLeave={() => setHovered1(false)}
                                variant="secondary text-light"
                                style={
                                    hovered1 && isAIEqualizeEnabled
                                        ? {
                                            backgroundColor: "#7bf447ff",
                                            color: "#000000",
                                            fontWeight: "600",
                                            fontSize: "0.875rem",
                                            paddingTop: "0.3rem",
                                            paddingBottom: "0.3rem",
                                            borderRadius: "4px",
                                            border: "1px solid transparent",
                                        }
                                        : {
                                            backgroundColor: isAIEqualizeEnabled ? "#1FD5F9" : "#6B7280",
                                            color: isAIEqualizeEnabled ? "#000000" : "#FFFFFF",
                                            fontWeight: "600",
                                            fontSize: "0.875rem",
                                            paddingTop: "0.3rem",
                                            paddingBottom: "0.3rem",
                                            borderRadius: "4px",
                                            border: "1px solid transparent",
                                            cursor: isAIEqualizeEnabled ? "pointer" : "not-allowed",
                                        }
                                }
                                onClick={handleAIEqualize}
                                disabled={!isAIEqualizeEnabled || isProcessing}
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    width="16"
                                    height="16"
                                    className="me-2"
                                >
                                    <path d="M12 8V4H8"></path>
                                    <rect width="16" height="12" x="4" y="8" rx="2"></rect>
                                    <path d="M2 14h2"></path>
                                    <path d="M20 14h2"></path>
                                    <path d="M15 13v2"></path>
                                    <path d="M9 13v2"></path>
                                </svg>
                                AI Equalize
                            </Button>
                        ) : (
                            /* Upload Setting Button - Only in Generic Mode */
                            <Button
                                onMouseEnter={() => setHovered1(true)}
                                onMouseLeave={() => setHovered1(false)}
                                variant="secondary text-light"
                                style={
                                    hovered1
                                        ? {
                                            backgroundColor: "#7bf447ff",
                                            color: "#000000",
                                            fontWeight: "600",
                                            fontSize: "0.875rem",
                                            paddingTop: "0.3rem",
                                            paddingBottom: "0.3rem",
                                            borderRadius: "4px",
                                            border: "1px solid transparent",
                                        }
                                        : {
                                            backgroundColor: "#111317",
                                            color: "#FFFFFF",
                                            fontWeight: "600",
                                            fontSize: "0.875rem",
                                            paddingTop: "0.3rem",
                                            paddingBottom: "0.3rem",
                                            borderRadius: "4px",
                                            border: "1px solid transparent",
                                        }
                                }
                                onClick={() =>
                                    document.getElementById("settings-upload")?.click()
                                }
                                disabled={isProcessing}
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    width="16"
                                    height="16"
                                    className="me-2"
                                >
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="17 8 12 3 7 8"></polyline>
                                    <line x1="12" x2="12" y1="3" y2="15"></line>
                                </svg>
                                Upload Setting
                            </Button>
                        )}
                        <input
                            id="settings-upload"
                            type="file"
                            accept=".json"
                            style={{ display: "none" }}
                        />

                        {/* Add Band Button - Primary action */}
                        <Button
                            onMouseEnter={() => setHovered2(true)}
                            onMouseLeave={() => setHovered2(false)}
                            variant="secondary text-light"
                            style={
                                hovered2
                                    ? {
                                        backgroundColor: "#7bf447ff",
                                        color: "#000000",
                                        fontWeight: "600",
                                        fontSize: "0.875rem",
                                        paddingTop: "0.3rem",
                                        paddingBottom: "0.3rem",
                                        borderRadius: "4px",
                                        border: "1px solid transparent",
                                    }
                                    : {
                                        backgroundColor: "#1FD5F9",
                                        color: "#000000",
                                        fontWeight: "600",
                                        fontSize: "0.875rem",
                                        paddingTop: "0.3rem",
                                        paddingBottom: "0.3rem",
                                        borderRadius: "4px",
                                        border: "1px solid transparent",
                                    }
                            }
                            onClick={addBand}
                            disabled={isProcessing}
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                width="16"
                                height="16"
                                className="me-2"
                            >
                                <path d="M5 12h14"></path>
                                <path d="M12 5v14"></path>
                            </svg>
                            Add Band
                        </Button>

                        {/* Reset All Button - Now clears all bands */}
                        <Button
                            onMouseEnter={() => setHovered3(true)}
                            onMouseLeave={() => setHovered3(false)}
                            variant="secondary text-light"
                            style={
                                hovered3
                                    ? {
                                        backgroundColor: "#7bf447ff",
                                        color: "#000000",
                                        fontWeight: "600",
                                        fontSize: "0.875rem",
                                        paddingTop: "0.3rem",
                                        paddingBottom: "0.3rem",
                                        borderRadius: "4px",
                                        border: "1px solid transparent",
                                    }
                                    : {
                                        backgroundColor: "#111317",
                                        color: "#FFFFFF",
                                        fontWeight: "600",
                                        fontSize: "0.875rem",
                                        paddingTop: "0.3rem",
                                        paddingBottom: "0.3rem",
                                        borderRadius: "4px",
                                        border: "1px solid transparent",
                                    }
                            }
                            onClick={resetAllBands}
                            disabled={isProcessing || bands.length === 0}
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                width="16"
                                height="16"
                                className="me-2"
                            >
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                                <path d="M3 3v5h5"></path>
                            </svg>
                            Clear All
                        </Button>

                        {/* Save Scheme Button */}
                        <Button
                            onMouseEnter={() => setHovered4(true)}
                            onMouseLeave={() => setHovered4(false)}
                            variant="secondary text-light"
                            style={
                                hovered4
                                    ? {
                                        backgroundColor: "#7bf447ff",
                                        color: "#000000",
                                        fontWeight: "600",
                                        fontSize: "0.875rem",
                                        paddingTop: "0.3rem",
                                        paddingBottom: "0.3rem",
                                        borderRadius: "4px",
                                        border: "1px solid transparent",
                                    }
                                    : {
                                        backgroundColor: "#111317",
                                        color: "#FFFFFF",
                                        fontWeight: "600",
                                        fontSize: "0.875rem",
                                        paddingTop: "0.3rem",
                                        paddingBottom: "0.3rem",
                                        borderRadius: "4px",
                                        border: "1px solid transparent",
                                    }
                            }
                            disabled={isProcessing || bands.length === 0}
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                width="16"
                                height="16"
                                className="me-2"
                            >
                                <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"></path>
                                <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"></path>
                                <path d="M7 3v4a1 1 0 0 0 1 1h7"></path>
                            </svg>
                            Save Scheme
                        </Button>

                        {/* Close Button */}
                        <Button
                            variant="secondary"
                            className="close-btn border-0"
                            onMouseEnter={() => setHovered5(true)}
                            onMouseLeave={() => setHovered5(false)}
                            onClick={() => onClose && onClose()}
                            style={
                                hovered5
                                    ? {
                                        backgroundColor: "#7bf447ff",
                                        borderRadius: "4px",
                                        color: "#000000 !important",
                                    }
                                    : { backgroundColor: "transparent", borderRadius: "4px" }
                            }
                            disabled={isProcessing}
                        >
                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#fff"
                                strokeWidth="2"
                                width="16"
                                height="16"
                            >
                                <path d="M18 6 6 18"></path>
                                <path d="m6 6 12 12"></path>
                            </svg>
                        </Button>
                    </div>
                </div>
                <div
                    className="equalizer-canvas px-3"
                    style={{
                        width: "100%",
                        height: `calc(100% - 80px)`,
                        position: "relative",
                        overflow: "auto",
                    }}
                >
                    {/* NEW: Preset sidebar for customized mode */}
                    {mode === "customized" && presetBands.length > 0 && (
                        <div style={styles.presetSidebar}>
                            <h6 style={styles.presetTitle}>Preset Settings</h6>
                            <div style={styles.presetList}>
                                {presetBands.map((preset) => (
                                    <div key={preset.id} style={styles.presetItem}>
                                        <div style={styles.presetHeader}>
                                            <span style={styles.presetLabel}>{preset.label}</span>
                                            <span style={styles.presetValue}>{preset.value.toFixed(2)}x</span>
                                        </div>
                                        <div style={styles.presetSliderContainer}>
                                            <div
                                                style={{
                                                    ...styles.presetSliderTrack,
                                                    background: `linear-gradient(to right, #1FD5F9 0%, #1FD5F9 ${((preset.value - preset.min) / (preset.max - preset.min)) * 100}%, #333 ${((preset.value - preset.min) / (preset.max - preset.min)) * 100}%, #333 100%)`
                                                }}
                                                onClick={(e) => {
                                                    if (isProcessing) return;
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    const percentage = (e.clientX - rect.left) / rect.width;
                                                    const newValue = preset.min + percentage * (preset.max - preset.min);
                                                    const clampedValue = Math.max(preset.min, Math.min(preset.max, newValue));
                                                    handlePresetSliderChange(preset.id, [clampedValue]);
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        ...styles.presetSliderThumb,
                                                        left: `${((preset.value - preset.min) / (preset.max - preset.min)) * 100}%`
                                                    }}
                                                    onMouseDown={(e) => {
                                                        if (isProcessing) return;
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        const startX = e.clientX;
                                                        const startValue = preset.value;

                                                        const handleMouseMove = (moveEvent) => {
                                                            const deltaX = moveEvent.clientX - startX;
                                                            const sensitivity = 0.5;
                                                            const valueChange = (deltaX / 100) * sensitivity;
                                                            const newValue = startValue + valueChange;
                                                            const clampedValue = Math.max(preset.min, Math.min(preset.max, newValue));
                                                            handlePresetSliderChange(preset.id, [clampedValue]);
                                                        };

                                                        const handleMouseUp = () => {
                                                            document.removeEventListener("mousemove", handleMouseMove);
                                                            document.removeEventListener("mouseup", handleMouseUp);
                                                        };

                                                        document.addEventListener("mousemove", handleMouseMove);
                                                        document.addEventListener("mouseup", handleMouseUp);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div style={styles.presetFreqRange}>
                                            {preset.start_frequency}Hz - {preset.end_frequency}Hz
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Main equalizer content */}
                    <div style={mode === "customized" ? styles.mainContentWithSidebar : styles.mainContent}>
                        {/* Loading overlay */}
                        {isProcessing && (
                            <div style={styles.loadingOverlay}>
                                <div style={styles.loadingSpinner}></div>
                                <div style={styles.loadingText}>Processing equalizer settings...</div>
                            </div>
                        )}

                        {/* Empty state when no bands */}
                        {bands.length === 0 && !isProcessing && (
                            <div style={styles.emptyState}>
                                <div style={styles.emptyStateIcon}>
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        width="48"
                                        height="48"
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
                                </div>
                                <h4 style={styles.emptyStateTitle}>No Bands Added</h4>
                                <p style={styles.emptyStateText}>
                                    Click the "Add Band" button to create your first equalizer band.
                                    Drag it to position, adjust gain (0-4 linear scale) and bandwidth as needed.
                                </p>
                                <Button
                                    variant="secondary"
                                    onClick={addBand}
                                    style={{
                                        backgroundColor: "#1FD5F9",
                                        color: "#000000",
                                        fontWeight: "600",
                                        padding: "10px 20px",
                                        borderRadius: "6px",
                                        border: "none",
                                    }}
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        width="16"
                                        height="16"
                                        className="me-2"
                                    >
                                        <path d="M5 12h14"></path>
                                        <path d="M12 5v14"></path>
                                    </svg>
                                    Add Your First Band
                                </Button>
                            </div>
                        )}

                        {/* Update the Subdivision component to pass frequencyArr and disabled state */}
                        {bands.length > 0 && (
                            <Subdivision
                                bands={bands}
                                onBandChange={handleSliderChange}
                                onBandPositionChange={handleBandPositionChange}
                                onBandBandwidthChange={handleBandBandwidthChange}
                                onRemoveBand={removeBand}
                                bandsPosition="below"
                                orientation="vertical"
                                onDragStart={handleDragStart}
                                frequencyArr={frequencyArr}
                                disabled={isProcessing}
                            />
                        )}
                        {!signalId && (
                            <div style={styles.noSignalWarning}>
                                No audio signal loaded. Please upload an audio file first.
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
};

const styles = {
    stickyWrapper: {
        position: "fixed",
        bottom: "0",
        left: "0",
        right: "0",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        transition: "height 0.1s ease",
    },
    card: {
        boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.3)",
        marginBottom: "0",
        position: "relative",
        overflow: "auto",
        borderBottomLeftRadius: "0",
        borderBottomRightRadius: "0",
        width: "91.666%",
        height: "100%",
    },
    resizeHandle: {
        position: "absolute",
        top: "0",
        left: "0",
        right: "0",
        height: "12px",
        cursor: "ns-resize",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "transparent",
        transition: "background-color 0.2s",
        zIndex: 10,
    },
    resizeIndicator: {
        color: "#666",
        fontSize: "16px",
        fontWeight: "bold",
        userSelect: "none",
    },
    processingIndicator: {
        fontSize: "0.75rem",
        color: "#1FD5F9",
        marginLeft: "10px",
        fontStyle: "italic",
    },
    draggingIndicator: {
        fontSize: "0.75rem",
        color: "#7bf447",
        marginLeft: "10px",
        fontStyle: "italic",
    },
    noBandsIndicator: {
        fontSize: "0.75rem",
        color: "#9CA3AF",
        marginLeft: "10px",
        fontStyle: "italic",
    },
    noSignalWarning: {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        color: "#ef4444",
        textAlign: "center",
        fontSize: "0.9rem",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        padding: "10px 20px",
        borderRadius: "8px",
        border: "1px solid #ef4444",
    },
    loadingOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(26, 26, 26, 0.8)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        borderRadius: "8px",
    },
    loadingSpinner: {
        width: "40px",
        height: "40px",
        border: "4px solid rgba(31, 213, 249, 0.3)",
        borderTop: "4px solid #1FD5F9",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
    },
    loadingText: {
        marginTop: "16px",
        color: "#1FD5F9",
        fontSize: "0.9rem",
        fontWeight: "500",
    },
    emptyState: {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        textAlign: "center",
        color: "#9CA3AF",
        maxWidth: "400px",
        padding: "20px",
    },
    emptyStateIcon: {
        marginBottom: "20px",
        color: "#4B5563",
    },
    emptyStateTitle: {
        fontSize: "1.25rem",
        fontWeight: "600",
        marginBottom: "12px",
        color: "#D1D5DB",
    },
    emptyStateText: {
        fontSize: "0.9rem",
        lineHeight: "1.5",
        marginBottom: "20px",
        color: "#9CA3AF",
    },
    // NEW: Styles for preset sidebar
    presetSidebar: {
        position: "absolute",
        left: "0",
        top: "0",
        bottom: "0",
        width: "250px",
        backgroundColor: "#111317",
        borderRight: "1px solid #2A2E36",
        padding: "15px",
        overflowY: "auto",
        zIndex: 5,
    },
    presetTitle: {
        color: "#1FD5F9",
        marginBottom: "15px",
        fontSize: "0.9rem",
        fontWeight: "600",
        textAlign: "center",
    },
    presetList: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },
    presetItem: {
        backgroundColor: "#1A1D23",
        borderRadius: "6px",
        padding: "10px",
        border: "1px solid #2A2E36",
    },
    presetHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "8px",
    },
    presetLabel: {
        color: "#FFFFFF",
        fontSize: "0.8rem",
        fontWeight: "600",
        textTransform: "capitalize",
    },
    presetValue: {
        color: "#1FD5F9",
        fontSize: "0.75rem",
        fontWeight: "600",
    },
    presetSliderContainer: {
        marginBottom: "6px",
    },
    presetSliderTrack: {
        position: "relative",
        height: "6px",
        borderRadius: "3px",
        cursor: "pointer",
    },
    presetSliderThumb: {
        position: "absolute",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: "12px",
        height: "12px",
        backgroundColor: "#FFFFFF",
        borderRadius: "50%",
        cursor: "grab",
    },
    presetFreqRange: {
        color: "#9CA3AF",
        fontSize: "0.7rem",
        textAlign: "center",
    },
    mainContent: {
        position: "relative",
        width: "100%",
        height: "100%",
    },
    mainContentWithSidebar: {
        position: "relative",
        width: "calc(100% - 250px)",
        height: "100%",
        marginLeft: "250px",
    },
};

// Add CSS for better resize experience and spinner animation
const resizeStyles = `
  .resizing {
    background-color: rgba(123, 244, 71, 0.2) !important;
  }
  
  .resizing .resize-indicator {
    color: #7bf447;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Inject styles
if (typeof document !== "undefined") {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = resizeStyles;
    document.head.appendChild(styleSheet);
}

export default GenericEqualizer;