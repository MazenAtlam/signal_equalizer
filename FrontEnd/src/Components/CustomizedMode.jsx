// CustomizedMode.jsx
import React, { useState, useEffect } from "react";
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

const CustomizedMode = ({ selectedCategory }) => {
  const [audioData, setAudioData] = useState(null);
  const [aiAudioData, setAIAudioData] = useState(null);
  const [error, setError] = useState(null);
  
  // Lifted State for Bands to ensure persistence
  const [equalizerBands, setEqualizerBands] = useState([]);

  // NEW: Reset bands when category changes so new presets can be loaded
  useEffect(() => {
    setEqualizerBands([]);
  }, [selectedCategory]);

  const { showToast } = useToast();
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
    setAIAudioData(null);
    setAudioPlaybackState({ currentTime: 0, isPlaying: false });
    setCinePlaybackState({ currentTime: 0, isPlaying: false });

    // Auto-enable Frequency Graph
    setViewerVisibility(prev => ({
      ...prev,
      frequencyGraph: true
    }));

    if (data.input?.signal_id) {
      localStorage.setItem('currentSignalId', data.input.signal_id);
    }

    showToast(`Audio data loaded successfully (${selectedCategory})`, "success");
  };

  const handleEqualizerResponse = (equalizedData) => {
    if (audioData && equalizedData) {
      setAudioData(prevData => ({
        ...prevData,
        output: {
          ...equalizedData,
          audioURL: equalizedData.audioURL
        }
      }));
      showToast("Equalizer applied successfully", "success");
    }
  };

  const handleAIEqualizerResponse = (aiEqualizedData) => {
    if (aiEqualizedData) {
      setAIAudioData(aiEqualizedData);
      console.log("AI Equalizer response:", aiEqualizedData);
      showToast("AI Equalization applied successfully", "success");

      if (audioData) {
        setAudioData(prevData => ({
          ...prevData,
          aiOutput: aiEqualizedData
        }));
      }
    }
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
    setAudioData(null);
    setAIAudioData(null);
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
                        aiSpectrogram={aiAudioData?.spectrogram_data}
                        inputSampleRate={audioData.input.Fs}
                        outputSampleRate={audioData.output?.Fs}
                        aiSampleRate={aiAudioData?.Fs}
                        inputDuration={audioData.input.duration}
                        outputDuration={audioData.output?.duration}
                        aiDuration={aiAudioData?.duration}
                        isVisible={viewerVisibility.spectrogramAnalyzer}
                        onClose={() => handleViewerClose("spectrogramAnalyzer")}
                        showAIOutput={true}
                    />
                )}
                {viewerVisibility.audioPlayer && (
                    <AudioPlayer
                        inputAudioURL={audioData.input.audioURL}
                        outputAudioURL={audioData.output?.audioURL}
                        aiAudioURL={aiAudioData?.audioURL}
                        inputDuration={audioData.input.duration}
                        outputDuration={audioData.output?.duration}
                        aiDuration={aiAudioData?.duration}
                        onPlaybackUpdate={handleAudioPlaybackUpdate}
                        isVisible={viewerVisibility.audioPlayer}
                        onClose={() => handleViewerClose("audioPlayer")}
                        showAIOutput={true}
                    />
                )}
                {viewerVisibility.cineViewer && (
                    <CineViewer
                        inputTimeSeries={audioData.input.time_series}
                        outputTimeSeries={audioData.output?.time_series}
                        aiTimeSeries={aiAudioData?.time_series}
                        sampleRate={audioData.input.Fs}
                        aiSampleRate={aiAudioData?.Fs}
                        playbackPosition={cinePlaybackState.currentTime}
                        isPlaying={cinePlaybackState.isPlaying}
                        onPlaybackUpdate={handleCinePlaybackUpdate}
                        isVisible={viewerVisibility.cineViewer}
                        onClose={() => handleViewerClose("cineViewer")}
                        showAIOutput={true}
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
                onEqualizerResponse={handleEqualizerResponse}
                onAIEqualizerResponse={handleAIEqualizerResponse}
                title={`Customized Equalizer - ${selectedCategory}`}
                mode="customized"
                selectedCategory={selectedCategory}
                
                // Pass persistence props
                bands={equalizerBands}
                setBands={setEqualizerBands}
            />
        )}
        <Footer />
      </div>
  );
};

export default CustomizedMode;