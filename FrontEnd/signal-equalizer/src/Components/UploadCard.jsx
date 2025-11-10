// UploadCard.jsx
import React from "react";
import Card from "./Card";
import Button from "./Button";

const UploadCard = () => {
  return (
    <Card className="p-4">
      <div className="upload-area">
        <label htmlFor="audio-upload" className="upload-label">
          <div className="upload-box">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="upload-icon"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" x2="12" y1="3" y2="15"></line>
            </svg>
            <span className="font-medium">Choose File</span>
          </div>
        </label>
        <input
          id="audio-upload"
          type="file"
          accept="audio/*"
          className="file-input-hidden"
        />
        <span className="text-muted-foreground">or</span>
        <Button
          variant="secondary"
          style={{
            backgroundColor: "#1FD5F9",
            border: "1px solid transparent",
            borderRadius: "4px",
            color: "#000000",
            paddingTop: "0.3rem",
            paddingBottom: "0.3rem",
            fontWeight: "600",
            fontSize: "0.875rem",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5 mx-2"
          >
            <path d="M17.5 22h.5a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3"></path>
            <path d="M14 2v4a2 2 0 0 0 2 2h4"></path>
            <path d="M2 19a2 2 0 1 1 4 0v1a2 2 0 1 1-4 0v-4a6 6 0 0 1 12 0v4a2 2 0 1 1-4 0v-1a2 2 0 1 1 4 0"></path>
          </svg>
          Load Sample Data
        </Button>
      </div>
    </Card>
  );
};

export default UploadCard;
