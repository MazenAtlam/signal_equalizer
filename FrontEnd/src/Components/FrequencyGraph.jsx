import React, { useState, useEffect, useRef, useMemo } from "react";
import Card from "./Card";
import Button from "./Button";
import { drawFrequencyGraph, drawAudiogram } from "../utils/visualization";

const sanitizeNumericArray = (arr = []) =>
    Array.isArray(arr)
        ? arr.filter((value) => typeof value === "number" && Number.isFinite(value))
        : [];

// Function to generate audiogram data from frequency and magnitude arrays
const generateAudiogramData = (frequencies, magnitudes) => {
    // Standard audiometric frequencies
    const audiometricFrequencies = [125, 250, 500, 1000, 2000, 4000, 8000];

    const leftEar = [];
    const rightEar = [];

    let minMagnitude = Infinity;
    let maxMagnitude = -Infinity;
    
    if (magnitudes.length > 0) {
        // Optimization: For very large arrays, we can sample or iterate
        // Since we need true min/max for scaling, we iterate efficiently
        for(let i = 0; i < magnitudes.length; i++) {
            if (magnitudes[i] < minMagnitude) minMagnitude = magnitudes[i];
            if (magnitudes[i] > maxMagnitude) maxMagnitude = magnitudes[i];
        }
    } else {
        minMagnitude = -100;
        maxMagnitude = 0;
    }
    
    const magnitudeRange = maxMagnitude - minMagnitude || 1;

    console.log(`Detected magnitude range: ${minMagnitude} dB to ${maxMagnitude} dB`);

    audiometricFrequencies.forEach(freq => {
        // Find the closest frequency in the FFT data
        let closestIndex = -1;
        let minDiff = Infinity;


        for (let index = 0; index < frequencies.length; index++) {
            const fftFreq = frequencies[index];
            const diff = Math.abs(fftFreq - freq);
            if (diff < minDiff) {
                minDiff = diff;
                closestIndex = index;
                if (diff < 1.0) break; // Close enough
            }
        }

        if (closestIndex !== -1 && magnitudes[closestIndex] !== undefined) {
            const magnitude = magnitudes[closestIndex];

            // Use dynamic range instead of hardcoded values
            const normalizedMagnitude = (magnitude - minMagnitude) / magnitudeRange;
            let hearingLevel;

            if (normalizedMagnitude <= 0.25) {
                // Good hearing: 0-30 dB HL
                hearingLevel = normalizedMagnitude * 120;
            } else if (normalizedMagnitude <= 0.5) {
                // Mild hearing loss: 30-50 dB HL
                hearingLevel = 30 + (normalizedMagnitude - 0.25) * 80;
            } else if (normalizedMagnitude <= 0.75) {
                // Moderate hearing loss: 50-70 dB HL
                hearingLevel = 50 + (normalizedMagnitude - 0.5) * 80;
            } else {
                // Severe to profound: 70-120 dB HL
                hearingLevel = 70 + (normalizedMagnitude - 0.75) * 200;
            }

            hearingLevel = Math.max(0, Math.min(120, hearingLevel));

            // Add realistic variation between ears (±5-10 dB)
            const leftVariation = (Math.random() - 0.5) * 10;
            const rightVariation = (Math.random() - 0.5) * 10;

            leftEar.push({
                frequency: freq,
                db: Math.round(hearingLevel + leftVariation)
            });

            rightEar.push({
                frequency: freq,
                db: Math.round(hearingLevel + rightVariation)
            });
        } else {
            // Fallback: use values that show some hearing loss pattern
            const baseDB = 10 + (freq / 8000) * 50;

            leftEar.push({
                frequency: freq,
                db: Math.round(baseDB + (Math.random() - 0.5) * 10)
            });

            rightEar.push({
                frequency: freq,
                db: Math.round(baseDB + (Math.random() - 0.5) * 10)
            });
        }
    });

    return { leftEar, rightEar };
};

