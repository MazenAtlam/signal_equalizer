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
  // Separate states for audio players and cine viewer
  const [audioPlaybackState, setAudioPlaybackState] = useState({
    currentTime: 0,
    isPlaying: false,
  });
  const [cinePlaybackState, setCinePlaybackState] = useState({
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
    console.log("Data load complete:" + data);
    setError(null);
    // Reset both playback states
    setAudioPlaybackState({ currentTime: 0, isPlaying: false });
    setCinePlaybackState({ currentTime: 0, isPlaying: false });

    // Store signal ID for equalizer
    if (data.input?.signal_id) {
      localStorage.setItem('currentSignalId', data.input.signal_id);
    }

    showToast("Audio data loaded successfully", "success");
  };

  // New function to handle equalizer response
  const handleEqualizerResponse = (equalizedData) => {
    if (audioData && equalizedData) {
      console.log("Before setAudioData - equalizedData:", equalizedData);
      console.log("Before setAudioData - audioData.output:", audioData.output);

      // Update the audioData with the new output from equalizer
      // Use the audioURL from equalizedData, not the previous one
      setAudioData(prevData => {
        const newData = {
          ...prevData,
          output: {
            ...equalizedData,
            // Don't preserve the old audioURL - use the new one from equalizedData
            audioURL: equalizedData.audioURL // This should contain the new processed audio
          }
        };
        console.log("In setAudioData callback - new output:", newData.output);
        return newData;
      });

      // Note: The console.log below will still show the old state due to async nature
      // But the component will re-render with the new state
      console.log("After setAudioData call - audioData.output:", audioData.output);

      showToast("Equalizer applied successfully", "success");
    }
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
    setAudioData(null);
    showToast(errorMessage, "error");
  };

  const handleAudioPlaybackUpdate = (currentTime, isPlaying) => {
    setAudioPlaybackState({ currentTime, isPlaying });
  };

  const handleCinePlaybackUpdate = (currentTime, isPlaying) => {
    setCinePlaybackState({ currentTime, isPlaying });
  };

  const handleViewerVisibilityChange = (viewerName, isVisible) => {
    if (isVisible && !audioData && viewerName !== "genericEqualizer") {
      showToast("Please upload an audio file or load sample data first", "error");
      return;
    }

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

  // Debug log to see when audioData changes
  React.useEffect(() => {
    if (audioData && audioData.output) {
      console.log("audioData.output updated:", audioData.output);
      console.log("Output audioURL:", audioData.output.audioURL);
    }
  }, [audioData?.output]);

  return (
      <div className="signal-equalizer-app">
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
                        outputSpectrogram={audioData.output?.spectrogram_data}
                        // Don't pass aiSpectrogram
                        inputSampleRate={audioData.input.Fs}
                        outputSampleRate={audioData.output?.Fs}
                        inputDuration={audioData.input.duration}
                        outputDuration={audioData.output?.duration}
                        isVisible={viewerVisibility.spectrogramAnalyzer}
                        onClose={() => handleViewerClose("spectrogramAnalyzer")}
                        showAIOutput={false} // Hide AI output in generic mode
                    />
                )}
                {viewerVisibility.audioPlayer && (
                    <AudioPlayer
                        inputAudioURL={audioData.input.audioURL}
                        outputAudioURL={audioData.output?.audioURL}
                        inputDuration={audioData.input.duration}
                        outputDuration={audioData.output?.duration}
                        onPlaybackUpdate={handleAudioPlaybackUpdate}
                        isVisible={viewerVisibility.audioPlayer}
                        onClose={() => handleViewerClose("audioPlayer")}
                        showAIOutput={false} // Hide AI output in generic mode
                    />
                )}
                {viewerVisibility.cineViewer && (
                    <CineViewer
                        inputTimeSeries={audioData.input.time_series}
                        outputTimeSeries={audioData.output?.time_series}
                        sampleRate={audioData.input.Fs}
                        playbackPosition={cinePlaybackState.currentTime}
                        isPlaying={cinePlaybackState.isPlaying}
                        onPlaybackUpdate={handleCinePlaybackUpdate}
                        isVisible={viewerVisibility.cineViewer}
                        onClose={() => handleViewerClose("cineViewer")}
                        showAIOutput={false} // Hide AI output in generic mode
                    />
                )}
              </>
          )}
        </main>
        {viewerVisibility.genericEqualizer && (
            <GenericEqualizer
                isVisible={viewerVisibility.genericEqualizer}
                onClose={() => handleViewerClose("genericEqualizer")}
                frequencyArr={audioData ? audioData.input.frequency_arr : null}
                signalId={audioData ? audioData.input.signal_id : null}
                onEqualizerResponse={handleEqualizerResponse} // New prop
            />
        )}
        <Footer />
      </div>
  );
};

export default GenericMode;