import React, { useState } from "react";
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
  const [aiAudioData, setAIAudioData] = useState(null); // NEW: AI audio data
  const [error, setError] = useState(null);
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
    setAIAudioData(null); // Reset AI data when new audio is loaded
    setAudioPlaybackState({ currentTime: 0, isPlaying: false });
    setCinePlaybackState({ currentTime: 0, isPlaying: false });

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

  // NEW: Handle AI equalizer response
  const handleAIEqualizerResponse = (aiEqualizedData) => {
    if (aiEqualizedData) {
      setAIAudioData(aiEqualizedData);
      console.log("AI Equalizer response:", aiEqualizedData);
      showToast("AI Equalization applied successfully", "success");

      // Also update the audioData with AI results for consistency
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
                        aiSpectrogram={aiAudioData?.spectrogram_data} // NEW: Pass AI spectrogram
                        inputSampleRate={audioData.input.Fs}
                        outputSampleRate={audioData.output?.Fs}
                        aiSampleRate={aiAudioData?.Fs} // NEW: Pass AI sample rate
                        inputDuration={audioData.input.duration}
                        outputDuration={audioData.output?.duration}
                        aiDuration={aiAudioData?.duration} // NEW: Pass AI duration
                        isVisible={viewerVisibility.spectrogramAnalyzer}
                        onClose={() => handleViewerClose("spectrogramAnalyzer")}
                        showAIOutput={true} // NEW: Show AI output in customized mode
                    />
                )}
                {viewerVisibility.audioPlayer && (
                    <AudioPlayer
                        inputAudioURL={audioData.input.audioURL}
                        outputAudioURL={audioData.output?.audioURL}
                        aiAudioURL={aiAudioData?.audioURL} // NEW: Pass AI audio URL
                        inputDuration={audioData.input.duration}
                        outputDuration={audioData.output?.duration}
                        aiDuration={aiAudioData?.duration} // NEW: Pass AI duration
                        onPlaybackUpdate={handleAudioPlaybackUpdate}
                        isVisible={viewerVisibility.audioPlayer}
                        onClose={() => handleViewerClose("audioPlayer")}
                        showAIOutput={true} // NEW: Show AI output in customized mode
                    />
                )}
                {viewerVisibility.cineViewer && (
                    <CineViewer
                        inputTimeSeries={audioData.input.time_series}
                        outputTimeSeries={audioData.output?.time_series}
                        aiTimeSeries={aiAudioData?.time_series} // NEW: Pass AI time series
                        sampleRate={audioData.input.Fs}
                        aiSampleRate={aiAudioData?.Fs} // NEW: Pass AI sample rate
                        playbackPosition={cinePlaybackState.currentTime}
                        isPlaying={cinePlaybackState.isPlaying}
                        onPlaybackUpdate={handleCinePlaybackUpdate}
                        isVisible={viewerVisibility.cineViewer}
                        onClose={() => handleViewerClose("cineViewer")}
                        showAIOutput={true} // NEW: Show AI output in customized mode
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
                onAIEqualizerResponse={handleAIEqualizerResponse} // NEW: Pass AI response handler
                title={`Customized Equalizer - ${selectedCategory}`}
                mode="customized"
                selectedCategory={selectedCategory}
            />
        )}
        <Footer />
      </div>
  );
};

export default CustomizedMode;