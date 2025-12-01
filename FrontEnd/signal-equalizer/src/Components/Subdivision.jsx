import React, { useState, useEffect } from "react";
import DraggableSlider from "./DraggableSlider";

const Subdivision = ({
                       bands = [],
                       onBandChange,
                       onBandPositionChange,
                       onBandBandwidthChange,
                       onRemoveBand,
                       bandsPosition = "below",
                       onDragStart,
                       frequencyArr,
                       disabled = false,
                     }) => {
  const [localBands, setLocalBands] = useState([]);
  const [activeBandId, setActiveBandId] = useState(null);
  const [bandRows, setBandRows] = useState({});

  // Row configuration
  const ROW_HEIGHT = 160;
  const ROW_MARGIN_TOP = 130;

  // Initialize bands with positions and bandwidth
  useEffect(() => {
    if (bands.length > 0) {
      const bandsWithProperties = bands.map((band, index) => ({
        ...band,
        position: band.position !== undefined ? band.position : 50, // Default to center
        bandwidth: band.bandwidth !== undefined ? band.bandwidth : 1,
        row: band.row || 0,
      }));
      setLocalBands(bandsWithProperties);
    } else {
      setLocalBands([]);
    }
  }, [bands]);

  // Calculate dynamic frequency range
  const getDynamicFrequencyRange = () => {
    if (!frequencyArr || frequencyArr.length === 0) {
      return { minFreq: 20, maxFreq: 20000 };
    }

    const validFrequencies = frequencyArr.filter(freq =>
        typeof freq === 'number' && freq > 0 && isFinite(freq)
    );

    if (validFrequencies.length === 0) {
      return { minFreq: 20, maxFreq: 20000 };
    }

    const minFreq = Math.max(20, Math.min(...validFrequencies));
    const maxFreq = Math.min(20000, Math.max(...validFrequencies));

    return { minFreq, maxFreq };
  };

  const { minFreq, maxFreq } = getDynamicFrequencyRange();

  // Update frequency conversion functions to use dynamic range
  const freqToPosition = (freq) => {
    const minLog = Math.log10(minFreq);
    const maxLog = Math.log10(maxFreq);
    const freqLog = Math.log10(freq);
    return ((freqLog - minLog) / (maxLog - minLog)) * 100;
  };

  const positionToFreq = (position) => {
    const minLog = Math.log10(minFreq);
    const maxLog = Math.log10(maxFreq);
    const freqLog = minLog + (position / 100) * (maxLog - minLog);
    return Math.pow(10, freqLog);
  };

  // Update frequency markers to use dynamic range
  const generateFrequencyMarkers = () => {
    const { minFreq, maxFreq } = getDynamicFrequencyRange();

    // Standard frequency points (logarithmically spaced)
    const standardFreqs = [20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 15000, 20000];

    // Filter to include only frequencies within our dynamic range
    const filteredFrequencies = standardFreqs.filter(freq =>
        freq >= minFreq && freq <= maxFreq
    );

    return filteredFrequencies.map(freq => ({
      freq,
      label: freq < 1000 ? `${freq}Hz` : `${freq/1000}kHz`
    }));
  };

  const frequencies = generateFrequencyMarkers();
  const majorFrequencies = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000].filter(
      freq => freq >= minFreq && freq <= maxFreq
  );

  // Update calculateFrequencyRange to use dynamic min/max
  const calculateFrequencyRange = (band) => {
    const centerFreq = positionToFreq(band.position);
    const bandwidth = band.bandwidth || 1;
    const minLog = Math.log10(minFreq);
    const maxLog = Math.log10(maxFreq);
    const centerLog = Math.log10(centerFreq);
    const range = (maxLog - minLog) * (bandwidth * 0.02);

    const lowerFreq = Math.pow(10, centerLog - range);
    const upperFreq = Math.pow(10, centerLog + range);

    return {
      lower: Math.max(minFreq, lowerFreq),
      upper: Math.min(maxFreq, upperFreq),
    };
  };

  // Overlap detection
  const doRangesOverlap = (rangeA, rangeB) => {
    return rangeA.lower < rangeB.upper && rangeA.upper > rangeB.lower;
  };

  // NEW: Row assignment with active band priority
  const assignBandsToRowsWithPriority = (bands, activeBandId) => {
    if (bands.length === 0) return {};

    // Separate active band from others
    const activeBand = bands.find(band => band.id === activeBandId);
    const otherBands = bands.filter(band => band.id !== activeBandId);

    // Start with active band in its current row (or row 0 if not set)
    const rows = [];
    const bandRowMap = {};

    // Initialize rows array
    const maxExistingRow = Math.max(...bands.map(band => band.row || 0), 0);
    for (let i = 0; i <= maxExistingRow + 2; i++) {
      rows.push([]);
    }

    // Place active band first in its current row
    if (activeBand) {
      const activeRow = activeBand.row || 0;
      rows[activeRow].push(activeBand);
      bandRowMap[activeBand.id] = activeRow;
    }

    // Sort other bands by their starting frequency
    const sortedOtherBands = [...otherBands].sort((a, b) => {
      const rangeA = calculateFrequencyRange(a);
      const rangeB = calculateFrequencyRange(b);
      return rangeA.lower - rangeB.lower;
    });

    // Assign other bands around the active band
    sortedOtherBands.forEach(band => {
      const bandRange = calculateFrequencyRange(band);
      let assignedRow = 0;

      // Find the first row where this band doesn't overlap with existing bands
      while (assignedRow < rows.length) {
        const rowBands = rows[assignedRow];
        const hasOverlap = rowBands.some(existingBand => {
          // Skip if this is the active band and we're checking its row
          // (active band gets priority and stays in its row)
          if (existingBand.id === activeBandId && assignedRow === (activeBand?.row || 0)) {
            const existingRange = calculateFrequencyRange(existingBand);
            return doRangesOverlap(bandRange, existingRange);
          }
          // For non-active bands, check all overlaps
          const existingRange = calculateFrequencyRange(existingBand);
          return doRangesOverlap(bandRange, existingRange);
        });

        if (!hasOverlap) {
          break;
        }
        assignedRow++;
      }

      // If no existing row works, create a new one
      if (assignedRow >= rows.length) {
        rows.push([]);
      }

      rows[assignedRow].push(band);
      bandRowMap[band.id] = assignedRow;
    });

    return bandRowMap;
  };

  // Update rows when bands change or active band changes - FIXED: Prevent infinite loop
  useEffect(() => {
    if (localBands.length > 0) {
      const newBandRows = activeBandId
          ? assignBandsToRowsWithPriority(localBands, activeBandId)
          : assignBandsToRows(localBands);

      setBandRows(newBandRows);

      // Only update localBands if the row assignments actually changed
      const hasRowAssignmentsChanged = localBands.some(band =>
          band.row !== (newBandRows[band.id] || 0)
      );

      if (hasRowAssignmentsChanged) {
        setLocalBands(prevBands =>
            prevBands.map(band => ({
              ...band,
              row: newBandRows[band.id] || 0
            }))
        );
      }
    }
  }, [localBands, activeBandId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Original row assignment (for when no band is active)
  const assignBandsToRows = (bands) => {
    if (bands.length === 0) return {};

    const sortedBands = [...bands].sort((a, b) => {
      const rangeA = calculateFrequencyRange(a);
      const rangeB = calculateFrequencyRange(b);
      return rangeA.lower - rangeB.lower;
    });

    const rows = [];
    const bandRowMap = {};

    sortedBands.forEach(band => {
      const bandRange = calculateFrequencyRange(band);
      let assignedRow = 0;

      while (assignedRow < rows.length) {
        const rowBands = rows[assignedRow];
        const hasOverlap = rowBands.some(existingBand => {
          const existingRange = calculateFrequencyRange(existingBand);
          return doRangesOverlap(bandRange, existingRange);
        });

        if (!hasOverlap) break;
        assignedRow++;
      }

      if (assignedRow >= rows.length) {
        rows.push([]);
      }

      rows[assignedRow].push(band);
      bandRowMap[band.id] = assignedRow;
    });

    return bandRowMap;
  };

  // Handle band position change
  const handleBandPositionChange = (bandId, newPosition, isActiveModification = false) => {
    if (disabled) return; // Don't allow changes when disabled

    if (isActiveModification) {
      setActiveBandId(bandId);
    }

    setLocalBands((prevBands) =>
        prevBands.map((band) =>
            band.id === bandId ? { ...band, position: newPosition } : band
        )
    );

    if (onBandPositionChange) {
      onBandPositionChange(bandId, newPosition);
    }
  };

  // Handle band gain change
  const handleBandGainChange = (bandId, newValue) => {
    if (disabled) return; // Don't allow changes when disabled

    setLocalBands((prevBands) =>
        prevBands.map((band) =>
            band.id === bandId ? { ...band, value: newValue } : band
        )
    );

    if (onBandChange) {
      onBandChange(bandId, [newValue]);
    }
  };

  // Handle band bandwidth change
  const handleBandBandwidthChange = (bandId, newBandwidth, isActiveModification = false) => {
    if (disabled) return; // Don't allow changes when disabled

    if (isActiveModification) {
      setActiveBandId(bandId);
    }

    setLocalBands((prevBands) =>
        prevBands.map((band) =>
            band.id === bandId ? { ...band, bandwidth: newBandwidth } : band
        )
    );

    if (onBandBandwidthChange) {
      onBandBandwidthChange(bandId, newBandwidth);
    }
  };

  // Handle band removal
  const handleRemoveBand = (bandId) => {
    if (disabled) return; // Don't allow changes when disabled

    setLocalBands((prevBands) =>
        prevBands.filter((band) => band.id !== bandId)
    );

    if (onRemoveBand) {
      onRemoveBand(bandId);
    }
  };

  // Reset active band when mouse is released anywhere
  useEffect(() => {
    const handleMouseUp = () => {
      setActiveBandId(null);
    };

    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Calculate container height based on rows
  const maxRow = Math.max(...Object.values(bandRows), 0);
  const containerHeight = 400 + (maxRow * ROW_HEIGHT) + (maxRow > 0 ? ROW_MARGIN_TOP * maxRow : 0);

  return (
      <div
          className="subdivision-container"
          style={{
            position: "relative",
            width: "100%",
            height: `${containerHeight}px`,
            minHeight: `${containerHeight}px`,
            backgroundColor: "#1a1a1a",
            borderRadius: "8px",
            padding: "10px",
            border: "1px solid #374151",
            opacity: disabled ? 0.6 : 1,
            pointerEvents: disabled ? 'none' : 'auto',
          }}
      >
        {/* Main frequency visualization area */}
        <div
            style={{
              position: "relative",
              width: "100%",
              height: "fit-content",
              padding: "0 10px",
            }}
        >
          {/* Frequency line */}
          <div
              style={{
                position: "absolute",
                top: "30px",
                left: "10px",
                right: "10px",
                height: "2px",
                backgroundColor: "#4B5563",
                zIndex: 5,
              }}
          />

          {/* Frequency markers */}
          {frequencies.map((freqObj, index) => {
            const position = freqToPosition(freqObj.freq);
            const isMajor = majorFrequencies.includes(freqObj.freq);

            return (
                <div
                    key={index}
                    style={{
                      position: "absolute",
                      left: `${position}%`,
                      top: "25px",
                      transform: "translateX(-50%)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      zIndex: 5,
                    }}
                >
                  <div
                      style={{
                        width: isMajor ? "2px" : "1px",
                        height: isMajor ? "12px" : "8px",
                        backgroundColor: isMajor ? "#1FD5F9" : "#6B7280",
                      }}
                  />
                  {isMajor && (
                      <div
                          style={{
                            marginTop: "14px",
                            fontSize: "9px",
                            color: "#e5e7eb",
                            fontWeight: "500",
                            whiteSpace: "nowrap",
                          }}
                      >
                        {freqObj.label}
                      </div>
                  )}
                </div>
            );
          })}

          {/* Render draggable bands */}
          {localBands.map((band) => (
              <DraggableSlider
                  key={band.id}
                  band={band}
                  onGainChange={handleBandGainChange}
                  onPositionChange={handleBandPositionChange}
                  onBandwidthChange={handleBandBandwidthChange}
                  onRemove={handleRemoveBand}
                  bandsPosition={bandsPosition}
                  positionToFreq={positionToFreq}
                  freqToPosition={freqToPosition}
                  isActive={band.id === activeBandId}
                  rowHeight={ROW_HEIGHT}
                  rowMarginTop={ROW_MARGIN_TOP}
                  onDragStart={onDragStart}
                  disabled={disabled}
              />
          ))}
        </div>
      </div>
  );
};

export default Subdivision;