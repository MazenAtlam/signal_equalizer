// Audio utility module for audio processing and conversion

/**
 * Convert time series array to WAV blob
 * @param {Array<number>} timeSeries - Normalized audio samples (-1 to 1)
 * @param {number} sampleRate - Sampling rate (e.g., 44100)
 * @returns {Blob} WAV file blob
 */
export const timeSeriesToWavBlob = (timeSeries, sampleRate = 44100) => {
  const length = timeSeries.length;
  const buffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(buffer);
  const samples = new Int16Array(buffer, 44);

  // WAV header
  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // audio format (1 = PCM)
  view.setUint16(22, 1, true); // number of channels (1 = mono)
  view.setUint32(24, sampleRate, true); // sample rate
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, 'data');
  view.setUint32(40, length * 2, true); // data chunk size

  // Convert float samples to 16-bit PCM
  for (let i = 0; i < length; i++) {
    const s = Math.max(-1, Math.min(1, timeSeries[i]));
    samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }

  return new Blob([buffer], { type: 'audio/wav' });
};

/**
 * Convert audio file to time series array
 * @param {File} file - Audio file
 * @returns {Promise<{timeSeries: Array<number>, sampleRate: number}>}
 */
export const audioFileToTimeSeries = async (file) => {
  return new Promise((resolve, reject) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const fileReader = new FileReader();

    fileReader.onload = async (e) => {
      try {
        const arrayBuffer = e.target.result;
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const channelData = audioBuffer.getChannelData(0); // Get mono channel
        const timeSeries = Array.from(channelData);
        resolve({
          timeSeries,
          sampleRate: audioBuffer.sampleRate,
        });
      } catch (error) {
        reject(error);
      }
    };

    fileReader.onerror = reject;
    fileReader.readAsArrayBuffer(file);
  });
};

/**
 * Generate mock audio data (sine wave with multiple frequencies)
 * @param {number} duration - Duration in seconds
 * @param {number} sampleRate - Sampling rate (default: 44100)
 * @returns {{timeSeries: Array<number>, sampleRate: number, frequencies: Array<number>, magnitudes: Array<number>}}
 */
export const generateMockAudioData = (duration = 2, sampleRate = 44100) => {
  const length = Math.floor(duration * sampleRate);
  const timeSeries = new Array(length);
  
  // Generate a complex signal with multiple frequencies
  const freqComponents = [440, 880, 1320, 1760]; // A4, A5, E6, A6
  const amplitudes = [0.5, 0.3, 0.2, 0.1];
  
  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    let sample = 0;
    for (let j = 0; j < freqComponents.length; j++) {
      sample += amplitudes[j] * Math.sin(2 * Math.PI * freqComponents[j] * t);
    }
    // Add some noise
    sample += (Math.random() - 0.5) * 0.05;
    timeSeries[i] = sample;
  }

  // Calculate FFT (simple approach for mock data)
  const fftSize = Math.pow(2, Math.ceil(Math.log2(length)));
  const fftResult = simpleFFT(timeSeries, fftSize);
  const freqBins = fftSize / 2;
  const frequencies = new Array(freqBins);
  const magnitudes = new Array(freqBins);
  
  for (let i = 0; i < freqBins; i++) {
    frequencies[i] = (i * sampleRate) / fftSize;
    // Handle complex number from FFT
    const real = fftResult[i].real || 0;
    const imag = fftResult[i].imag || 0;
    const magnitude = Math.sqrt(real * real + imag * imag);
    magnitudes[i] = 20 * Math.log10(magnitude / (fftSize / 2) + 1e-12); // Convert to dB
  }

  return {
    timeSeries: Array.from(timeSeries),
    sampleRate,
    frequencies,
    magnitudes,
  };
};

/**
 * Simple FFT implementation for mock data
 * @param {Array<number>} signal - Input signal
 * @param {number} fftSize - FFT size (must be power of 2)
 * @returns {Array<Complex>} FFT result
 */
const simpleFFT = (signal, fftSize) => {
  // Pad signal to fftSize
  const padded = new Array(fftSize).fill(0);
  for (let i = 0; i < Math.min(signal.length, fftSize); i++) {
    padded[i] = signal[i];
  }

  // Simple DFT (not optimized, but sufficient for mock data)
  const result = new Array(fftSize);
  for (let k = 0; k < fftSize; k++) {
    let real = 0;
    let imag = 0;
    for (let n = 0; n < fftSize; n++) {
      const angle = -2 * Math.PI * k * n / fftSize;
      real += padded[n] * Math.cos(angle);
      imag += padded[n] * Math.sin(angle);
    }
    result[k] = { real, imag };
  }
  return result;
};

/**
 * Convert frequency to audiogram (Mel) scale
 * @param {number} frequencyHz - Frequency in Hz
 * @returns {number} Frequency in Mel scale
 */
export const frequencyToMel = (frequencyHz) => {
  return 2595 * Math.log10(1 + frequencyHz / 700);
};

/**
 * Convert Mel scale to frequency
 * @param {number} mel - Frequency in Mel scale
 * @returns {number} Frequency in Hz
 */
export const melToFrequency = (mel) => {
  return 700 * (Math.pow(10, mel / 2595) - 1);
};

/**
 * Convert frequency array to audiogram scale
 * @param {Array<number>} frequencies - Frequencies in Hz
 * @returns {Array<number>} Frequencies in Mel scale
 */
export const frequenciesToAudiogramScale = (frequencies) => {
  return frequencies.map(freq => frequencyToMel(freq));
};

/**
 * Create audio URL from time series
 * @param {Array<number>} timeSeries - Time series array
 * @param {number} sampleRate - Sampling rate
 * @returns {string} Audio URL (blob URL)
 */
export const createAudioURL = (timeSeries, sampleRate = 44100) => {
  const blob = timeSeriesToWavBlob(timeSeries, sampleRate);
  return URL.createObjectURL(blob);
};

export default {
  timeSeriesToWavBlob,
  audioFileToTimeSeries,
  generateMockAudioData,
  frequencyToMel,
  melToFrequency,
  frequenciesToAudiogramScale,
  createAudioURL,
};
