import React, { useState, useEffect, useRef } from "react";
import Card from "./Card";
import Button from "./Button";
import { drawSpectrogram } from "../utils/visualization";

const SpectrogramAnalyzer = ({
                               inputSpectrogram = [],
                               outputSpectrogram = [],
                               aiSpectrogram = [], // NEW: AI spectrogram data
                               inputSampleRate = 44100,
                               outputSampleRate = 44100,
                               aiSampleRate = 44100, // NEW: AI sample rate
                               inputDuration = 1,
                               outputDuration = 1,
                               aiDuration = 1, // NEW: AI duration
                               isVisible = true,
                               onClose,
                               showAIOutput = false, // NEW: Flag to show AI output
                             }) => {
  const [hovered, setHovered] = useState(false);
  const inputCanvasRef = useRef(null);
  const outputCanvasRef = useRef(null);
  const aiCanvasRef = useRef(null); // NEW: AI canvas ref

  // Calculate actual duration from spectrogram data
  const calculateSpectrogramDuration = (spectrogramData, sampleRate) => {
    if (!Array.isArray(spectrogramData) || spectrogramData.length === 0) {
      return 1; // Default fallback
    }

    // Spectrogram data is [frequency_bins][time_frames]
    const numTimeFrames = spectrogramData[0]?.length || 0;

    // Estimate duration based on typical spectrogram parameters
    // Assuming 1024 FFT size with 50% overlap (512 hop size)
    const hopSize = 512;
    const timePerFrame = hopSize / sampleRate;
    return numTimeFrames * timePerFrame;
  };

  const hasInputSpectrogram = Array.isArray(inputSpectrogram) && inputSpectrogram.length > 0;
  const hasOutputSpectrogram = Array.isArray(outputSpectrogram) && outputSpectrogram.length > 0;
  const hasAISpectrogram = Array.isArray(aiSpectrogram) && aiSpectrogram.length > 0; // NEW: Check AI data

  useEffect(() => {
    if (
        !hasInputSpectrogram &&
        Array.isArray(inputSpectrogram) &&
        inputSpectrogram.length > 0
    ) {
      console.warn("SpectrogramAnalyzer received invalid input spectrogram.");
    }
  }, [hasInputSpectrogram, inputSpectrogram]);

  // Input spectrogram effect
  useEffect(() => {
    if (!hasInputSpectrogram || !inputCanvasRef.current) {
      return;
    }

    if (hasInputSpectrogram && inputCanvasRef.current) {
      const canvas = inputCanvasRef.current;
      const container = canvas.parentElement;

      if (container) {
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width || 400;
        canvas.height = rect.height || 300;
      } else {
        canvas.width = 400;
        canvas.height = 300;
      }

      const actualInputDuration = calculateSpectrogramDuration(inputSpectrogram, inputSampleRate);
      drawSpectrogram(canvas, inputSpectrogram, inputSampleRate, actualInputDuration);
    }
  }, [inputSpectrogram, hasInputSpectrogram, inputSampleRate, inputDuration]);

  // Output spectrogram effect
  useEffect(() => {
    if (!hasOutputSpectrogram || !outputCanvasRef.current) {
      return;
    }

    if (hasOutputSpectrogram && outputCanvasRef.current) {
      const canvas = outputCanvasRef.current;
      const container = canvas.parentElement;

      if (container) {
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width || 400;
        canvas.height = rect.height || 300;
      } else {
        canvas.width = 400;
        canvas.height = 300;
      }

      const actualOutputDuration = calculateSpectrogramDuration(outputSpectrogram, outputSampleRate);
      drawSpectrogram(canvas, outputSpectrogram, outputSampleRate, actualOutputDuration);
    }
  }, [outputSpectrogram, hasOutputSpectrogram, outputSampleRate, outputDuration]);

  // NEW: AI spectrogram effect
  useEffect(() => {
    if (!hasAISpectrogram || !aiCanvasRef.current) {
      return;
    }

    if (hasAISpectrogram && aiCanvasRef.current) {
      const canvas = aiCanvasRef.current;
      const container = canvas.parentElement;

      if (container) {
        const rect = container.getBoundingClientRect();
        canvas.width = rect.width || 400;
        canvas.height = rect.height || 300;
      } else {
        canvas.width = 400;
        canvas.height = 300;
      }

      const actualAIDuration = calculateSpectrogramDuration(aiSpectrogram, aiSampleRate);
      drawSpectrogram(canvas, aiSpectrogram, aiSampleRate, actualAIDuration);
    }
  }, [aiSpectrogram, hasAISpectrogram, aiSampleRate, aiDuration]);

  if (!isVisible) {
    return null;
  }

  return (
      <Card className="spectrogram-analyzer col-10 mx-auto">
        <div className="d-flex justify-content-between pt-3 pe-4">
          <div className=" d-flex px-4 pt-2">
            <svg
                width="28"
                height="28"
                className="frequency-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2"
            >
              <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"></path>
              <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"></path>
              <circle cx="12" cy="12" r="2"></circle>
              <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"></path>
              <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"></path>
            </svg>
            <h5 className="ms-2">Spectrogram Viewers</h5>
          </div>

          <Button
              variant="secondary"
              className="close-btn border-0  "
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              onClick={() => onClose && onClose()}
              style={
                hovered
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
        <div className="spectrogram-grid d-flex gap-3 px-5 my-4 ">
          {/* Input Spectrogram Card */}
          <Card className="spectrogram-panel col-4 ">
            <h6 className="panel-title px-4 py-2">Input Spectrogram</h6>
            <div
                className="panel-content"
                style={{ width: "100%", height: "300px", position: "relative" }}
            >
              {hasInputSpectrogram ? (
                  <canvas
                      ref={inputCanvasRef}
                      className="spectrogram-canvas"
                      style={{ width: "100%", height: "100%", display: "block" }}
                  ></canvas>
              ) : (
                  <div
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
                    No input spectrogram data
                  </div>
              )}
            </div>
          </Card>

          {/* Output Spectrogram Card */}
          <Card className="spectrogram-panel col-4 ">
            <h5 className="panel-title px-4 py-2">Output Spectrogram</h5>
            <div
                className="panel-content"
                style={{ width: "100%", height: "300px", position: "relative" }}
            >
              {hasOutputSpectrogram ? (
                  <canvas
                      ref={outputCanvasRef}
                      className="spectrogram-canvas"
                      style={{ width: "100%", height: "100%", display: "block" }}
                  ></canvas>
              ) : (
                  <div
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
                    No output spectrogram data
                  </div>
              )}
            </div>
          </Card>

          {/* NEW: AI Output Spectrogram Card */}
          <Card className="spectrogram-panel col-4 ">
            <h5 className="panel-title px-4 py-2" style={{ color: "#7bf447ff" }}>
              AI Output Spectrogram
            </h5>
            <div
                className="panel-content"
                style={{ width: "100%", height: "300px", position: "relative" }}
            >
              {showAIOutput ? (
                  hasAISpectrogram ? (
                      <canvas
                          ref={aiCanvasRef}
                          className="spectrogram-canvas"
                          style={{ width: "100%", height: "100%", display: "block" }}
                      ></canvas>
                  ) : (
                      <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#1FD5F9",
                            fontSize: "0.9rem",
                            padding: "20px",
                            textAlign: "center",
                          }}
                      >
                        <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            width="48"
                            height="48"
                            className="mb-3"
                        >
                          <path d="M12 8V4H8"></path>
                          <rect width="16" height="12" x="4" y="8" rx="2"></rect>
                          <path d="M2 14h2"></path>
                          <path d="M20 14h2"></path>
                          <path d="M15 13v2"></path>
                          <path d="M9 13v2"></path>
                        </svg>
                        Waiting for AI Equalization...
                        <p style={{ color: "#9ca3af", fontSize: "0.8rem", marginTop: "10px" }}>
                          Click the "AI Equalize" button to process
                        </p>
                      </div>
                  )
              ) : (
                  <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#9ca3af",
                        fontSize: "0.9rem",
                        padding: "20px",
                        textAlign: "center",
                      }}
                  >
                    AI Output not available in current mode
                  </div>
              )}
            </div>
          </Card>
        </div>
      </Card>
  );
};

export default SpectrogramAnalyzer;