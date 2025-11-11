import React, { useState, useEffect, useRef } from "react";
import Card from "./Card";
import Button from "./Button";
import { drawSpectrogram } from "../utils/visualization";

const SpectrogramAnalyzer = ({ inputSpectrogram = [], outputSpectrogram = [], isVisible = true, onClose }) => {
  const [hovered, setHovered] = useState(false);
  const inputCanvasRef = useRef(null);
  const outputCanvasRef = useRef(null);

  if (!isVisible) {
    return null;
  }

  useEffect(() => {
    if (inputSpectrogram.length > 0 && inputCanvasRef.current) {
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

      drawSpectrogram(canvas, inputSpectrogram);
    }
  }, [inputSpectrogram]);

  useEffect(() => {
    if (outputSpectrogram.length > 0 && outputCanvasRef.current) {
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

      drawSpectrogram(canvas, outputSpectrogram);
    }
  }, [outputSpectrogram]);

  return (
    <Card className="spectrogram-analyzer">
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
        <Card className="spectrogram-panel col-6">
          <h6 className="panel-title px-4 py-2">Input Spectrogram</h6>
          <div className="panel-content" style={{ width: "100%", height: "300px", position: "relative" }}>
            <canvas
              ref={inputCanvasRef}
              className="spectrogram-canvas"
              style={{ width: "100%", height: "100%", display: "block" }}
            ></canvas>
          </div>
        </Card>
        <Card className="spectrogram-panel col-6">
          <h5 className="panel-title px-4 py-2">Output Spectrogram</h5>
          <div className="panel-content" style={{ width: "100%", height: "300px", position: "relative" }}>
            <canvas
              ref={outputCanvasRef}
              className="spectrogram-canvas"
              style={{ width: "100%", height: "100%", display: "block" }}
            ></canvas>
          </div>
        </Card>
      </div>
    </Card>
  );
};

export default SpectrogramAnalyzer;
