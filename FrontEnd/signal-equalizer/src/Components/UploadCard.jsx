// UploadCard.jsx
import React, { useState, useRef } from "react";
import Card from "./Card";
import Button from "./Button";
import { uploadAudio } from "../utils/api";
import {
  generateMockAudioData,
  audioFileToTimeSeries,
  createAudioURL,
} from "../utils/audioUtils";
import { useToast } from "./Toast";

const toFiniteNumber = (value, fallback = 0) => {
  const num =
    typeof value === "number"
      ? value
      : value !== null && value !== undefined
      ? Number(value)
      : NaN;
  return Number.isFinite(num) ? num : fallback;
};

const toIterableArray = (value) => {
  if (Array.isArray(value)) return value;
  if (ArrayBuffer.isView(value)) return Array.from(value);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  if (value && typeof value === "object" && typeof value.length === "number") {
    try {
      return Array.from(value);
    } catch {
      return [];
    }
  }
  return [];
};

const sanitizeNumericArray = (value) =>
  toIterableArray(value)
    .map((entry) =>
      typeof entry === "number"
        ? entry
        : entry !== null && entry !== undefined
        ? Number(entry)
        : NaN
    )
    .filter((entry) => Number.isFinite(entry));

const sanitizeMatrix = (matrix) =>
  toIterableArray(matrix)
    .map((row) => sanitizeNumericArray(row))
    .filter((row) => row.length > 0);

