import React, { useState, useEffect, useRef } from "react";
import Card from "./Card";
import Button from "./Button";
import PanelControls from "./PanelControls";

const AudioPlayer = ({ inputAudioURL, outputAudioURL, inputDuration = 0, outputDuration = 0, onPlaybackUpdate, isVisible = true, onClose }) => {
  const [hovered, setHovered] = useState(false);
  const [inputState, setInputState] = useState({
    isPlaying: false,
    currentTime: 0,
    duration: inputDuration,
    playbackRate: 1.0,
  });
  const [outputState, setOutputState] = useState({
    isPlaying: false,
    currentTime: 0,
    duration: outputDuration,
    playbackRate: 1.0,
  });
  
  const inputAudioRef = useRef(null);
  const outputAudioRef = useRef(null);
  const updateIntervalRef = useRef(null);

  if (!isVisible) {
    return null;
  }

  useEffect(() => {
    if (inputAudioURL) {
      const audio = new Audio(inputAudioURL);
      inputAudioRef.current = audio;
      
      audio.addEventListener('loadedmetadata', () => {
        setInputState(prev => ({ ...prev, duration: audio.duration }));
      });
      
      audio.addEventListener('timeupdate', () => {
        const isPlaying = !audio.paused;
        setInputState(prev => ({ ...prev, currentTime: audio.currentTime, isPlaying }));
        // Only update playback if input is playing
        if (onPlaybackUpdate && isPlaying) {
          onPlaybackUpdate(audio.currentTime, true);
        }
      });
      
      audio.addEventListener('play', () => {
        setInputState(prev => ({ ...prev, isPlaying: true }));
        if (onPlaybackUpdate && inputAudioRef.current) {
          onPlaybackUpdate(inputAudioRef.current.currentTime, true);
        }
      });
      
      audio.addEventListener('pause', () => {
        setInputState(prev => ({ ...prev, isPlaying: false }));
        // Only update if no other audio is playing
        if (onPlaybackUpdate && (!outputAudioRef.current || outputAudioRef.current.paused)) {
          onPlaybackUpdate(inputAudioRef.current.currentTime, false);
        }
      });
      
      audio.addEventListener('ended', () => {
        setInputState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
        if (onPlaybackUpdate && (!outputAudioRef.current || outputAudioRef.current.paused)) {
          onPlaybackUpdate(0, false);
        }
      });

      return () => {
        if (inputAudioRef.current) {
          inputAudioRef.current.pause();
          inputAudioRef.current = null;
        }
      };
    }
  }, [inputAudioURL, onPlaybackUpdate]);

  useEffect(() => {
    if (outputAudioURL) {
      const audio = new Audio(outputAudioURL);
      outputAudioRef.current = audio;
      
      audio.addEventListener('loadedmetadata', () => {
        setOutputState(prev => ({ ...prev, duration: audio.duration }));
      });
      
      audio.addEventListener('timeupdate', () => {
        const isPlaying = !audio.paused;
        setOutputState(prev => ({ ...prev, currentTime: audio.currentTime, isPlaying }));
        // Only update playback if output is playing
        if (onPlaybackUpdate && isPlaying) {
          onPlaybackUpdate(audio.currentTime, true);
        }
      });
      
      audio.addEventListener('play', () => {
        setOutputState(prev => ({ ...prev, isPlaying: true }));
        if (onPlaybackUpdate && outputAudioRef.current) {
          onPlaybackUpdate(outputAudioRef.current.currentTime, true);
        }
      });
      
      audio.addEventListener('pause', () => {
        setOutputState(prev => ({ ...prev, isPlaying: false }));
        // Only update if no other audio is playing
        if (onPlaybackUpdate && (!inputAudioRef.current || inputAudioRef.current.paused)) {
          onPlaybackUpdate(outputAudioRef.current.currentTime, false);
        }
      });
      
      audio.addEventListener('ended', () => {
        setOutputState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
        if (onPlaybackUpdate && (!inputAudioRef.current || inputAudioRef.current.paused)) {
          onPlaybackUpdate(0, false);
        }
      });

      return () => {
        if (outputAudioRef.current) {
          outputAudioRef.current.pause();
          outputAudioRef.current = null;
        }
      };
    }
  }, [outputAudioURL, onPlaybackUpdate]);

  const handleInputPlay = () => {
    if (inputAudioRef.current) {
      if (inputState.isPlaying) {
        inputAudioRef.current.pause();
        setInputState(prev => ({ ...prev, isPlaying: false }));
      } else {
        inputAudioRef.current.play();
        setInputState(prev => ({ ...prev, isPlaying: true }));
      }
    }
  };

  const handleInputStop = () => {
    if (inputAudioRef.current) {
      inputAudioRef.current.pause();
      inputAudioRef.current.currentTime = 0;
      setInputState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
    }
  };

  const handleInputReset = () => {
    if (inputAudioRef.current) {
      inputAudioRef.current.currentTime = 0;
      setInputState(prev => ({ ...prev, currentTime: 0 }));
    }
  };

  const handleInputSpeedChange = (speed) => {
    if (inputAudioRef.current) {
      inputAudioRef.current.playbackRate = speed;
      setInputState(prev => ({ ...prev, playbackRate: speed }));
    }
  };

  const handleInputTimeChange = (time) => {
    if (inputAudioRef.current) {
      inputAudioRef.current.currentTime = time;
      setInputState(prev => ({ ...prev, currentTime: time }));
    }
  };

  const handleOutputPlay = () => {
    if (outputAudioRef.current) {
      if (outputState.isPlaying) {
        outputAudioRef.current.pause();
        setOutputState(prev => ({ ...prev, isPlaying: false }));
      } else {
        outputAudioRef.current.play();
        setOutputState(prev => ({ ...prev, isPlaying: true }));
      }
    }
  };

  const handleOutputStop = () => {
    if (outputAudioRef.current) {
      outputAudioRef.current.pause();
      outputAudioRef.current.currentTime = 0;
      setOutputState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
    }
  };

  const handleOutputReset = () => {
    if (outputAudioRef.current) {
      outputAudioRef.current.currentTime = 0;
      setOutputState(prev => ({ ...prev, currentTime: 0 }));
    }
  };

  const handleOutputSpeedChange = (speed) => {
    if (outputAudioRef.current) {
      outputAudioRef.current.playbackRate = speed;
      setOutputState(prev => ({ ...prev, playbackRate: speed }));
    }
  };

  const handleOutputTimeChange = (time) => {
    if (outputAudioRef.current) {
      outputAudioRef.current.currentTime = time;
      setOutputState(prev => ({ ...prev, currentTime: time }));
    }
  };

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
      <div className="audio-players-grid px-4 d-flex gap-3 my-4">
        <Card className="audio-panel col-6">
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
        <Card className="audio-panel col-6">
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
      </div>
    </Card>
  );
};

export default AudioPlayer;
