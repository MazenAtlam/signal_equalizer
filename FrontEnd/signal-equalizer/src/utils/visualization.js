// Visualization utility module for canvas drawing

/**
 * Draw frequency graph on canvas
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Array<number>} frequencies - Frequency array in Hz
 * @param {Array<number>} magnitudes - Magnitude array in dB
 * @param {string} scale - Scale type: 'linear' or 'audiogram'
 * @param {Object} options - Drawing options
 */
export const drawFrequencyGraph = (canvas, frequencies, magnitudes, scale = 'linear', options = {}) => {
  if (!canvas || !frequencies || !magnitudes || frequencies.length === 0) {
    return;
  }

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const padding = options.padding || { top: 20, right: 20, bottom: 40, left: 60 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = options.backgroundColor || '#1a1a1a';
  ctx.fillRect(0, 0, width, height);

  if (frequencies.length === 0) return;

  // Transform frequencies based on scale
  let xValues = frequencies;
  if (scale === 'audiogram') {
    xValues = frequencies.map(f => 2595 * Math.log10(1 + f / 700)); // Mel scale
  }

  // Find min/max values
  const minFreq = Math.min(...xValues);
  const maxFreq = Math.max(...xValues);
  const minMag = Math.min(...magnitudes);
  const maxMag = Math.max(...magnitudes);
  const magRange = maxMag - minMag || 1;

  // Draw axes
  ctx.strokeStyle = options.axisColor || '#666';
  ctx.lineWidth = 1;
  
  // X-axis
  ctx.beginPath();
  ctx.moveTo(padding.left, height - padding.bottom);
  ctx.lineTo(width - padding.right, height - padding.bottom);
  ctx.stroke();

  // Y-axis
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, height - padding.bottom);
  ctx.stroke();

  // Draw grid lines
  ctx.strokeStyle = options.gridColor || '#333';
  ctx.lineWidth = 0.5;

  // Vertical grid lines
  const numVerticalLines = 10;
  for (let i = 0; i <= numVerticalLines; i++) {
    const x = padding.left + (i / numVerticalLines) * plotWidth;
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, height - padding.bottom);
    ctx.stroke();
  }

  // Horizontal grid lines
  const numHorizontalLines = 8;
  for (let i = 0; i <= numHorizontalLines; i++) {
    const y = padding.top + (i / numHorizontalLines) * plotHeight;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
  }

  // Draw frequency graph
  ctx.strokeStyle = options.lineColor || '#1FD5F9';
  ctx.lineWidth = options.lineWidth || 2;
  ctx.beginPath();

  for (let i = 0; i < frequencies.length; i++) {
    const x = padding.left + ((xValues[i] - minFreq) / (maxFreq - minFreq || 1)) * plotWidth;
    const y = height - padding.bottom - ((magnitudes[i] - minMag) / magRange) * plotHeight;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.stroke();

  // Draw axis labels
  ctx.fillStyle = options.labelColor || '#fff';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  // X-axis labels
  for (let i = 0; i <= numVerticalLines; i++) {
    const freqValue = minFreq + (i / numVerticalLines) * (maxFreq - minFreq);
    let label;
    if (scale === 'audiogram') {
      label = Math.round(700 * (Math.pow(10, freqValue / 2595) - 1)).toString();
    } else {
      label = Math.round(freqValue).toString();
    }
    const x = padding.left + (i / numVerticalLines) * plotWidth;
    ctx.fillText(label + ' Hz', x, height - padding.bottom + 5);
  }

  // Y-axis labels
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let i = 0; i <= numHorizontalLines; i++) {
    const magValue = minMag + (i / numHorizontalLines) * (maxMag - minMag);
    const y = padding.top + (i / numHorizontalLines) * plotHeight;
    ctx.fillText(Math.round(magValue).toString() + ' dB', padding.left - 10, y);
  }
};

/**
 * Draw spectrogram on canvas
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Array<Array<number>>} spectrogramData - 2D array [frequency][time]
 * @param {Object} options - Drawing options
 */
