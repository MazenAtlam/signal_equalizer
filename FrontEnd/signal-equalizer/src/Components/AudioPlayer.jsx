import React, { useState, useEffect, useRef } from "react";
import Card from "./Card";
import Button from "./Button";
import PanelControls from "./PanelControls";

const AudioPlayer = ({
  inputAudioURL,
  outputAudioURL,
  inputDuration = 0,
  outputDuration = 0,
  onPlaybackUpdate,
  isVisible = true,
  onClose,
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

  const inputAudioRef = useRef(null);
  const outputAudioRef = useRef(null);
  const inputAudioURLRef = useRef(inputAudioURL);
  const outputAudioURLRef = useRef(outputAudioURL);

  // Input audio effect - FIXED: Only recreate when URL actually changes
  useEffect(() => {
    if (!isVisible || !inputAudioURL) return;

    // Only recreate audio if URL actually changed
    if (inputAudioURLRef.current === inputAudioURL && inputAudioRef.current) {
      console.log("🎵 Input audio URL unchanged, skipping reinitialization");
      return;
    }

    console.log("🎵 Initializing input audio...");
    inputAudioURLRef.current = inputAudioURL;

    // Define event handlers FIRST
    const handleInputLoadedMetadata = () => {
      console.log(
        "✅ Input audio metadata loaded, duration:",
        inputAudioRef.current?.duration
      );
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
      console.log("⏹️ Input audio ended");
      setInputState((prev) => ({
        ...prev,
        isPlaying: false,
        currentTime: 0,
      }));
    };

    const handleInputError = (e) => {
      console.error("❌ Input audio error:", e);
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
      const wasPlaying = !inputAudioRef.current.paused;
      const previousTime = inputAudioRef.current.currentTime;

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

      // Only pause if we're creating a new audio element
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

    // Set properties and load
    audio.preload = "auto";

    try {
      audio.load();
      console.log("✅ Input audio loaded successfully");
    } catch (error) {
      console.error("Error loading input audio:", error);
    }

    return () => {
      // Only cleanup when component unmounts or URL changes
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
  }, [inputAudioURL, isVisible]); // Removed inputDuration and onPlaybackUpdate from dependencies

  // Output audio effect - FIXED: Only recreate when URL actually changes
  useEffect(() => {
    if (!isVisible || !outputAudioURL) return;

    // Only recreate audio if URL actually changed
    if (
      outputAudioURLRef.current === outputAudioURL &&
      outputAudioRef.current
    ) {
      console.log("🎵 Output audio URL unchanged, skipping reinitialization");
      return;
    }

    console.log("🎵 Initializing output audio...");
    outputAudioURLRef.current = outputAudioURL;

    // Define event handlers FIRST
    const handleOutputLoadedMetadata = () => {
      console.log(
        "✅ Output audio metadata loaded, duration:",
        outputAudioRef.current?.duration
      );
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
      console.log("⏹️ Output audio ended");
      setOutputState((prev) => ({
        ...prev,
        isPlaying: false,
        currentTime: 0,
      }));
    };

    const handleOutputError = (e) => {
      console.error("❌ Output audio error:", e);
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
      const wasPlaying = !outputAudioRef.current.paused;
      const previousTime = outputAudioRef.current.currentTime;

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

      // Only pause if we're creating a new audio element
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

    // Set properties and load
    audio.preload = "auto";

    try {
      audio.load();
      console.log("✅ Output audio loaded successfully");
    } catch (error) {
      console.error("Error loading output audio:", error);
    }

    return () => {
      // Only cleanup when component unmounts or URL changes
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
  }, [outputAudioURL, isVisible]); // Removed outputDuration and onPlaybackUpdate from dependencies

  // Control functions
  const handleInputPlay = async () => {
    console.log("▶️ Input play requested");
    if (!inputAudioRef.current) {
      console.error("❌ No input audio reference");
      setInputState((prev) => ({ ...prev, error: "Audio not initialized" }));
      return;
    }

    const audio = inputAudioRef.current;

    try {
      if (audio.paused) {
        console.log("Starting input playback...");

        // Stop output if playing
        if (outputAudioRef.current && !outputAudioRef.current.paused) {
          console.log("Stopping output audio...");
          outputAudioRef.current.pause();
        }

        await audio.play();
        console.log("✅ Input audio play successful");
      } else {
        console.log("Pausing input playback...");
        audio.pause();
      }
    } catch (error) {
      console.error("❌ Input audio play failed:", error);
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
      inputAudioRef.current.currentTime = 0;
      setInputState((prev) => ({ ...prev, currentTime: 0 }));
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

  const handleOutputPlay = async () => {
    console.log("▶️ Output play requested");
    if (!outputAudioRef.current) {
      console.error("❌ No output audio reference");
      setOutputState((prev) => ({ ...prev, error: "Audio not initialized" }));
      return;
    }

    const audio = outputAudioRef.current;

    try {
      if (audio.paused) {
        console.log("Starting output playback...");

        // Stop input if playing
        if (inputAudioRef.current && !inputAudioRef.current.paused) {
          console.log("Stopping input audio...");
          inputAudioRef.current.pause();
        }

        await audio.play();
        console.log("✅ Output audio play successful");
      } else {
        console.log("Pausing output playback...");
        audio.pause();
      }
    } catch (error) {
      console.error("❌ Output audio play failed:", error);
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
      outputAudioRef.current.currentTime = 0;
      setOutputState((prev) => ({ ...prev, currentTime: 0 }));
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
      {(inputState.error || outputState.error) && (
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
        </div>
      )}

      <div className="audio-players-grid px-4 d-flex gap-3 my-4">
        <Card className="audio-panel col-6">
          <h4 className="panel-title px-4 py-2">Input Audio</h4>
          <div className="px-3 mb-2">
            <small className="text-muted">
              Duration: {inputState.duration.toFixed(2)}s | Current:{" "}
              {inputState.currentTime.toFixed(2)}s
            </small>
          </div>
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
        <Card className="audio-panel col-6">
          <h4 className="panel-title px-4 py-2">Output Audio</h4>
          <div className="px-3 mb-2">
            <small className="text-muted">
              Duration: {outputState.duration.toFixed(2)}s | Current:{" "}
              {outputState.currentTime.toFixed(2)}s
            </small>
          </div>
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
      </div>
    </Card>
  );
};

export default AudioPlayer;
