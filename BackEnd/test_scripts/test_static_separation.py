import numpy as np
import soundfile as sf
from pydub import AudioSegment
import os
import array

# --- 1. CONFIGURATION ---

# IMPORTANT: Ensure this path is correct relative to where you run the script.
TEST_FILE_INPUT = 'input/input.wav' 

# Define the revised frequency ranges for separation (passbands)
MUSICAL_SEPARATION_RANGES = {
    "vocals":    {"freq_start_hz": 300,   "freq_end_hz": 4000},   # Focusing on intelligibility band
    "drums":     {"freq_start_hz": 5000,  "freq_end_hz": 15000},  # Focusing on cymbals and high transients
    "bass":      {"freq_start_hz": 50,    "freq_end_hz": 250},    # Focusing on pure low-end power
    "other":     {"freq_start_hz": 150,   "freq_end_hz": 2000},   # Focusing on instrument body/mids
}


# --- 2. SIMULATION OF DSP CORE FUNCTIONS (Uses NumPy for simplicity) ---

def custom_fft(x):
    """ Simulates custom_fft. """
    return np.fft.fft(x) 

def custom_ifft(X):
    """ Simulates custom_ifft. """
    return np.fft.ifft(X)

def apply_equalization_for_isolation(full_fft_data, Fs, pass_band_start, pass_band_end):
    """
    Simulates the core logic: Zero out ALL frequencies EXCEPT the source's range.
    Uses a linear scale factor of 1.0 (unity gain) for the passband.
    """
    N = len(full_fft_data)
    # Start with a zeroed array to hold ONLY the isolated frequency components
    isolated_fft = np.zeros_like(full_fft_data, dtype=complex)
    freq_step = Fs / N

    # Calculate array indices for the pass band (positive frequencies)
    k_start = int(np.floor(pass_band_start / freq_step))
    k_end = int(np.ceil(pass_band_end / freq_step))

    k_end_max = N // 2
    k_start = max(0, k_start)
    k_end = min(k_end_max, k_end)

    # 1. Isolate positive frequencies: Copy the FFT data only within the range
    isolated_fft[k_start:k_end] = full_fft_data[k_start:k_end]

    # 2. Isolate negative frequencies (conjugate symmetry)
    if k_start > 0:
        k_neg_start = N - k_end
        k_neg_end = N - k_start
        isolated_fft[k_neg_start:k_neg_end] = full_fft_data[k_neg_start:k_neg_end]

    return isolated_fft

# --- 3. I/O UTILITIES ---

def load_audio_to_numpy(filepath):
    """ Loads an audio file (simulating audio_util.py) """
    try:
        audio = AudioSegment.from_file(filepath)
        if audio.channels > 1:
            audio = audio.set_channels(1)

        Fs = audio.frame_rate
        samples = np.array(audio.get_array_of_samples())
        max_val = np.iinfo(samples.dtype).max
        signal_float = samples.astype(np.float64) / max_val
        
        return signal_float, Fs
        
    except Exception as e:
        print(f"Error processing audio file: {e}. Check if dependencies (like FFmpeg for pydub) are installed.")
        return None, None

def save_numpy_to_wav(signal_float, Fs, filepath):
    """ Saves a float NumPy array to a WAV file (simulating audio_util.py) """
    sf.write(filepath, signal_float, Fs, format='WAV', subtype='PCM_16')

# --- 4. MAIN TEST LOGIC ---

def run_static_separation_test():
    """ Executes the simulation of filtering-based separation. """
    print(f"--- 1. Loading Input File: {TEST_FILE_INPUT} ---")
    mix_time_series, Fs = load_audio_to_numpy(TEST_FILE_INPUT)
    
    if mix_time_series is None:
        print("FATAL: Could not load input audio file. Check path and format.")
        return

    print("--- 2. Performing FFT on the Mixed Signal ---")
    full_fft_data = custom_fft(mix_time_series)

    for source_name, band in MUSICAL_SEPARATION_RANGES.items():
        output_filename = f"output/equalizer/{source_name}.wav" # DISTINCT OUTPUT NAME
        
        print(f"\n--- Isolating '{source_name}' ({band['freq_start_hz']} Hz - {band['freq_end_hz']} Hz) ---")
        
        # A. Apply static filtering (isolation)
        isolated_fft = apply_equalization_for_isolation(
            full_fft_data, Fs, band['freq_start_hz'], band['freq_end_hz']
        )
        
        # B. Inverse FFT to convert back to time domain
        isolated_time_series_complex = custom_ifft(isolated_fft)
        
        # C. Save the separated source (only using the real part)
        isolated_time_series_real = isolated_time_series_complex.real
        save_numpy_to_wav(isolated_time_series_real, Fs, output_filename)
        
        print(f"  -> Saved output to {output_filename}")
        
    print("\n--- Test Complete ---")

if __name__ == "__main__":
    run_static_separation_test()
