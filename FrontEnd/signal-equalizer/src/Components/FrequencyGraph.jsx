import React, { useState, useEffect, useRef } from "react";
import Card from "./Card";
import Button from "./Button";
import { drawFrequencyGraph } from "../utils/visualization";

const FrequencyGraph = ({ frequencies = [], magnitudes = [], isVisible = true, onClose }) => {
  const [activeScale, setActiveScale] = useState("linear");
  const [hovered1, setHovered1] = useState(false);
  const [hovered2, setHovered2] = useState(false);
  const [hovered3, setHovered3] = useState(false);
  const canvasRef = useRef(null);

  if (!isVisible) {
    return null;
  }

  useEffect(() => {
    if (frequencies.length > 0 && magnitudes.length > 0 && canvasRef.current) {
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

      // Draw the frequency graph
      drawFrequencyGraph(canvas, frequencies, magnitudes, activeScale);
    }
  }, [frequencies, magnitudes, activeScale]);

  const handleScaleChange = (scale) => {
    setActiveScale(scale);
  };

  return (
    <Card className="frequency-graph">
      <div className="frequency-graph-header d-flex justify-content-between pt-3">
        <div className="frequency-graph-title d-flex px-4 pt-2">
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
        <div className="frequency-graph-controls px-4 pt-2 d-flex gap-3">
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
      <div className="frequency-graph-canvas" style={{ width: "100%", height: "400px" }}>
        <canvas
          ref={canvasRef}
          className="graph-canvas"
          style={{ width: "100%", height: "100%", display: "block" }}
        ></canvas>
      </div>
    </Card>
  );
};

export default FrequencyGraph;
