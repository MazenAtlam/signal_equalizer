import React from "react";
import Card from "./Card";
import Button from "./Button";
import PanelControls from "./PanelControls";
import { useState } from "react";

const AudioPlayer = () => {
  const [hovered, setHovered] = useState(false);
  return (
    <Card className="audio-player">
      <div className="audio-player-header d-flex justify-content-between pt-3 pe-4">
        <div className="audio-player-title d-flex px-4 pt-2">
          <svg
            className="audio-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="2"
            width="28"
            height="28"
          >
            <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"></path>
          </svg>
          <h5 className="ms-2">Audio Playbacks</h5>
        </div>
        <Button
          variant="secondary"
          className="close-btn border-0  "
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
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
      <div className="audio-players-grid px-4 d-flex gap-3 my-4">
        <Card className="audio-panel col-6">
          <h4 className="panel-title px-4 py-2">Input Audio</h4>
          <PanelControls type="audio" />
        </Card>
        <Card className="audio-panel col-6">
          <h4 className="panel-title px-4 py-2">Output Audio</h4>
          <PanelControls type="audio" />
        </Card>
      </div>
    </Card>
  );
};

export default AudioPlayer;
