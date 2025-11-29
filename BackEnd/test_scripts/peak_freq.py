import numpy as np
from scipy.io import wavfile
from scipy.signal import find_peaks, peak_widths
import json
import matplotlib.pyplot as plt

# --- CONFIGURATION ---
INPUT_FILE = '../output/AI/vocals.wav'
OUTPUT_JSON = '../output/dominant_freqs.json'

# Tuning parameters for peak detection
# MIN_HEIGHT_FACTOR: Only consider peaks that are at least this fraction of the max peak (0.1 = 10%)
MIN_HEIGHT_FACTOR = 0.1 
# DISTANCE_HZ: Minimum distance between peaks in Hz to avoid picking up jagged noise on the same peak
DISTANCE_HZ = 50 
# REL_HEIGHT: Where to measure the width (0.5 = width at 50% height, 1.0 = base width). 
# 0.6 is usually good for capturing the "body" of the frequency.
REL_HEIGHT = 0.6 

def analyze_peaks_and_export():
    try:
        # 1. Read the audio file
        rate, data = wavfile.read(INPUT_FILE)
        
        # Convert to mono if stereo
        if data.ndim > 1:
            data = data.mean(axis=1)

        # 2. Perform FFT
        N = len(data)
        # Use rfft for real-valued input (more efficient, returns positive freqs only)
        yf = np.fft.rfft(data)
        xf = np.fft.rfftfreq(N, 1 / rate)
        
        # Calculate Magnitude
        magnitudes = np.abs(yf)

        # 3. Detect Peaks
        # We need to convert our Hz distance to array index distance
        freq_resolution = xf[1] - xf[0]
        distance_indices = int(DISTANCE_HZ / freq_resolution)
        
        # Define minimum height based on the loudest peak
        max_mag = np.max(magnitudes)
        min_height = max_mag * MIN_HEIGHT_FACTOR

        peaks_indices, properties = find_peaks(
            magnitudes, 
            height=min_height, 
            distance=distance_indices
        )

        # 4. Calculate Peak Widths (Start and End Frequencies)
        # width_results returns: widths, width_heights, left_ips, right_ips
        # left_ips and right_ips are interpolated indices of the start/end
        widths, width_heights, left_ips, right_ips = peak_widths(
            magnitudes, 
            peaks_indices, 
            rel_height=REL_HEIGHT
        )

        # 5. Format Data for JSON
        freq_ranges = []
        
        print(f"Found {len(peaks_indices)} dominant peaks.")
        
        for i, peak_idx in enumerate(peaks_indices):
            # Convert indices to Hz
            center_hz = xf[peak_idx]
            
            # The width results are interpolated float indices, convert to Hz
            start_hz = left_ips[i] * freq_resolution
            end_hz = right_ips[i] * freq_resolution
            
            # Round to integers for cleaner JSON
            freq_obj = {
                "freq_start_hz": int(round(start_hz)),
                "freq_end_hz": int(round(end_hz)),
                "peak_hz": int(round(center_hz)) # Optional: useful to see where the center is
            }
            freq_ranges.append(freq_obj)
            print(f"Peak at {int(center_hz)} Hz -> Range: {int(start_hz)}-{int(end_hz)} Hz")

        output_data = {
            "freq": freq_ranges
        }

        # 6. Save to JSON
        with open(OUTPUT_JSON, 'w') as f:
            json.dump(output_data, f, indent=4)
        
        print(f"Successfully exported ranges to {OUTPUT_JSON}")

        # 7. (Optional) Visualize the detection
        plt.figure(figsize=(12, 6))
        plt.plot(xf, magnitudes, color='blue', alpha=0.6, label='Spectrum')
        plt.plot(xf[peaks_indices], magnitudes[peaks_indices], "x", color='red', label='Peaks')
        
        # Draw the detected widths
        for i in range(len(peaks_indices)):
            plt.hlines(width_heights[i], 
                       left_ips[i] * freq_resolution, 
                       right_ips[i] * freq_resolution, 
                       color="orange", linewidth=2)

        plt.title(f'Detected Frequency Ranges (Min Height: {MIN_HEIGHT_FACTOR*100}%)')
        plt.xlabel('Frequency (Hz)')
        plt.ylabel('Magnitude')
        plt.legend()
        plt.xlim(0, 5000) # Zoom into relevant musical range
        plt.show()

    except FileNotFoundError:
        print(f"Error: Could not find {INPUT_FILE}")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    analyze_peaks_and_export()