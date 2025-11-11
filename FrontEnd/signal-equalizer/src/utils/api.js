// API utility module for backend communication

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * Upload audio file to backend
 * @param {File} file - Audio file to upload
 * @returns {Promise<Object>} Transformed response with signal_id, frequency_arr, magnitude_arr, time_series
 */
export const uploadAudio = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/api/audio/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform backend response to expected format
    return {
      signal_id: data.signal_id,
      frequency_arr: data.data.frequencies,
      magnitude_arr: data.data.magnitudes_db,
      time_series: data.data.full_time_series,
      Fs: data.Fs,
      duration: data.duration,
      spectrogram_data: data.data.spectrogram_data,
    };
  } catch (error) {
    console.error('Error uploading audio:', error);
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
    const response = await fetch(`${API_BASE_URL}/api/audio/download_output?signal_id=${signalId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.blob();
  } catch (error) {
    console.error('Error downloading output audio:', error);
    throw error;
  }
};

export default {
  uploadAudio,
  downloadOutputAudio,
};
