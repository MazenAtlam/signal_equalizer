// Visualization utility module for canvas drawing

/**
 * Draw frequency graph linear scale on canvas
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Array<number>} frequencies - Frequency array in Hz
 * @param {Array<number>} magnitudes - Magnitude array in dB
 * @param {Object} options - Drawing options
 */
export const drawFrequencyGraph = (canvas, frequencies, magnitudes, options = {}) => {
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

  // Transform frequencies
  let xValues = frequencies;

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
    const label = Math.round(freqValue).toString();
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
 * Draw frequency graph audiogram scale on canvas
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Object} audiogramData - Frequency-Magnitude pairs for right and left ears
 * @param {Object} options - Drawing options
 */
export const drawAudiogram = (canvas, audiogramData, options = {}) => {
  if (!canvas || !audiogramData) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const padding = { top: 40, right: 40, bottom: 60, left: 80 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Clear and setup
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = options.backgroundColor || '#1a1a1a';
  ctx.fillRect(0, 0, width, height);

  // Define hearing loss regions with colors (CORRECTED: normal at top, hearing loss at bottom)
  const hearingRegions = [
    { min: -10, max: 20, color: 'rgba(0, 255, 0, 0.3)', label: 'Normal Hearing' },
    { min: 20, max: 40, color: 'rgba(255, 255, 0, 0.3)', label: 'Mild Hearing Loss' },
    { min: 40, max: 70, color: 'rgba(255, 165, 0, 0.3)', label: 'Moderate Hearing Loss' },
    { min: 70, max: 90, color: 'rgba(255, 0, 0, 0.3)', label: 'Severe Hearing Loss' },
    { min: 90, max: 120, color: 'rgba(139, 0, 0, 0.3)', label: 'Profound Hearing Loss' }
  ];

  // Audiogram frequency points (standard audiometric frequencies)
  const standardFrequencies = [125, 250, 500, 1000, 2000, 4000, 8000];

  // Y-axis: dB scale from -10 to 120 (CORRECTED: normal at top, hearing loss at bottom)
  const minDB = -10;
  const maxDB = 120;
  const dbRange = maxDB - minDB;

  // Draw hearing loss regions (CORRECTED: normal at top)
  hearingRegions.forEach(region => {
    // CORRECTED: Normal hearing at top, hearing loss at bottom
    const yStart = padding.top + ((region.min - minDB) / dbRange) * plotHeight;
    const yEnd = padding.top + ((region.max - minDB) / dbRange) * plotHeight;
    const regionHeight = yEnd - yStart;

    ctx.fillStyle = region.color;
    ctx.fillRect(padding.left, yStart, plotWidth, regionHeight);

    // Add region label
    ctx.fillStyle = '#fff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
        region.label,
        padding.left + plotWidth / 2,
        yStart + regionHeight / 2
    );
  });

  // Draw grid lines and axes
  ctx.strokeStyle = options.gridColor || '#666';
  ctx.lineWidth = 1;
  ctx.fillStyle = options.labelColor || '#fff';
  ctx.font = '12px Arial';

  // Logarithmic scale for frequency
  const logMin = Math.log10(125);
  const logMax = Math.log10(8000);

  // Vertical grid lines at standard frequencies
  standardFrequencies.forEach(freq => {
    const logFreq = Math.log10(freq);
    const x = padding.left + ((logFreq - logMin) / (logMax - logMin)) * plotWidth;

    // Grid line
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, padding.top + plotHeight);
    ctx.stroke();

    // Frequency label
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(freq + ' Hz', x, padding.top + plotHeight + 10);
  });

  // Horizontal grid lines for dB values (CORRECTED: normal at top)
  const dbSteps = [ -10, 0, 20, 40, 60, 80, 100, 120 ];
  dbSteps.forEach(db => {
    // CORRECTED: Normal hearing at top, hearing loss at bottom
    const y = padding.top + ((db - minDB) / dbRange) * plotHeight;

    // Grid line
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + plotWidth, y);
    ctx.stroke();

    // dB label
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(db + ' dB', padding.left - 10, y);
  });

  // Draw main axes
  ctx.strokeStyle = options.axisColor || '#fff';
  ctx.lineWidth = 2;

  // X-axis (frequency)
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top + plotHeight);
  ctx.lineTo(padding.left + plotWidth, padding.top + plotHeight);
  ctx.stroke();

  // Y-axis (dB)
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, padding.top + plotHeight);
  ctx.stroke();

  // Axis titles
  ctx.fillStyle = options.labelColor || '#fff';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';

  // X-axis title
  ctx.fillText('Frequency (Hz)', padding.left + plotWidth / 2, padding.top + plotHeight + 40);

  // Y-axis title (rotated)
  ctx.save();
  ctx.translate(30, padding.top + plotHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText('Hearing Level (dB HL)', 0, 0);
  ctx.restore();

  // Plot audiogram data points and lines (CORRECTED Y-coordinate calculation)
  if (audiogramData.leftEar && audiogramData.leftEar.length > 0) {
    // Left ear: Blue "X" markers
    ctx.strokeStyle = '#1E90FF'; // Blue
    ctx.lineWidth = 2;
    ctx.beginPath();

    audiogramData.leftEar.forEach((point, index) => {
      const logFreq = Math.log10(point.frequency);
      const x = padding.left + ((logFreq - logMin) / (logMax - logMin)) * plotWidth;
      // CORRECTED: Normal hearing at top, hearing loss at bottom
      const y = padding.top + ((point.db - minDB) / dbRange) * plotHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw "X" markers for left ear
    audiogramData.leftEar.forEach(point => {
      const logFreq = Math.log10(point.frequency);
      const x = padding.left + ((logFreq - logMin) / (logMax - logMin)) * plotWidth;
      // CORRECTED: Normal hearing at top, hearing loss at bottom
      const y = padding.top + ((point.db - minDB) / dbRange) * plotHeight;

      ctx.strokeStyle = '#1E90FF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 6, y - 6);
      ctx.lineTo(x + 6, y + 6);
      ctx.moveTo(x + 6, y - 6);
      ctx.lineTo(x - 6, y + 6);
      ctx.stroke();
    });
  }

  if (audiogramData.rightEar && audiogramData.rightEar.length > 0) {
    // Right ear: Red circles
    ctx.strokeStyle = '#FF4444'; // Red
    ctx.lineWidth = 2;
    ctx.beginPath();

    audiogramData.rightEar.forEach((point, index) => {
      const logFreq = Math.log10(point.frequency);
      const x = padding.left + ((logFreq - logMin) / (logMax - logMin)) * plotWidth;
      // CORRECTED: Normal hearing at top, hearing loss at bottom
      const y = padding.top + ((point.db - minDB) / dbRange) * plotHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw circle markers for right ear
    audiogramData.rightEar.forEach(point => {
      const logFreq = Math.log10(point.frequency);
      const x = padding.left + ((logFreq - logMin) / (logMax - logMin)) * plotWidth;
      // CORRECTED: Normal hearing at top, hearing loss at bottom
      const y = padding.top + ((point.db - minDB) / dbRange) * plotHeight;

      ctx.strokeStyle = '#FF4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.stroke();
    });
  }

  // Draw legend
  const legendX = padding.left + plotWidth - 150;
  const legendY = padding.top + 20;

  ctx.fillStyle = '#fff';
  ctx.font = '12px Arial';
  ctx.textAlign = 'left';

  // Left ear legend
  ctx.strokeStyle = '#1E90FF';
  ctx.beginPath();
  ctx.moveTo(legendX - 15, legendY);
  ctx.lineTo(legendX - 5, legendY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(legendX - 12, legendY - 6);
  ctx.lineTo(legendX - 8, legendY + 6);
  ctx.moveTo(legendX - 8, legendY - 6);
  ctx.lineTo(legendX - 12, legendY + 6);
  ctx.stroke();

  ctx.fillText('Left Ear', legendX, legendY + 4);

  // Right ear legend
  ctx.strokeStyle = '#FF4444';
  ctx.beginPath();
  ctx.moveTo(legendX - 15, legendY + 20);
  ctx.lineTo(legendX - 5, legendY + 20);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(legendX - 10, legendY + 20, 4, 0, 2 * Math.PI);
  ctx.stroke();

  ctx.fillText('Right Ear', legendX, legendY + 24);
};

/**
 * Draw color bar for spectrogram
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {number} minMag - Minimum magnitude
 * @param {number} maxMag - Maximum magnitude
 * @param {Object} options - Drawing options
 */
export const drawColorBar = (canvas, minMag, maxMag, options = {}) => {
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  const barWidth = options.barWidth || 20;
  const barHeight = height - 40;
  const barX = (width - barWidth) / 2;
  const barY = 20;

  // Draw color gradient
  for (let i = 0; i < barHeight; i++) {
    const normalized = i / barHeight;
    const color = getHeatMapColor(1 - normalized); // Invert for proper mapping

    ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
    ctx.fillRect(barX, barY + i, barWidth, 1);
  }

  // Draw frame
  ctx.strokeStyle = options.borderColor || '#fff';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  // Draw labels
  ctx.fillStyle = options.labelColor || '#fff';
  ctx.font = '10px Arial';
  ctx.textAlign = 'center';

  // Top label (max magnitude)
  ctx.fillText(Math.round(maxMag).toString(), width / 2, barY - 5);

  // Bottom label (min magnitude)
  ctx.fillText(Math.round(minMag).toString(), width / 2, barY + barHeight + 15);

  // Middle label
  const midValue = Math.round((minMag + maxMag) / 2);
  ctx.fillText(midValue.toString(), width / 2, barY + barHeight / 2);

  // Title
  ctx.fillText('dB', width / 2, barY + barHeight + 30);
};

/**
 * Draw spectrogram with numbered axes and color bar
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Array<Array<number>>} spectrogramData - 2D array [frequency][time]
 * @param {number} sampleRate - Sample rate in Hz
 * @param {number} duration - Duration in seconds
 * @param {Object} options - Drawing options
 */
export const drawSpectrogram = (canvas, spectrogramData, sampleRate = 44100, duration = 1, options = {}) => {
  if (!canvas || !spectrogramData || spectrogramData.length === 0) {
    return;
  }

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Reserve space for color bar on the right
  const colorBarWidth = 60;
  const plotWidth = width - colorBarWidth;
  const padding = options.padding || { top: 30, right: 20, bottom: 40, left: 60 };

  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = options.backgroundColor || '#1a1a1a';
  ctx.fillRect(0, 0, width, height);

  const numFreqBins = spectrogramData.length;
  const numTimeFrames = spectrogramData[0]?.length || 0;

  if (numTimeFrames === 0) return;

  const innerPlotWidth = plotWidth - padding.left - padding.right;
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

  // Calculate cell dimensions
  const cellWidth = innerPlotWidth / numTimeFrames;
  const cellHeight = plotHeight / numFreqBins;

  // Draw spectrogram
  for (let f = 0; f < numFreqBins; f++) {
    for (let t = 0; t < numTimeFrames; t++) {
      const mag = spectrogramData[f][t];
      const normalized = (mag - minMag) / magRange;

      // Color mapping (blue to red heat map)
      const color = getHeatMapColor(normalized);

      const x = padding.left + t * cellWidth;
      const y = padding.top + (numFreqBins - 1 - f) * cellHeight;

      ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
      ctx.fillRect(x, y, cellWidth, cellHeight);
    }
  }

  // Draw color bar
  const colorBarCanvas = document.createElement('canvas');
  colorBarCanvas.width = colorBarWidth;
  colorBarCanvas.height = height;
  drawColorBar(colorBarCanvas, minMag, maxMag, options);

  // Draw the color bar onto the main canvas
  ctx.drawImage(colorBarCanvas, plotWidth, 0);

  // Draw axes
  ctx.strokeStyle = options.axisColor || '#666';
  ctx.lineWidth = 1;

  // X-axis
  ctx.beginPath();
  ctx.moveTo(padding.left, height - padding.bottom);
  ctx.lineTo(padding.left + innerPlotWidth, height - padding.bottom);
  ctx.stroke();

  // Y-axis
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, height - padding.bottom);
  ctx.stroke();

  // Draw axis labels with actual values
  ctx.fillStyle = options.labelColor || '#fff';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';

  // X-axis labels (time)
  const timeSteps = 5;
  for (let i = 0; i <= timeSteps; i++) {
    const timeValue = (i / timeSteps) * duration;
    const x = padding.left + (i / timeSteps) * innerPlotWidth;
    ctx.fillText(timeValue.toFixed(2) + 's', x, height - padding.bottom + 20);
  }

  // Y-axis labels (frequency)
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const freqSteps = 5;
  const nyquistFrequency = sampleRate / 2;
  for (let i = 0; i <= freqSteps; i++) {
    const freqValue = (i / freqSteps) * nyquistFrequency;
    const y = padding.top + (1 - i / freqSteps) * plotHeight;
    ctx.fillText(Math.round(freqValue / 1000).toFixed(1) + ' kHz', padding.left - 10, y);
  }

  // Axis titles
  ctx.textAlign = 'center';
  ctx.fillText('Time (seconds)', padding.left + innerPlotWidth / 2, height - 10);

  ctx.save();
  ctx.translate(15, padding.top + plotHeight / 2);
  ctx.rotate(-Math.PI / 2);
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
 * Draw waveform with numbered axes and time window support
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @param {Array<number>} timeSeries - Time series data
 * @param {number} sampleRate - Sample rate in Hz
 * @param {Object} options - Drawing options
 */
export const drawWaveform = (canvas, timeSeries, sampleRate = 44100, options = {}) => {
  if (!canvas || !timeSeries || timeSeries.length === 0) {
    return;
  }

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const padding = options.padding || { top: 30, right: 20, bottom: 50, left: 60 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = options.backgroundColor || '#1a1a1a';
  ctx.fillRect(0, 0, width, height);

  // Calculate time window
  const totalDuration = timeSeries.length / sampleRate;
  const startTime = options.startTime || 0;
  const visibleDuration = options.visibleDuration || totalDuration;
  const endTime = Math.min(startTime + visibleDuration, totalDuration);

  // Calculate which samples to display
  const startSample = Math.floor(startTime * sampleRate);
  const endSample = Math.floor(endTime * sampleRate);
  const visibleSamples = timeSeries.slice(
      Math.max(0, startSample),
      Math.min(timeSeries.length, endSample)
  );

  if (visibleSamples.length === 0) return;

  // Downsample if necessary for performance
  const maxSamples = plotWidth;
  const step = Math.max(1, Math.floor(visibleSamples.length / maxSamples));
  const samples = [];
  for (let i = 0; i < visibleSamples.length; i += step) {
    samples.push(visibleSamples[i]);
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

  // Draw axis labels with actual values
  ctx.fillStyle = options.labelColor || '#fff';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';

  // X-axis labels (time) - show actual time values in the visible window
  const timeSteps = 6;
  for (let i = 0; i <= timeSteps; i++) {
    const timeValue = startTime + (i / timeSteps) * visibleDuration;
    const x = padding.left + (i / timeSteps) * plotWidth;
    ctx.fillText(timeValue.toFixed(2) + 's', x, height - padding.bottom + 20);
  }

  // Y-axis labels (amplitude)
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const amplitudeSteps = 4;
  for (let i = 0; i <= amplitudeSteps; i++) {
    const amplitude = minVal + (i / amplitudeSteps) * range;
    const y = padding.top + (1 - i / amplitudeSteps) * plotHeight;
    ctx.fillText(amplitude.toFixed(2), padding.left - 10, y);
  }

  // Axis titles
  ctx.textAlign = 'center';
  ctx.fillText('Time (seconds)', padding.left + plotWidth / 2, height - 15);

  ctx.save();
  ctx.translate(20, padding.top + plotHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Amplitude', 0, 0);
  ctx.restore();
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
  drawAudiogram,
  drawSpectrogram,
  drawWaveform,
  drawPlaybackPosition,
};