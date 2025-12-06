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

  // --- OPTIMIZATION: DOWNSAMPLE DATA ---
  // Limit the number of points to draw to prevent browser crash
  const maxPointsToDraw = 3000; 
  const step = Math.max(1, Math.floor(frequencies.length / maxPointsToDraw));
  // -------------------------------------

  // Find min/max values (Approximation based on step to save time)
  // For true min/max we might need to scan all, but this is usually safe for visualization
  let minFreq = Infinity, maxFreq = -Infinity;
  let minMag = Infinity, maxMag = -Infinity;

  // Scan a subset for min/max to be fast
  const scanStep = Math.max(1, Math.floor(frequencies.length / 1000));
  for(let i=0; i<frequencies.length; i+=scanStep) {
      if(frequencies[i] < minFreq) minFreq = frequencies[i];
      if(frequencies[i] > maxFreq) maxFreq = frequencies[i];
      if(magnitudes[i] < minMag) minMag = magnitudes[i];
      if(magnitudes[i] > maxMag) maxMag = magnitudes[i];
  }
  // Ensure we caught the bounds
  minFreq = Math.min(minFreq, frequencies[0]);
  maxFreq = Math.max(maxFreq, frequencies[frequencies.length-1]);
  
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

  // --- DRAWING LOOP WITH STEP ---
  let isFirst = true;
  for (let i = 0; i < frequencies.length; i += step) {
    const x = padding.left + ((frequencies[i] - minFreq) / (maxFreq - minFreq || 1)) * plotWidth;
    const y = height - padding.bottom - ((magnitudes[i] - minMag) / magRange) * plotHeight;

    if (isFirst) {
      ctx.moveTo(x, y);
      isFirst = false;
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
  // -----------------------------

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

  // Define hearing loss regions with colors
  const hearingRegions = [
    { min: -10, max: 20, color: 'rgba(0, 255, 0, 0.3)', label: 'Normal Hearing' },
    { min: 20, max: 40, color: 'rgba(255, 255, 0, 0.3)', label: 'Mild Hearing Loss' },
    { min: 40, max: 70, color: 'rgba(255, 165, 0, 0.3)', label: 'Moderate Hearing Loss' },
    { min: 70, max: 90, color: 'rgba(255, 0, 0, 0.3)', label: 'Severe Hearing Loss' },
    { min: 90, max: 120, color: 'rgba(139, 0, 0, 0.3)', label: 'Profound Hearing Loss' }
  ];

  // Audiogram frequency points
  const standardFrequencies = [125, 250, 500, 1000, 2000, 4000, 8000];

  // Y-axis: dB scale from -10 to 120
  const minDB = -10;
  const maxDB = 120;
  const dbRange = maxDB - minDB;

  // Draw hearing loss regions
  hearingRegions.forEach(region => {
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

  const logMin = Math.log10(125);
  const logMax = Math.log10(8000);

  standardFrequencies.forEach(freq => {
    const logFreq = Math.log10(freq);
    const x = padding.left + ((logFreq - logMin) / (logMax - logMin)) * plotWidth;

    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, padding.top + plotHeight);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(freq + ' Hz', x, padding.top + plotHeight + 10);
  });

  const dbSteps = [ -10, 0, 20, 40, 60, 80, 100, 120 ];
  dbSteps.forEach(db => {
    const y = padding.top + ((db - minDB) / dbRange) * plotHeight;

    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + plotWidth, y);
    ctx.stroke();

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(db + ' dB', padding.left - 10, y);
  });

  ctx.strokeStyle = options.axisColor || '#fff';
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top + plotHeight);
  ctx.lineTo(padding.left + plotWidth, padding.top + plotHeight);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, padding.top + plotHeight);
  ctx.stroke();

  ctx.fillStyle = options.labelColor || '#fff';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';

  ctx.fillText('Frequency (Hz)', padding.left + plotWidth / 2, padding.top + plotHeight + 40);

  ctx.save();
  ctx.translate(30, padding.top + plotHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillText('Hearing Level (dB HL)', 0, 0);
  ctx.restore();

  // Plot data points
  if (audiogramData.leftEar && audiogramData.leftEar.length > 0) {
    ctx.strokeStyle = '#1E90FF'; // Blue
    ctx.lineWidth = 2;
    ctx.beginPath();

    audiogramData.leftEar.forEach((point, index) => {
      const logFreq = Math.log10(point.frequency);
      const x = padding.left + ((logFreq - logMin) / (logMax - logMin)) * plotWidth;
      const y = padding.top + ((point.db - minDB) / dbRange) * plotHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    audiogramData.leftEar.forEach(point => {
      const logFreq = Math.log10(point.frequency);
      const x = padding.left + ((logFreq - logMin) / (logMax - logMin)) * plotWidth;
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
    ctx.strokeStyle = '#FF4444'; // Red
    ctx.lineWidth = 2;
    ctx.beginPath();

    audiogramData.rightEar.forEach((point, index) => {
      const logFreq = Math.log10(point.frequency);
      const x = padding.left + ((logFreq - logMin) / (logMax - logMin)) * plotWidth;
      const y = padding.top + ((point.db - minDB) / dbRange) * plotHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    audiogramData.rightEar.forEach(point => {
      const logFreq = Math.log10(point.frequency);
      const x = padding.left + ((logFreq - logMin) / (logMax - logMin)) * plotWidth;
      const y = padding.top + ((point.db - minDB) / dbRange) * plotHeight;

      ctx.strokeStyle = '#FF4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.stroke();
    });
  }

  const legendX = padding.left + plotWidth - 150;
  const legendY = padding.top + 20;

  ctx.fillStyle = '#fff';
  ctx.font = '12px Arial';
  ctx.textAlign = 'left';

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
 */
export const drawColorBar = (canvas, minMag, maxMag, options = {}) => {
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  const barWidth = options.barWidth || 20;
  const barHeight = height - 40;
  const barX = (width - barWidth) / 2;
  const barY = 20;

  for (let i = 0; i < barHeight; i++) {
    const normalized = i / barHeight;
    const color = getHeatMapColor(1 - normalized);

    ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
    ctx.fillRect(barX, barY + i, barWidth, 1);
  }

  ctx.strokeStyle = options.borderColor || '#fff';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  ctx.fillStyle = options.labelColor || '#fff';
  ctx.font = '10px Arial';
  ctx.textAlign = 'center';

  ctx.fillText(Math.round(maxMag).toString(), width / 2, barY - 5);
  ctx.fillText(Math.round(minMag).toString(), width / 2, barY + barHeight + 15);
  const midValue = Math.round((minMag + maxMag) / 2);
  ctx.fillText(midValue.toString(), width / 2, barY + barHeight / 2);
  ctx.fillText('dB', width / 2, barY + barHeight + 30);
};

/**
 * Draw spectrogram with numbered axes and color bar
 */
export const drawSpectrogram = (canvas, spectrogramData, sampleRate = 44100, duration = 1, options = {}) => {
  if (!canvas || !spectrogramData || spectrogramData.length === 0) {
    return;
  }

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  const colorBarWidth = 60;
  const plotWidth = width - colorBarWidth;
  const padding = options.padding || { top: 30, right: 20, bottom: 40, left: 60 };

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = options.backgroundColor || '#1a1a1a';
  ctx.fillRect(0, 0, width, height);

  const numFreqBins = spectrogramData.length;
  const numTimeFrames = spectrogramData[0]?.length || 0;

  if (numTimeFrames === 0) return;

  const innerPlotWidth = plotWidth - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Find min/max magnitude for color mapping
  // Optimization: Scan only a subset if data is huge, but here we do full scan to be accurate for color
  // Since this is done once per render, it's usually acceptable, but can be optimized if needed.
  let minMag = Infinity;
  let maxMag = -Infinity;
  
  // Sample a few rows for min/max to save time
  const rowStep = Math.max(1, Math.floor(numFreqBins / 50));
  const colStep = Math.max(1, Math.floor(numTimeFrames / 50));
  
  for (let f = 0; f < numFreqBins; f += rowStep) {
    for (let t = 0; t < numTimeFrames; t += colStep) {
      const mag = spectrogramData[f][t];
      if (mag < minMag) minMag = mag;
      if (mag > maxMag) maxMag = mag;
    }
  }

  if (minMag === maxMag) {
    minMag = minMag - 1;
    maxMag = maxMag + 1;
  }

  const magRange = maxMag - minMag || 1;

  // Calculate cell dimensions
  const cellWidth = innerPlotWidth / numTimeFrames;
  const cellHeight = plotHeight / numFreqBins;

  // --- OPTIMIZATION: DOWNSAMPLE RENDERING ---
  // Ensure we don't draw more pixels than available
  // Calculate a step size so we don't call fillRect millions of times
  const timeStep = Math.max(1, Math.floor(numTimeFrames / innerPlotWidth));
  const freqStep = Math.max(1, Math.floor(numFreqBins / plotHeight)); 
  // ----------------------------------------

  // Draw spectrogram
  for (let f = 0; f < numFreqBins; f += freqStep) {
    for (let t = 0; t < numTimeFrames; t += timeStep) {
      const mag = spectrogramData[f][t];
      const normalized = (mag - minMag) / magRange;

      const color = getHeatMapColor(normalized);

      // Map array index to canvas coordinate
      const x = padding.left + (t / numTimeFrames) * innerPlotWidth;
      const y = padding.top + (1 - f / numFreqBins) * plotHeight - (cellHeight * freqStep);

      ctx.fillStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
      
      // Draw a rectangle that covers the step area
      // Ensure width is at least 1px
      const rectW = Math.max(1, (cellWidth * timeStep)); 
      const rectH = Math.max(1, (cellHeight * freqStep));
      
      ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(rectW), Math.ceil(rectH));
    }
  }

  const colorBarCanvas = document.createElement('canvas');
  colorBarCanvas.width = colorBarWidth;
  colorBarCanvas.height = height;
  drawColorBar(colorBarCanvas, minMag, maxMag, options);

  ctx.drawImage(colorBarCanvas, plotWidth, 0);

  ctx.strokeStyle = options.axisColor || '#666';
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(padding.left, height - padding.bottom);
  ctx.lineTo(padding.left + innerPlotWidth, height - padding.bottom);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, height - padding.bottom);
  ctx.stroke();

  ctx.fillStyle = options.labelColor || '#fff';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';

  const timeSteps = 5;
  for (let i = 0; i <= timeSteps; i++) {
    const timeValue = (i / timeSteps) * duration;
    const x = padding.left + (i / timeSteps) * innerPlotWidth;
    ctx.fillText(timeValue.toFixed(2) + 's', x, height - padding.bottom + 20);
  }

  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const freqSteps = 5;
  const nyquistFrequency = sampleRate / 2;
  for (let i = 0; i <= freqSteps; i++) {
    const freqValue = (i / freqSteps) * nyquistFrequency;
    const y = padding.top + (1 - i / freqSteps) * plotHeight;
    ctx.fillText(Math.round(freqValue / 1000).toFixed(1) + ' kHz', padding.left - 10, y);
  }

  ctx.textAlign = 'center';
  ctx.fillText('Time (seconds)', padding.left + innerPlotWidth / 2, height - 10);

  ctx.save();
  ctx.translate(15, padding.top + plotHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Frequency (Hz)', 0, 0);
  ctx.restore();
};

const getHeatMapColor = (value) => {
  value = Math.max(0, Math.min(1, value));

  const stops = [
    { pos: 0.0, r: 204, g: 71, b: 120 },
    { pos: 0.20, r: 101, g: 21, b: 110 },
    { pos: 0.44, r: 0, g: 0, b: 0 },
    { pos: 0.52, r: 40, g: 11, b: 84 },
    { pos: 0.65, r: 164, g: 35, b: 96 },
    { pos: 0.83, r: 221, g: 81, b: 58 },
    { pos: 0.92, r: 247, g: 147, b: 32 },
    { pos: 1.0, r: 252, g: 255, b: 164 }
  ];

  for (let i = 0; i < stops.length - 1; i++) {
    const start = stops[i];
    const end = stops[i + 1];

    if (value >= start.pos && value <= end.pos) {
      const t = (value - start.pos) / (end.pos - start.pos);
      return {
        r: Math.floor(start.r + t * (end.r - start.r)),
        g: Math.floor(start.g + t * (end.g - start.g)),
        b: Math.floor(start.b + t * (end.b - start.b))
      };
    }
  }

  const last = stops[stops.length - 1];
  return { r: last.r, g: last.g, b: last.b };
};

/**
 * Draw waveform with fixed amplitude axis symmetric around average
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

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = options.backgroundColor || '#1a1a1a';
  ctx.fillRect(0, 0, width, height);

  const totalDuration = timeSeries.length / sampleRate;
  const startTime = options.startTime || 0;
  const visibleDuration = options.visibleDuration || totalDuration;
  const endTime = Math.min(startTime + visibleDuration, totalDuration);

  const startSample = Math.floor(startTime * sampleRate);
  const endSample = Math.floor(endTime * sampleRate);
  const visibleSamples = timeSeries.slice(
      Math.max(0, startSample),
      Math.min(timeSeries.length, endSample)
  );

  if (visibleSamples.length === 0) return;

  let minVal, maxVal, range, average;
  if (options.fixedAmplitudeRange) {
    minVal = options.fixedAmplitudeRange.min;
    maxVal = options.fixedAmplitudeRange.max;
    average = options.fixedAmplitudeRange.average;
    range = maxVal - minVal;
  } else {
    minVal = Math.min(...visibleSamples);
    maxVal = Math.max(...visibleSamples);
    average = (minVal + maxVal) / 2;
    range = maxVal - minVal || 1;

    const symmetricRange = Math.max(Math.abs(maxVal - average), Math.abs(average - minVal)) * 2;
    minVal = average - symmetricRange / 2;
    maxVal = average + symmetricRange / 2;
    range = symmetricRange;
  }

  // --- OPTIMIZATION: DOWNSAMPLE WAVEFORM ---
  const maxSamples = plotWidth;
  const step = Math.max(1, Math.floor(visibleSamples.length / maxSamples));
  const samples = [];
  for (let i = 0; i < visibleSamples.length; i += step) {
    samples.push(visibleSamples[i]);
  }
  // -----------------------------------------

  ctx.strokeStyle = options.lineColor || '#1FD5F9';
  ctx.lineWidth = options.lineWidth || 1;
  ctx.beginPath();

  for (let i = 0; i < samples.length; i++) {
    const x = padding.left + (i / (samples.length - 1 || 1)) * plotWidth;
    const normalizedValue = (samples[i] - minVal) / range;
    const y = height - padding.bottom - normalizedValue * plotHeight;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.stroke();

  const centerY = height - padding.bottom - ((average - minVal) / range) * plotHeight;
  ctx.strokeStyle = options.centerLineColor || '#666';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding.left, centerY);
  ctx.lineTo(width - padding.right, centerY);
  ctx.stroke();

  ctx.strokeStyle = options.axisColor || '#666';
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(padding.left, height - padding.bottom);
  ctx.lineTo(width - padding.right, height - padding.bottom);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, height - padding.bottom);
  ctx.stroke();

  ctx.fillStyle = options.labelColor || '#fff';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';

  const timeSteps = 6;
  for (let i = 0; i <= timeSteps; i++) {
    const timeValue = startTime + (i / timeSteps) * visibleDuration;
    const x = padding.left + (i / timeSteps) * plotWidth;
    ctx.fillText(timeValue.toFixed(2) + 's', x, height - padding.bottom + 20);
  }

  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const amplitudeSteps = 4;
  for (let i = 0; i <= amplitudeSteps; i++) {
    const amplitude = minVal + (i / amplitudeSteps) * range;
    const y = height - padding.bottom - (i / amplitudeSteps) * plotHeight;
    ctx.fillText(amplitude.toFixed(2), padding.left - 10, y);
  }

  ctx.textAlign = 'center';
  ctx.fillText('Time (seconds)', padding.left + plotWidth / 2, height - 15);

  ctx.save();
  ctx.translate(20, padding.top + plotHeight / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Amplitude', 0, 0);
  ctx.restore();
};

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