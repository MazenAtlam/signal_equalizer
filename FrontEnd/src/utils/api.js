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

  // Calculate duration from time series if not provided
  let duration = toNumber(payload.duration);
  if (!Number.isFinite(duration) || duration <= 0) {
    duration = timeSeries.length > 0 && sampleRate > 0
        ? timeSeries.length / sampleRate
        : 1; // Fallback to 1 second
  }

  return {
    signal_id: payload.signal_id || payload.id || null,
    frequency_arr: toNumberArray(payload.frequencies || payload.frequency_arr),
    magnitude_arr: toNumberArray(payload.magnitudes_db || payload.magnitude_arr),
    time_series: timeSeries,
    Fs: sampleRate,
    duration: duration,
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
          frequencies: data.data.frequency_arr || data.data.frequencies,
          magnitudes_db: data.data.magnitude_arr || data.data.magnitudes_db,
          full_time_series: data.data.time_series || data.data.full_time_series,
          Fs: data.data.Fs ?? data.Fs,
          duration: data.data.duration ?? data.duration,
          spectrogram_data: data.data.spectrogram || data.data.spectrogram_data,
        }
        : {
          signal_id: data.signal_id,
          frequencies: data.frequency_arr || data.frequencies,
          magnitudes_db: data.magnitude_arr || data.magnitudes_db,
          full_time_series: data.time_series || data.full_time_series,
          Fs: data.Fs,
          duration: data.duration,
          spectrogram_data: data.spectrogram || data.spectrogram_data,
        };

    const normalized = normalizeApiPayload(payload);

    // Debug log to confirm data flow
    console.log("API Normalized Data:", {
      spectrogramRows: normalized.spectrogram_data.length,
      spectrogramCols: normalized.spectrogram_data[0]?.length,
      frequencyPoints: normalized.frequency_arr.length
    });

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

/**
 * Apply equalizer settings to audio
 * @param {string} signalId - Signal ID to equalize
 * @param {Array} equalizerScheme - Array of equalizer bands with start_frequency, end_frequency, and scale_value
 * @returns {Promise<Object>} Response with equalized audio data
 */
export const equalizeAudio = async (signalId, equalizerScheme) => {
  try {
    const payload = {
      signal_id: signalId,
      count: equalizerScheme.length,
      equalizer_scheme: equalizerScheme
    };

    console.log("Sending equalizer request:", payload);

    const response = await fetch(`${API_BASE_URL}/api/equalizer/equalize`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
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
    console.log("Equalizer response received:", data);

    // Transform response to match our app's data structure
    const transformedData = {
      signal_id: data.signal_id || signalId,
      frequency_arr: data.frequency_arr || [],
      magnitude_arr: data.magnitude_arr || [],
      time_series: data.time_series || [],
      Fs: data.Fs || 44100,
      duration: data.duration || 0,
      spectrogram_data: data.spectrogram || data.spectrogram_data || [],
    };

    const normalized = normalizeApiPayload(transformedData);

    console.log("Normalized equalized data:", {
      timeSeriesLength: normalized.time_series.length,
      sampleRate: normalized.Fs
    });

    // Create audio URL from time series for playback
    if (normalized.time_series.length > 0) {
      // Use dynamic import to avoid circular dependencies
      const { createAudioURL } = await import('./audioUtils');
      const audioURL = createAudioURL(normalized.time_series, normalized.Fs);
      normalized.audioURL = audioURL;
      console.log("Generated audioURL:", audioURL);
    } else {
      console.warn("No time series data to create audio URL");
      normalized.audioURL = null;
    }

    return normalized;
  } catch (error) {
    console.error("Error applying equalizer:", error);
    throw error;
  }
};

/**
 * Apply AI equalizer settings to audio
 * @param {string} signalId - Signal ID to equalize
 * @param {string} customizedModePreset - Preset name ('human', 'musical', 'animal')
 * @param {Array} equalizerScheme - Array of equalizer bands with name and value
 * @returns {Promise<Object>} Response with AI-equalized audio data
 */
export const equalizeWithAI = async (signalId, customizedModePreset, equalizerScheme) => {
  try {
    const payload = {
      signal_id: signalId,
      customized_mode_preset: customizedModePreset,
      equalizer_scheme: equalizerScheme
    };

    console.log("Sending AI equalizer request:", payload);

    const response = await fetch(`${API_BASE_URL}/api/equalizer/equalize_with_ai`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
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
    console.log("AI Equalizer response received:", data);

    // Transform response to match our app's data structure
    const transformedData = {
      signal_id: data.signal_id || signalId,
      frequency_arr: data.frequency_arr || [],
      magnitude_arr: data.magnitude_arr || [],
      time_series: data.time_series || [],
      Fs: data.Fs || 44100,
      duration: data.duration || 0,
      spectrogram_data: data.spectrogram || data.spectrogram_data || [],
      performance: data.performance || {} // Include performance metrics
    };

    const normalized = normalizeApiPayload(transformedData);
    normalized.performance = data.performance; // Preserve performance metrics

    console.log("Normalized AI equalized data:", {
      timeSeriesLength: normalized.time_series.length,
      sampleRate: normalized.Fs,
      performance: normalized.performance
    });

    // Create audio URL from time series for playback
    if (normalized.time_series.length > 0) {
      const { createAudioURL } = await import('./audioUtils');
      const audioURL = createAudioURL(normalized.time_series, normalized.Fs);
      normalized.audioURL = audioURL;
      console.log("Generated audioURL:", audioURL);
    } else {
      console.warn("No time series data to create audio URL");
      normalized.audioURL = null;
    }

    return normalized;
  } catch (error) {
    console.error("Error applying AI equalizer:", error);
    throw error;
  }
};

export default {
  uploadAudio,
  downloadOutputAudio,
  equalizeAudio,
  equalizeWithAI,
};