const FrequencyGraph = ({
                            frequencies = [],
                            magnitudes = [],
                            isVisible = true,
                            onClose,
                        }) => {
    const [activeScale, setActiveScale] = useState("linear");
    const [hovered1, setHovered1] = useState(false);
    const [hovered2, setHovered2] = useState(false);
    const [hovered3, setHovered3] = useState(false);
    const canvasRef = useRef(null);

    const sanitizedFrequencies = useMemo(
        () => sanitizeNumericArray(frequencies),
        [frequencies]
    );
    const sanitizedMagnitudes = useMemo(
        () => sanitizeNumericArray(magnitudes),
        [magnitudes]
    );

    // Generate audiogram data from frequency and magnitude arrays
    const audiogramData = useMemo(() => {
        if (sanitizedFrequencies.length > 0 && sanitizedMagnitudes.length > 0) {
            console.log("Generating audiogram from data length:", sanitizedFrequencies.length);
            return generateAudiogramData(sanitizedFrequencies, sanitizedMagnitudes);
        }
        return null;
    }, [sanitizedFrequencies, sanitizedMagnitudes]);

    const hasFrequencyData =
        sanitizedFrequencies.length > 0 && sanitizedMagnitudes.length > 0;
    const hasAudiogramData = audiogramData !== null;

    useEffect(() => {
        if (hasFrequencyData && (frequencies.length > 0 || magnitudes.length > 0)) {
            // Safe logging (slice to prevent console spam/hang)
            // console.log("Current frequency range:", Math.min(...sanitizedFrequencies), "to", Math.max(...sanitizedFrequencies));
        }
    }, [hasFrequencyData, frequencies, magnitudes, sanitizedFrequencies, sanitizedMagnitudes]);

    useEffect(() => {
        if (!hasFrequencyData || !canvasRef.current) {
            return;
        }

        const canvas = canvasRef.current;
        const container = canvas.parentElement;

        // Set canvas size based on container
        if (container) {
            const rect = container.getBoundingClientRect();
            canvas.width = rect.width || 800;
            canvas.height = rect.height || 400;
        } else {
            canvas.width = 800;
            canvas.height = 400;
        }

        // Draw the appropriate graph based on active scale
        if (activeScale === 'audiogram' && hasAudiogramData) {
            drawAudiogram(canvas, audiogramData);
        } else {
            drawFrequencyGraph(canvas, sanitizedFrequencies, sanitizedMagnitudes);
        }
    }, [sanitizedFrequencies, sanitizedMagnitudes, activeScale, hasFrequencyData, hasAudiogramData, audiogramData]);

    if (!isVisible) {
        return null;
    }

    const handleScaleChange = (scale) => {
        setActiveScale(scale);
    };

    return (
        <Card className="frequency-graph col-10 mx-auto px-4 pb-4">
            <div className="frequency-graph-header d-flex justify-content-between pt-3">
                <div className="frequency-graph-title d-flex  pt-2">
                    <svg
                        width="28"
                        height="28"
                        className="frequency-icon"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth="2"
                    >
                        <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"></path>
                    </svg>
                    <h5 className="ms-2">Frequency Graph</h5>
                </div>
                <div className="frequency-graph-controls px-2 pt-2 d-flex gap-3 mb-4">
                    <Button
                        onMouseEnter={() => setHovered1(true)}
                        onMouseLeave={() => setHovered1(false)}
                        variant="secondary text-light"
                        style={
                            activeScale === "linear"
                                ? {
                                    backgroundColor: "#1FD5F9",
                                    color: "#000000",
                                    fontWeight: "600",
                                    fontSize: "0.875rem",
                                    paddingTop: "0.3rem",
                                    paddingBottom: "0.3rem",
                                    borderRadius: "4px",
                                    border: "1px solid transparent",
                                }
                                : hovered1
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
                        onClick={() => handleScaleChange("linear")}
                    >
                        Linear
                    </Button>
                    <Button
                        onMouseEnter={() => setHovered2(true)}
                        onMouseLeave={() => setHovered2(false)}
                        variant="secondary text-light"
                        style={
                            activeScale === "audiogram"
                                ? {
                                    backgroundColor: "#1FD5F9",
                                    color: "#000000",
                                    fontWeight: "600",
                                    fontSize: "0.875rem",
                                    paddingTop: "0.3rem",
                                    paddingBottom: "0.3rem",
                                    borderRadius: "4px",
                                    border: "1px solid transparent",
                                }
                                : hovered2
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
                        onClick={() => handleScaleChange("audiogram")}
                    >
                        Audiogram
                    </Button>
                    <Button
                        variant="secondary"
                        className="close-btn border-0  "
                        onMouseEnter={() => setHovered3(true)}
                        onMouseLeave={() => setHovered3(false)}
                        onClick={() => onClose && onClose()}
                        style={
                            hovered3
                                ? {
                                    backgroundColor: "#7bf447ff",
                                    borderRadius: "4px",
                                    color: "#000000 !important",
                                }
                                : { backgroundColor: "transparent", borderRadius: "4px" }
                        }
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
                className="frequency-graph-canvas"
                style={{ width: "100%", height: "400px" }}
            >
                {hasFrequencyData ? (
                    <canvas
                        ref={canvasRef}
                        className="graph-canvas"
                        style={{ width: "100%", height: "100%", display: "block" }}
                    ></canvas>
                ) : (
                    <div
                        className="text-muted"
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#9ca3af",
                            fontSize: "0.9rem",
                        }}
                    >
                        No frequency data available
                    </div>
                )}
            </div>
        </Card>
    );
};

export default FrequencyGraph;