export const drawSpectrogram = (canvas, spectrogramData, options = {}) => {
  if (!canvas || !spectrogramData || spectrogramData.length === 0) {
    return;
  }

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const padding = options.padding || { top: 30, right: 20, bottom: 40, left: 60 };

  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = options.backgroundColor || '#1a1a1a';
  ctx.fillRect(0, 0, width, height);

  const numFreqBins = spectrogramData.length;
  const numTimeFrames = spectrogramData[0]?.length || 0;

  if (numTimeFrames === 0) return;

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Find min/max magnitude for color mapping
  let minMag = Infinity;
  let maxMag = -Infinity;
  for (let f = 0; f < numFreqBins; f++) {
    for (let t = 0; t < numTimeFrames; t++) {
      const mag = spectrogramData[f][t];
      if (mag < minMag) minMag = mag;
      if (mag > maxMag) maxMag = mag;
    }
  }
  const magRange = maxMag - minMag || 1;

  // Draw spectrogram
  const cellWidth = plotWidth / numTimeFrames;
  const cellHeight = plotHeight / numFreqBins;

  const imageData = ctx.createImageData(plotWidth, plotHeight);
  const data = imageData.data;

  for (let f = 0; f < numFreqBins; f++) {
    for (let t = 0; t < numTimeFrames; t++) {
      const mag = spectrogramData[f][t];
      const normalized = (mag - minMag) / magRange;
      
      // Color mapping (blue to red heat map)
      const color = getHeatMapColor(normalized);
      
      const x = Math.floor((t / numTimeFrames) * plotWidth);
      const y = Math.floor(((numFreqBins - 1 - f) / numFreqBins) * plotHeight);
      
      if (x >= 0 && x < plotWidth && y >= 0 && y < plotHeight) {
        const index = (y * plotWidth + x) * 4;
        data[index] = color.r;
        data[index + 1] = color.g;
        data[index + 2] = color.b;
        data[index + 3] = 255;
      }
    }
  }

  ctx.putImageData(imageData, padding.left, padding.top);

  // Draw axes
  ctx.strokeStyle = options.axisColor || '#666';
  ctx.lineWidth = 1;
  
  // X-axis
  ctx.beginPath();
  ctx.moveTo(padding.left, height - padding.bottom);
  ctx.lineTo(width - padding.right, height - padding.bottom);
  ctx.stroke();

  // Y-axis
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, height - padding.bottom);
  ctx.stroke();

  // Draw labels
  ctx.fillStyle = options.labelColor || '#fff';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Time', width / 2, height - 10);
  
  ctx.save();
  ctx.translate(15, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText('Frequency (Hz)', 0, 0);
  ctx.restore();
};

/**
 * Get heat map color from normalized value (0-1)
 * @param {number} value - Normalized value (0-1)
 * @returns {{r: number, g: number, b: number}}
 */
const getHeatMapColor = (value) => {
  value = Math.max(0, Math.min(1, value));
  
  // Blue to cyan to yellow to red
  if (value < 0.25) {
    const t = value / 0.25;
    return { r: 0, g: Math.floor(t * 255), b: 255 };
  } else if (value < 0.5) {
    const t = (value - 0.25) / 0.25;
    return { r: 0, g: 255, b: Math.floor(255 * (1 - t)) };
  } else if (value < 0.75) {
    const t = (value - 0.5) / 0.25;
    return { r: Math.floor(t * 255), g: 255, b: 0 };
  } else {
    const t = (value - 0.75) / 0.25;
    return { r: 255, g: Math.floor(255 * (1 - t)), b: 0 };
  }
};

/**
 * Draw waveform on canvas
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Array<number>} timeSeries - Time series data
 * @param {Object} options - Drawing options
 */
export const drawWaveform = (canvas, timeSeries, options = {}) => {
  if (!canvas || !timeSeries || timeSeries.length === 0) {
    return;
  }

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const padding = options.padding || { top: 20, right: 20, bottom: 40, left: 20 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = options.backgroundColor || '#1a1a1a';
  ctx.fillRect(0, 0, width, height);

  // Downsample if necessary for performance
  const maxSamples = plotWidth;
  const step = Math.max(1, Math.floor(timeSeries.length / maxSamples));
  const samples = [];
  for (let i = 0; i < timeSeries.length; i += step) {
    samples.push(timeSeries[i]);
  }

  // Find min/max for scaling
  const minVal = Math.min(...samples);
  const maxVal = Math.max(...samples);
  const range = maxVal - minVal || 1;
  const centerY = padding.top + plotHeight / 2;

  // Draw waveform
  ctx.strokeStyle = options.lineColor || '#1FD5F9';
  ctx.lineWidth = options.lineWidth || 1;
  ctx.beginPath();

  for (let i = 0; i < samples.length; i++) {
    const x = padding.left + (i / (samples.length - 1 || 1)) * plotWidth;
    const y = centerY - ((samples[i] - (minVal + maxVal) / 2) / range) * (plotHeight / 2);

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.stroke();

  // Draw center line
  ctx.strokeStyle = options.centerLineColor || '#666';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding.left, centerY);
  ctx.lineTo(width - padding.right, centerY);
  ctx.stroke();

  // Draw axes
  ctx.strokeStyle = options.axisColor || '#666';
  ctx.lineWidth = 1;
  
  // X-axis
  ctx.beginPath();
  ctx.moveTo(padding.left, height - padding.bottom);
  ctx.lineTo(width - padding.right, height - padding.bottom);
  ctx.stroke();

  // Y-axis
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, height - padding.bottom);
  ctx.stroke();
};

/**
 * Draw playback position indicator
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {number} position - Playback position (0-1)
 * @param {Object} options - Drawing options
 */
export const drawPlaybackPosition = (canvas, position, options = {}) => {
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const padding = options.padding || { top: 20, right: 20, bottom: 40, left: 20 };
  const plotWidth = width - padding.left - padding.right;

  const normalizedPosition = Math.max(0, Math.min(1, position));
  const x = padding.left + normalizedPosition * plotWidth;

  ctx.strokeStyle = options.color || '#ff0000';
  ctx.lineWidth = options.lineWidth || 2;
  ctx.beginPath();
  ctx.moveTo(x, padding.top);
  ctx.lineTo(x, height - padding.bottom);
  ctx.stroke();
};

export default {
  drawFrequencyGraph,
  drawSpectrogram,
  drawWaveform,
  drawPlaybackPosition,
};
