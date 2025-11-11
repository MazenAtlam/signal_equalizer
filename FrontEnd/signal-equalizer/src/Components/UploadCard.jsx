// UploadCard.jsx
import React, { useState, useRef } from "react";
import Card from "./Card";
import Button from "./Button";
import { uploadAudio } from "../utils/api";
import { generateMockAudioData, audioFileToTimeSeries, createAudioURL } from "../utils/audioUtils";
import { useToast } from "./Toast";

const UploadCard = ({ onDataLoad, onError }) => {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const { showToast } = useToast();

  const handleFileUpload = async (file) => {
    if (!file) return;

    setLoading(true);

    try {
      // Upload file to backend API
      const response = await uploadAudio(file);
      
      // Create audio URL for playback
      const inputAudioURL = URL.createObjectURL(file);
      
      // For output, we'll use the same data initially (before equalization)
      // The backend returns the processed data
      const outputAudioURL = createAudioURL(response.time_series, response.Fs);

      // Generate spectrogram data if not provided
      // For now, we'll create a simple spectrogram from the data
      // In a real implementation, this would come from the backend
      const spectrogramData = response.spectrogram_data || generateSpectrogramFromTimeSeries(
        response.time_series,
        response.Fs
      );

      // Call callback with loaded data
      if (onDataLoad) {
        onDataLoad({
          input: {
            signal_id: response.signal_id,
            frequency_arr: response.frequency_arr,
            magnitude_arr: response.magnitude_arr,
            time_series: response.time_series,
            audioURL: inputAudioURL,
            Fs: response.Fs,
            duration: response.duration,
            spectrogram_data: spectrogramData,
          },
          output: {
            signal_id: response.signal_id,
            frequency_arr: response.frequency_arr,
            magnitude_arr: response.magnitude_arr,
            time_series: response.time_series,
            audioURL: outputAudioURL,
            Fs: response.Fs,
            duration: response.duration,
            spectrogram_data: spectrogramData,
          },
        });
      }
    } catch (err) {
      const errorMessage = err.message || "Failed to upload audio file";
      showToast(errorMessage, "error");
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleLoadSampleData = async () => {
    setLoading(true);

    try {
      // Generate mock audio data
      const mockData = generateMockAudioData(2, 44100);
      
      // Create audio URL for playback
      const audioURL = createAudioURL(mockData.timeSeries, mockData.sampleRate);

      // Generate simple spectrogram for mock data
      const spectrogramData = generateSpectrogramFromTimeSeries(
        mockData.timeSeries,
        mockData.sampleRate
      );

      // Create a mock signal_id
      const signalId = `mock_${Date.now()}`;

      // Call callback with mock data
      if (onDataLoad) {
        onDataLoad({
          input: {
            signal_id: signalId,
            frequency_arr: mockData.frequencies,
            magnitude_arr: mockData.magnitudes,
            time_series: mockData.timeSeries,
            audioURL: audioURL,
            Fs: mockData.sampleRate,
            duration: mockData.timeSeries.length / mockData.sampleRate,
            spectrogram_data: spectrogramData,
          },
          output: {
            signal_id: signalId,
            frequency_arr: mockData.frequencies,
            magnitude_arr: mockData.magnitudes,
            time_series: mockData.timeSeries,
            audioURL: audioURL,
            Fs: mockData.sampleRate,
            duration: mockData.timeSeries.length / mockData.sampleRate,
            spectrogram_data: spectrogramData,
          },
        });
      }
    } catch (err) {
      const errorMessage = err.message || "Failed to generate sample data";
      showToast(errorMessage, "error");
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Simple spectrogram generation from time series
  const generateSpectrogramFromTimeSeries = (timeSeries, sampleRate) => {
    const windowSize = 1024;
    const overlap = 512;
    const step = windowSize - overlap;
    const numFrames = Math.floor((timeSeries.length - overlap) / step);
    const freqBins = windowSize / 2;

    const spectrogram = [];
    for (let f = 0; f < freqBins; f++) {
      spectrogram[f] = new Array(numFrames).fill(-80); // Initialize with low value
    }

    // Simple STFT approximation
    for (let t = 0; t < numFrames; t++) {
      const start = t * step;
      const end = Math.min(start + windowSize, timeSeries.length);
      const frame = timeSeries.slice(start, end);
      
      // Pad if necessary
      while (frame.length < windowSize) {
        frame.push(0);
      }

      // Simple FFT approximation (using windowed data)
      for (let f = 0; f < freqBins; f++) {
        let real = 0;
        let imag = 0;
        for (let n = 0; n < windowSize; n++) {
          const angle = -2 * Math.PI * f * n / windowSize;
          real += frame[n] * Math.cos(angle);
          imag += frame[n] * Math.sin(angle);
        }
        const magnitude = Math.sqrt(real * real + imag * imag);
        const magnitudeDb = 20 * Math.log10(magnitude + 1e-12);
        spectrogram[f][t] = magnitudeDb;
      }
    }

    return spectrogram;
  };

  return (
    <Card className="p-4">
      <div className="upload-area">
        <label htmlFor="audio-upload" className="upload-label">
          <div className="upload-box" style={{ cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}>
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
            <span className="font-medium">
              {loading ? "Processing..." : "Choose File"}
            </span>
          </div>
        </label>
        <input
          ref={fileInputRef}
          id="audio-upload"
          type="file"
          accept="audio/*"
          className="file-input-hidden"
          onChange={handleFileChange}
          disabled={loading}
        />
        <span className="text-muted-foreground">or</span>
        <Button
          variant="secondary"
          onClick={handleLoadSampleData}
          disabled={loading}
          style={{
            backgroundColor: loading ? "#666" : "#1FD5F9",
            border: "1px solid transparent",
            borderRadius: "4px",
            color: "#000000",
            paddingTop: "0.3rem",
            paddingBottom: "0.3rem",
            fontWeight: "600",
            fontSize: "0.875rem",
            cursor: loading ? "not-allowed" : "pointer",
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
          {loading ? "Loading..." : "Load Sample Data"}
        </Button>
      </div>
    </Card>
  );
};

export default UploadCard;
