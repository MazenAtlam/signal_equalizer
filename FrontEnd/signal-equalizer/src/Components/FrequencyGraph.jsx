import React, { useState } from "react";
import Card from "./Card";
import Button from "./Button";

const FrequencyGraph = () => {
  const [activeScale, setActiveScale] = useState("linear");
  const [hovered1, setHovered1] = useState(false);
  const [hovered2, setHovered2] = useState(false);
  const [hovered3, setHovered3] = useState(false);

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
            onClick={() => setActiveScale("linear")}
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
            onClick={() => setActiveScale("audiogram")}
          >
            Audiogram
          </Button>
          <Button
            variant="secondary"
            className="close-btn border-0  "
            onMouseEnter={() => setHovered3(true)}
            onMouseLeave={() => setHovered3(false)}
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
      <div className="frequency-graph-canvas">
        <canvas className="graph-canvas"></canvas>
      </div>
    </Card>
  );
};

export default FrequencyGraph;
