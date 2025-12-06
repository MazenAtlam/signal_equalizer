import React, { useState, useEffect, useRef } from "react";
import Card from "./Card";
import Button from "./Button";
import PanelControls from "./PanelControls";

const AudioPlayer = ({
                       inputAudioURL,
                       outputAudioURL,
                       aiAudioURL, // NEW: AI audio URL
                       inputDuration = 0,
                       outputDuration = 0,
                       aiDuration = 0, // NEW: AI audio duration
                       onPlaybackUpdate,
                       isVisible = true,
                       onClose,
                       showAIOutput = false, // NEW: Flag to show AI output
                     }) => {
  const [hovered, setHovered] = useState(false);
  const [inputState, setInputState] = useState({
    isPlaying: false,
    currentTime: 0,
    duration: inputDuration,
    playbackRate: 1.0,
    error: null,
  });
  const [outputState, setOutputState] = useState({
    isPlaying: false,
    currentTime: 0,
    duration: outputDuration,
    playbackRate: 1.0,
    error: null,
  });
  const [aiState, setAIState] = useState({ // NEW: AI audio state
    isPlaying: false,
    currentTime: 0,
    duration: aiDuration,
    playbackRate: 1.0,
    error: null,
  });

  const inputAudioRef = useRef(null);
  const outputAudioRef = useRef(null);
  const aiAudioRef = useRef(null); // NEW: AI audio ref
  const inputAudioURLRef = useRef(inputAudioURL);
  const outputAudioURLRef = useRef(outputAudioURL);
  const aiAudioURLRef = useRef(aiAudioURL); // NEW: AI audio URL ref

  // Input audio effect
  useEffect(() => {
    if (!isVisible || !inputAudioURL) return;

    if (inputAudioURLRef.current === inputAudioURL && inputAudioRef.current) {
      return;
    }

    inputAudioURLRef.current = inputAudioURL;

    const handleInputLoadedMetadata = () => {
      setInputState((prev) => ({
        ...prev,
        duration: inputAudioRef.current?.duration || inputDuration,
        error: null,
      }));
    };

    const handleInputTimeUpdate = () => {
      const currentTime = inputAudioRef.current?.currentTime || 0;
      const isPlaying = !inputAudioRef.current?.paused;

      setInputState((prev) => ({
        ...prev,
        currentTime: currentTime,
        isPlaying: isPlaying,
      }));

      if (onPlaybackUpdate && isPlaying) {
        onPlaybackUpdate(currentTime, true);
      }
    };

    const handleInputEnded = () => {
      setInputState((prev) => ({
        ...prev,
        isPlaying: false,
        currentTime: 0,
      }));
    };

    const handleInputError = (e) => {
      setInputState((prev) => ({
        ...prev,
        error: `Audio error: ${
            inputAudioRef.current?.error?.message || "Unknown error"
        }`,
        isPlaying: false,
      }));
    };

    // Clean up previous audio
    if (inputAudioRef.current) {
      inputAudioRef.current.removeEventListener(
          "timeupdate",
          handleInputTimeUpdate
      );
      inputAudioRef.current.removeEventListener(
          "loadedmetadata",
          handleInputLoadedMetadata
      );
      inputAudioRef.current.removeEventListener("ended", handleInputEnded);
      inputAudioRef.current.removeEventListener("error", handleInputError);

      if (inputAudioURLRef.current !== inputAudioURL) {
        inputAudioRef.current.pause();
      }
      inputAudioRef.current = null;
    }

    // Create new audio element
    const audio = new Audio(inputAudioURL);
    inputAudioRef.current = audio;

    // Add event listeners
    audio.addEventListener("loadedmetadata", handleInputLoadedMetadata);
    audio.addEventListener("timeupdate", handleInputTimeUpdate);
    audio.addEventListener("ended", handleInputEnded);
    audio.addEventListener("error", handleInputError);

    audio.preload = "auto";

    try {
      audio.load();
    } catch (error) {
      console.error("Error loading input audio:", error);
    }

    return () => {
      if (audio && inputAudioURLRef.current !== inputAudioURL) {
        audio.removeEventListener("loadedmetadata", handleInputLoadedMetadata);
        audio.removeEventListener("timeupdate", handleInputTimeUpdate);
        audio.removeEventListener("ended", handleInputEnded);
        audio.removeEventListener("error", handleInputError);
        if (!isVisible) {
          audio.pause();
        }
      }
    };
  }, [inputAudioURL, isVisible]);

  // Output audio effect
  useEffect(() => {
    if (!isVisible || !outputAudioURL) return;

    if (
        outputAudioURLRef.current === outputAudioURL &&
        outputAudioRef.current
    ) {
      return;
    }

    outputAudioURLRef.current = outputAudioURL;

    const handleOutputLoadedMetadata = () => {
      setOutputState((prev) => ({
        ...prev,
        duration: outputAudioRef.current?.duration || outputDuration,
        error: null,
      }));
    };

    const handleOutputTimeUpdate = () => {
      const currentTime = outputAudioRef.current?.currentTime || 0;
      const isPlaying = !outputAudioRef.current?.paused;

      setOutputState((prev) => ({
        ...prev,
        currentTime: currentTime,
        isPlaying: isPlaying,
      }));

      if (onPlaybackUpdate && isPlaying) {
        onPlaybackUpdate(currentTime, true);
      }
    };

    const handleOutputEnded = () => {
      setOutputState((prev) => ({
        ...prev,
        isPlaying: false,
        currentTime: 0,
      }));
    };

    const handleOutputError = (e) => {
      setOutputState((prev) => ({
        ...prev,
        error: `Audio error: ${
            outputAudioRef.current?.error?.message || "Unknown error"
        }`,
        isPlaying: false,
      }));
    };

    // Clean up previous audio
    if (outputAudioRef.current) {
      outputAudioRef.current.removeEventListener(
          "timeupdate",
          handleOutputTimeUpdate
      );
      outputAudioRef.current.removeEventListener(
          "loadedmetadata",
          handleOutputLoadedMetadata
      );
      outputAudioRef.current.removeEventListener("ended", handleOutputEnded);
      outputAudioRef.current.removeEventListener("error", handleOutputError);

      if (outputAudioURLRef.current !== outputAudioURL) {
        outputAudioRef.current.pause();
      }
      outputAudioRef.current = null;
    }

    // Create new audio element
    const audio = new Audio(outputAudioURL);
    outputAudioRef.current = audio;

    // Add event listeners
    audio.addEventListener("loadedmetadata", handleOutputLoadedMetadata);
    audio.addEventListener("timeupdate", handleOutputTimeUpdate);
    audio.addEventListener("ended", handleOutputEnded);
    audio.addEventListener("error", handleOutputError);

    audio.preload = "auto";

    try {
      audio.load();
    } catch (error) {
      console.error("Error loading output audio:", error);
    }

    return () => {
      if (audio && outputAudioURLRef.current !== outputAudioURL) {
        audio.removeEventListener("loadedmetadata", handleOutputLoadedMetadata);
        audio.removeEventListener("timeupdate", handleOutputTimeUpdate);
        audio.removeEventListener("ended", handleOutputEnded);
        audio.removeEventListener("error", handleOutputError);
        if (!isVisible) {
          audio.pause();
        }
      }
    };
  }, [outputAudioURL, isVisible]);

  // NEW: AI audio effect
  useEffect(() => {
    if (!isVisible || !aiAudioURL || !showAIOutput) return;

    if (
        aiAudioURLRef.current === aiAudioURL &&
        aiAudioRef.current
    ) {
      return;
    }

    aiAudioURLRef.current = aiAudioURL;

    const handleAILoadedMetadata = () => {
      setAIState((prev) => ({
        ...prev,
        duration: aiAudioRef.current?.duration || aiDuration,
        error: null,
      }));
    };

    const handleAITimeUpdate = () => {
      const currentTime = aiAudioRef.current?.currentTime || 0;
      const isPlaying = !aiAudioRef.current?.paused;

      setAIState((prev) => ({
        ...prev,
        currentTime: currentTime,
        isPlaying: isPlaying,
      }));

      if (onPlaybackUpdate && isPlaying) {
        onPlaybackUpdate(currentTime, true);
      }
    };

    const handleAIEnded = () => {
      setAIState((prev) => ({
        ...prev,
        isPlaying: false,
        currentTime: 0,
      }));
    };

    const handleAIError = (e) => {
      setAIState((prev) => ({
        ...prev,
        error: `Audio error: ${
            aiAudioRef.current?.error?.message || "Unknown error"
        }`,
        isPlaying: false,
      }));
    };

    // Clean up previous audio
    if (aiAudioRef.current) {
      aiAudioRef.current.removeEventListener(
          "timeupdate",
          handleAITimeUpdate
      );
      aiAudioRef.current.removeEventListener(
          "loadedmetadata",
          handleAILoadedMetadata
      );
      aiAudioRef.current.removeEventListener("ended", handleAIEnded);
      aiAudioRef.current.removeEventListener("error", handleAIError);

      if (aiAudioURLRef.current !== aiAudioURL) {
        aiAudioRef.current.pause();
      }
      aiAudioRef.current = null;
    }

    // Create new audio element
    const audio = new Audio(aiAudioURL);
    aiAudioRef.current = audio;

    // Add event listeners
    audio.addEventListener("loadedmetadata", handleAILoadedMetadata);
    audio.addEventListener("timeupdate", handleAITimeUpdate);
    audio.addEventListener("ended", handleAIEnded);
    audio.addEventListener("error", handleAIError);

    audio.preload = "auto";

    try {
      audio.load();
    } catch (error) {
      console.error("Error loading AI audio:", error);
    }

    return () => {
      if (audio && aiAudioURLRef.current !== aiAudioURL) {
        audio.removeEventListener("loadedmetadata", handleAILoadedMetadata);
        audio.removeEventListener("timeupdate", handleAITimeUpdate);
        audio.removeEventListener("ended", handleAIEnded);
        audio.removeEventListener("error", handleAIError);
        if (!isVisible) {
          audio.pause();
        }
      }
    };
  }, [aiAudioURL, isVisible, showAIOutput]);

  // Control functions for Input
  const handleInputPlay = async () => {
    if (!inputAudioRef.current) {
      setInputState((prev) => ({ ...prev, error: "Audio not initialized" }));
      return;
    }

    const audio = inputAudioRef.current;

    try {
      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
      }
    } catch (error) {
      setInputState((prev) => ({
        ...prev,
        error: `Play failed: ${error.message}`,
        isPlaying: false,
      }));
    }
  };

  const handleInputStop = () => {
    if (inputAudioRef.current) {
      inputAudioRef.current.pause();
      inputAudioRef.current.currentTime = 0;
      setInputState((prev) => ({ ...prev, isPlaying: false, currentTime: 0 }));
    }
  };

  const handleInputReset = () => {
    if (inputAudioRef.current) {
      inputAudioRef.current.playbackRate = 1.0;
      setInputState((prev) => ({ ...prev, playbackRate: 1.0 }));
    }
  };

  const handleInputSpeedChange = (speed) => {
    if (inputAudioRef.current) {
      inputAudioRef.current.playbackRate = speed;
      setInputState((prev) => ({ ...prev, playbackRate: speed }));
    }
  };

  const handleInputTimeChange = (time) => {
    if (inputAudioRef.current) {
      inputAudioRef.current.currentTime = time;
      setInputState((prev) => ({ ...prev, currentTime: time }));
    }
  };

  // Control functions for Output
  const handleOutputPlay = async () => {
    if (!outputAudioRef.current) {
      setOutputState((prev) => ({ ...prev, error: "Audio not initialized" }));
      return;
    }

    const audio = outputAudioRef.current;

    try {
      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
      }
    } catch (error) {
      setOutputState((prev) => ({
        ...prev,
        error: `Play failed: ${error.message}`,
        isPlaying: false,
      }));
    }
  };

  const handleOutputStop = () => {
    if (outputAudioRef.current) {
      outputAudioRef.current.pause();
      outputAudioRef.current.currentTime = 0;
      setOutputState((prev) => ({ ...prev, isPlaying: false, currentTime: 0 }));
    }
  };

  const handleOutputReset = () => {
    if (outputAudioRef.current) {
      outputAudioRef.current.playbackRate = 1.0;
      setOutputState((prev) => ({ ...prev, playbackRate: 1.0 }));
    }
  };

  const handleOutputSpeedChange = (speed) => {
    if (outputAudioRef.current) {
      outputAudioRef.current.playbackRate = speed;
      setOutputState((prev) => ({ ...prev, playbackRate: speed }));
    }
  };

  const handleOutputTimeChange = (time) => {
    if (outputAudioRef.current) {
      outputAudioRef.current.currentTime = time;
      setOutputState((prev) => ({ ...prev, currentTime: time }));
    }
  };

  // NEW: Control functions for AI Output
  const handleAIPlay = async () => {
    if (!aiAudioRef.current) {
      setAIState((prev) => ({ ...prev, error: "Audio not initialized" }));
      return;
    }

    const audio = aiAudioRef.current;

    try {
      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
      }
    } catch (error) {
      setAIState((prev) => ({
        ...prev,
        error: `Play failed: ${error.message}`,
        isPlaying: false,
      }));
    }
  };

  const handleAIStop = () => {
    if (aiAudioRef.current) {
      aiAudioRef.current.pause();
      aiAudioRef.current.currentTime = 0;
      setAIState((prev) => ({ ...prev, isPlaying: false, currentTime: 0 }));
    }
  };

  const handleAIReset = () => {
    if (aiAudioRef.current) {
      aiAudioRef.current.playbackRate = 1.0;
      setAIState((prev) => ({ ...prev, playbackRate: 1.0 }));
    }
  };

  const handleAISpeedChange = (speed) => {
    if (aiAudioRef.current) {
      aiAudioRef.current.playbackRate = speed;
      setAIState((prev) => ({ ...prev, playbackRate: speed }));
    }
  };

  const handleAITimeChange = (time) => {
    if (aiAudioRef.current) {
      aiAudioRef.current.currentTime = time;
      setAIState((prev) => ({ ...prev, currentTime: time }));
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
      <Card className="audio-player col-10 mx-auto">
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
              className="close-btn border-0"
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              onClick={() => {
                if (inputAudioRef.current) {
                  inputAudioRef.current.pause();
                  inputAudioRef.current = null;
                }
                if (outputAudioRef.current) {
                  outputAudioRef.current.pause();
                  outputAudioRef.current = null;
                }
                if (aiAudioRef.current) {
                  aiAudioRef.current.pause();
                  aiAudioRef.current = null;
                }
                onClose && onClose();
              }}
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

        {/* Error Display */}
        {(inputState.error || outputState.error || aiState.error) && (
            <div className="px-4 mt-3">
              {inputState.error && (
                  <div className="alert alert-warning mb-2">
                    <strong>Input Audio Error:</strong> {inputState.error}
                  </div>
              )}
              {outputState.error && (
                  <div className="alert alert-warning mb-2">
                    <strong>Output Audio Error:</strong> {outputState.error}
                  </div>
              )}
              {aiState.error && (
                  <div className="alert alert-warning mb-2">
                    <strong>AI Audio Error:</strong> {aiState.error}
                  </div>
              )}
            </div>
        )}

        <div className="audio-players-grid px-4 d-flex gap-3 my-4">
          {/* Input Audio Card */}
          <Card className="audio-panel col-4">
            <h4 className="panel-title px-4 py-2">Input Audio</h4>
            <PanelControls
                type="audio"
                isPlaying={inputState.isPlaying}
                currentTime={inputState.currentTime}
                duration={inputState.duration}
                playbackRate={inputState.playbackRate}
                onPlay={handleInputPlay}
                onStop={handleInputStop}
                onReset={handleInputReset}
                onSpeedChange={handleInputSpeedChange}
                onTimeChange={handleInputTimeChange}
            />
          </Card>

          {/* Output Audio Card */}
          <Card className="audio-panel col-4">
            <h4 className="panel-title px-4 py-2">Output Audio</h4>
            <PanelControls
                type="audio"
                isPlaying={outputState.isPlaying}
                currentTime={outputState.currentTime}
                duration={outputState.duration}
                playbackRate={outputState.playbackRate}
                onPlay={handleOutputPlay}
                onStop={handleOutputStop}
                onReset={handleOutputReset}
                onSpeedChange={handleOutputSpeedChange}
                onTimeChange={handleOutputTimeChange}
            />
          </Card>

          {/* NEW: AI Output Audio Card */}
          <Card className="audio-panel col-4">
            <h4 className="panel-title px-4 py-2" style={{ color: "#7bf447ff" }}>
              AI Output Audio
            </h4>
            {showAIOutput ? (
                aiAudioURL ? (
                    <PanelControls
                        type="audio"
                        isPlaying={aiState.isPlaying}
                        currentTime={aiState.currentTime}
                        duration={aiState.duration}
                        playbackRate={aiState.playbackRate}
                        onPlay={handleAIPlay}
                        onStop={handleAIStop}
                        onReset={handleAIReset}
                        onSpeedChange={handleAISpeedChange}
                        onTimeChange={handleAITimeChange}
                    />
                ) : (
                    <div
                        style={{
                          padding: "2rem",
                          textAlign: "center",
                          color: "#1FD5F9",
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
                      <p>Waiting for AI Equalization...</p>
                      <p style={{ color: "#9ca3af", fontSize: "0.8rem", marginTop: "10px" }}>
                        Click the "AI Equalize" button to process
                      </p>
                    </div>
                )
            ) : (
                <div
                    style={{
                      padding: "2rem",
                      textAlign: "center",
                      color: "#9ca3af",
                    }}
                >
                  AI Output not available in current mode
                </div>
            )}
          </Card>
        </div>
      </Card>
  );
};

export default AudioPlayer;