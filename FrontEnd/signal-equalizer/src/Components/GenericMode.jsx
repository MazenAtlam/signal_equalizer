// GenericMode.jsx
import React, { useState } from "react";
import Navbar from "./Navbar";
import SelectViewer from "./SelectViewer";
import UploadCard from "./UploadCard";
import FrequencyGraph from "./FrequencyGraph";
import SpectrogramAnalyzer from "./SpectrogramAnalyzer";
import AudioPlayer from "./AudioPlayer";
import CineViewer from "./CineViewer";
import Footer from "./Footer";
import GenericEqualizer from "./GenericEqualizer";
import { useToast } from "./Toast";
import "../../styles/index.css";
import "../../styles/components.css";

const GenericMode = () => {
  const [audioData, setAudioData] = useState(null);
  const [error, setError] = useState(null);
  const { showToast } = useToast();
  const [playbackState, setPlaybackState] = useState({
    currentTime: 0,
    isPlaying: false,
  });
  const [viewerVisibility, setViewerVisibility] = useState({
    frequencyGraph: false,
    spectrogramAnalyzer: false,
    audioPlayer: false,
    cineViewer: false,
    genericEqualizer: false,
  });

  const handleDataLoad = (data) => {
    setAudioData(data);
    setError(null);
    setPlaybackState({ currentTime: 0, isPlaying: false });
    // Keep viewers unchecked - user must manually check them to view
    // Viewers remain unchecked initially even after data is loaded
    showToast("Audio data loaded successfully", "success");
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
    setAudioData(null);
    showToast(errorMessage, "error");
  };

  const handlePlaybackUpdate = (currentTime, isPlaying) => {
    setPlaybackState({ currentTime, isPlaying });
  };

  const handleViewerVisibilityChange = (viewerName, isVisible) => {
    // If trying to show a viewer but no audio data is loaded, show error and don't update state
    if (isVisible && !audioData) {
      showToast("Please upload an audio file or load sample data first", "error");
      // Don't update state - checkbox will remain unchecked
      return;
    }
    
    // Update state only if allowed (either unchecking or checking with data)
    setViewerVisibility((prev) => ({
      ...prev,
      [viewerName]: isVisible,
    }));
  };

  const handleViewerClose = (viewerName) => {
    setViewerVisibility((prev) => ({
      ...prev,
      [viewerName]: false,
    }));
  };

  return (
    <div className="signal-equalizer-app">
      <Navbar />
      <main className="equalizer-main">
        <SelectViewer
          viewerVisibility={viewerVisibility}
          onVisibilityChange={handleViewerVisibilityChange}
          hasAudioData={!!audioData}
        />
        <UploadCard onDataLoad={handleDataLoad} onError={handleError} />
        {audioData && (
          <>
            {viewerVisibility.frequencyGraph && (
              <FrequencyGraph
                frequencies={audioData.input.frequency_arr}
                magnitudes={audioData.input.magnitude_arr}
                isVisible={viewerVisibility.frequencyGraph}
                onClose={() => handleViewerClose("frequencyGraph")}
              />
            )}
            {viewerVisibility.spectrogramAnalyzer && (
              <SpectrogramAnalyzer
                inputSpectrogram={audioData.input.spectrogram_data}
                outputSpectrogram={audioData.output.spectrogram_data}
                isVisible={viewerVisibility.spectrogramAnalyzer}
                onClose={() => handleViewerClose("spectrogramAnalyzer")}
              />
            )}
            {viewerVisibility.audioPlayer && (
              <AudioPlayer
                inputAudioURL={audioData.input.audioURL}
                outputAudioURL={audioData.output.audioURL}
                inputDuration={audioData.input.duration}
                outputDuration={audioData.output.duration}
                onPlaybackUpdate={handlePlaybackUpdate}
                isVisible={viewerVisibility.audioPlayer}
                onClose={() => handleViewerClose("audioPlayer")}
              />
            )}
            {viewerVisibility.cineViewer && (
              <CineViewer
                inputTimeSeries={audioData.input.time_series}
                outputTimeSeries={audioData.output.time_series}
                sampleRate={audioData.input.Fs}
                playbackPosition={playbackState.currentTime}
                isPlaying={playbackState.isPlaying}
                isVisible={viewerVisibility.cineViewer}
                onClose={() => handleViewerClose("cineViewer")}
              />
            )}
          </>
        )}
      </main>
      {viewerVisibility.genericEqualizer && (
        <GenericEqualizer
          isVisible={viewerVisibility.genericEqualizer}
          onClose={() => handleViewerClose("genericEqualizer")}
        />
      )}
      <Footer />
    </div>
  );
};

export default GenericMode;
