// API utility module for backend communication

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const toNumber = (value, fallback = 0) => {
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

const toNumberArray = (arr = []) => {
  return toIterableArray(arr)
    .map((value) => toNumber(value, NaN))
    .filter((value) => Number.isFinite(value));
};

const toNumberMatrix = (matrix = []) => {
  return toIterableArray(matrix)
    .map((row) => toNumberArray(row))
    .filter((row) => row.length > 0);
};

const normalizeApiPayload = (payload = {}) => {
  const timeSeries = toNumberArray(
    payload.full_time_series || payload.time_series || []
  );
  const sampleRate = toNumber(payload.Fs, 44100);
  const inferredDuration =
    timeSeries.length > 0 && sampleRate > 0
      ? timeSeries.length / sampleRate
      : 0;

  return {
    signal_id: payload.signal_id || payload.id || null,
    frequency_arr: toNumberArray(payload.frequencies || payload.frequency_arr),
    magnitude_arr: toNumberArray(payload.magnitudes_db || payload.magnitude_arr),
    time_series: timeSeries,
    Fs: sampleRate,
    duration: toNumber(payload.duration, inferredDuration),
    spectrogram_data: toNumberMatrix(
      payload.spectrogram_data || payload.spectrogram || []
    ),
  };
};

/**
 * Upload audio file to backend
 * @param {File} file - Audio file to upload
 * @returns {Promise<Object>} Transformed response with signal_id, frequency_arr, magnitude_arr, time_series
 */
export const uploadAudio = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/api/audio/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    const data = await response.json();

    const payload = data?.data
      ? {
          signal_id: data.signal_id ?? data.data.signal_id,
          frequencies: data.data.frequencies,
          magnitudes_db: data.data.magnitudes_db,
          full_time_series: data.data.full_time_series,
          Fs: data.data.Fs ?? data.Fs,
          duration: data.data.duration ?? data.duration,
          spectrogram_data: data.data.spectrogram_data,
        }
      : {
          signal_id: data.signal_id,
          frequencies: data.frequencies,
          magnitudes_db: data.magnitudes_db,
          full_time_series: data.full_time_series,
          Fs: data.Fs,
          duration: data.duration,
          spectrogram_data: data.spectrogram_data,
        };

    const normalized = normalizeApiPayload(payload);
    if (normalized.frequency_arr.length === 0) {
      console.warn("Upload response missing frequency data; downstream views may hide until data is generated.");
    }
    if (normalized.time_series.length === 0) {
      console.warn("Upload response missing time series data; fallback derivation occurs in UploadCard.");
    }
    return normalized;
  } catch (error) {
    console.error("Error uploading audio:", error);
    throw error;
  }
};

/**
 * Download output audio file
 * @param {string} signalId - Signal ID to download
 * @returns {Promise<Blob>} Audio blob
 */
export const downloadOutputAudio = async (signalId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/audio/download_output?signal_id=${signalId}`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    return await response.blob();
  } catch (error) {
    console.error("Error downloading output audio:", error);
    throw error;
  }
};

export default {
  uploadAudio,
  downloadOutputAudio,
};