const UploadCard = ({ onDataLoad, onError }) => {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const { showToast } = useToast();

  // Move generateQuickSpectrogram to the TOP so it's available for both functions
  const generateQuickSpectrogram = (timeSeries, sampleRate) => {
    const numFrames = 50;
    const numFreqBins = 256;
    const safeSeries = Array.isArray(timeSeries)
      ? timeSeries
      : ArrayBuffer.isView(timeSeries)
      ? Array.from(timeSeries)
      : [];
    const averageEnergy =
      safeSeries.length > 0
        ? safeSeries.reduce((sum, sample) => sum + Math.abs(sample), 0) /
          safeSeries.length
        : 0;
    const rateFactor =
      Number.isFinite(sampleRate) && sampleRate > 0
        ? sampleRate / 44100
        : 1;

    const spectrogram = [];

    // Generate a simple mock spectrogram pattern
    for (let f = 0; f < numFreqBins; f++) {
      spectrogram[f] = new Array(numFrames);
      for (let t = 0; t < numFrames; t++) {
        // Create a simple pattern that decreases with frequency
        const baseValue = -40 - (f / numFreqBins) * 40;
        // Add some time variation
        const timeVariation = Math.sin(t * 0.2 + averageEnergy) * 10;
        const rateVariation = Math.cos((f / numFreqBins) * Math.PI * rateFactor) * 5;
        // Add some random noise
        const noise = (Math.random() - 0.5) * 5;

        spectrogram[f][t] = baseValue + timeVariation + rateVariation + noise;
      }
    }

    return spectrogram;
  };

  // Helper function to generate mock frequency data if backend doesn't provide it
  const generateMockFrequencyData = (timeSeries, sampleRate) => {
    const frequencies = [];
    const magnitudes = [];

    // Generate simple frequency bins (0Hz to Nyquist frequency)
    const nyquist = sampleRate / 2;
    const numBins = 100;

    for (let i = 0; i < numBins; i++) {
      const freq = (i / numBins) * nyquist;
      frequencies.push(freq);

      // Simple mock magnitude that decreases with frequency
      const baseMagnitude = -20 - (freq / nyquist) * 40;
      const variation = Math.sin(freq * 0.01) * 10;
      magnitudes.push(baseMagnitude + variation);
    }

    return { frequencies, magnitudes };
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    setLoading(true);

    try {
      // Upload file to backend API
      const response = await uploadAudio(file);

      console.log("📤 UPLOAD - Backend Response:", {
        signal_id: response.signal_id,
        frequency_arr_length: response.frequency_arr?.length,
        magnitude_arr_length: response.magnitude_arr?.length,
        time_series_length: response.time_series?.length,
        Fs: response.Fs,
        duration: response.duration,
        spectrogram_data_length: response.spectrogram_data?.length,
      });

      // Normalize core audio structures
      const sanitizedResponse = {
        signal_id: response.signal_id || null,
        time_series: sanitizeNumericArray(response.time_series),
        frequency_arr: sanitizeNumericArray(response.frequency_arr),
        magnitude_arr: sanitizeNumericArray(response.magnitude_arr),
        spectrogram_data: sanitizeMatrix(response.spectrogram_data),
        Fs: toFiniteNumber(response.Fs, NaN),
        duration: toFiniteNumber(response.duration, NaN),
      };

      let normalizedTimeSeries = sanitizedResponse.time_series;
      let normalizedFs = sanitizedResponse.Fs;

      if (!normalizedTimeSeries.length) {
        console.warn(
          "⚠️ Backend response missing time series data, deriving from uploaded file"
        );
        try {
          const fallback = await audioFileToTimeSeries(file);
          normalizedTimeSeries = fallback.timeSeries;
          normalizedFs = fallback.sampleRate || normalizedFs;
        } catch (deriveError) {
          console.error("Failed to derive time series from file:", deriveError);
        }
      }

      normalizedFs = Number.isFinite(normalizedFs) && normalizedFs > 0 ? normalizedFs : 44100;
      const normalizedDuration =
        (Number.isFinite(sanitizedResponse.duration) && sanitizedResponse.duration > 0
          ? sanitizedResponse.duration
          : null) ||
        (normalizedTimeSeries.length > 0
          ? normalizedTimeSeries.length / normalizedFs
          : 0);

      // Create audio URLs for playback
      const inputAudioURL = URL.createObjectURL(file);
      const outputAudioURL = normalizedTimeSeries.length
        ? createAudioURL(normalizedTimeSeries, normalizedFs)
        : inputAudioURL;

      // Generate frequency data if not provided by backend
      let frequency_arr = sanitizedResponse.frequency_arr;
      let magnitude_arr = sanitizedResponse.magnitude_arr;
      if (frequency_arr.length > 0 && magnitude_arr.length > 0) {
        console.log("✅ Using backend frequency data");
      } else {
        console.log(
          "🔄 Generating mock frequency data (backend didn't provide)"
        );
        const mockFreqData = generateMockFrequencyData(
          normalizedTimeSeries,
          normalizedFs
        );
        frequency_arr = mockFreqData.frequencies;
        magnitude_arr = mockFreqData.magnitudes;
      }

      // Generate spectrogram data if not provided
      const spectrogramData =
        sanitizedResponse.spectrogram_data.length > 0
          ? sanitizedResponse.spectrogram_data
          : generateQuickSpectrogram(normalizedTimeSeries, normalizedFs);

      console.log("📤 UPLOAD - Final Data Structure:", {
        inputAudioURL: !!inputAudioURL,
        outputAudioURL: !!outputAudioURL,
        frequency_arr_length: frequency_arr.length,
        magnitude_arr_length: magnitude_arr.length,
        spectrogramDataLength: spectrogramData?.length,
        time_series_length: response.time_series?.length,
      });

      // Call callback with loaded data
      if (onDataLoad) {
        onDataLoad({
          input: {
            signal_id: response.signal_id,
            frequency_arr: frequency_arr,
            magnitude_arr: magnitude_arr,
            time_series: normalizedTimeSeries,
            audioURL: inputAudioURL,
            Fs: normalizedFs,
            duration: normalizedDuration,
            spectrogram_data: spectrogramData,
          },
          output: {
            signal_id: response.signal_id,
            frequency_arr: frequency_arr,
            magnitude_arr: magnitude_arr,
            time_series: normalizedTimeSeries,
            audioURL: outputAudioURL,
            Fs: normalizedFs,
            duration: normalizedDuration,
            spectrogram_data: spectrogramData,
          },
        });
      }
    } catch (err) {
      const errorMessage = err.message || "Failed to upload audio file";
      console.error("File upload error:", err);
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
      const mockData = generateMockAudioData(0.5, 11025);
      const inputAudioURL = createAudioURL(
        mockData.timeSeries,
        mockData.sampleRate
      );
      const outputAudioURL = createAudioURL(
        mockData.timeSeries,
        mockData.sampleRate
      );
      const signalId = `mock_${Date.now()}`;

      // Generate spectrogram data
      const spectrogramData = generateQuickSpectrogram(
        mockData.timeSeries,
        mockData.sampleRate
      );

      console.log("📊 SAMPLE - Data Structure:", {
        frequenciesLength: mockData.frequencies?.length,
        magnitudesLength: mockData.magnitudes?.length,
        timeSeriesLength: mockData.timeSeries?.length,
        sampleRate: mockData.sampleRate,
        spectrogramDataLength: spectrogramData?.length,
        inputAudioURL: !!inputAudioURL,
        outputAudioURL: !!outputAudioURL,
      });

      if (onDataLoad) {
        onDataLoad({
          input: {
            signal_id: signalId,
            frequency_arr: mockData.frequencies || [],
            magnitude_arr: mockData.magnitudes || [],
            time_series: mockData.timeSeries,
            audioURL: inputAudioURL,
            Fs: mockData.sampleRate,
            duration: mockData.timeSeries.length / mockData.sampleRate,
            spectrogram_data: spectrogramData,
          },
          output: {
            signal_id: signalId,
            frequency_arr: mockData.frequencies || [],
            magnitude_arr: mockData.magnitudes || [],
            time_series: mockData.timeSeries,
            audioURL: outputAudioURL,
            Fs: mockData.sampleRate,
            duration: mockData.timeSeries.length / mockData.sampleRate,
            spectrogram_data: spectrogramData,
          },
        });
      }
    } catch (err) {
      const errorMessage = err.message || "Failed to generate sample data";
      console.error("Error loading sample data:", err);
      showToast(errorMessage, "error");
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 col-10 mx-auto">
      <div className="upload-area">
        <label htmlFor="audio-upload" className="upload-label">
          <div
            className="upload-box"
            style={{
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
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
