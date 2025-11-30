import numpy as np
import soundfile as sf
from pydub import AudioSegment
import os

# --- 1. CONFIGURATION ---

# Path to your input file
TEST_FILE_INPUT = r'../input/animals.wav' 

# REVISED: Now accepts a LIST of frequency ranges for each instrument.
# You can add as many bands as you want for a single instrument.
MUSICAL_SEPARATION_RANGES = {
"vocals": [
    { "freq_start_hz": 200, "freq_end_hz": 800 }
],


    "drums": [
        {"freq_start_hz": 800,  "freq_end_hz": 3000}
    ],
    "bass": [
        {"freq_start_hz": 3000, "freq_end_hz": 5000}
    ],
    "other": [
        {"freq_start_hz": 5000, "freq_end_hz": 8000 }
    ]
}

# --- 2. SIMULATION OF DSP CORE FUNCTIONS ---

def custom_fft(x):
    """ Simulates custom_fft. """
    return np.fft.fft(x) 

def custom_ifft(X):
    """ Simulates custom_ifft. """
    return np.fft.ifft(X)

def apply_equalization_for_isolation(full_fft_data, Fs, frequency_ranges):
    """
    Simulates the core logic: Zero out ALL frequencies EXCEPT the source's ranges.
    Accepts a LIST of ranges (bands) and combines them.
    """
    N = len(full_fft_data)
    # Start with a zeroed array to hold ONLY the isolated frequency components
    isolated_fft = np.zeros_like(full_fft_data, dtype=complex)
    freq_step = Fs / N

    # Iterate over every band defined for this instrument
    for band in frequency_ranges:
        pass_band_start = band["freq_start_hz"]
        pass_band_end = band["freq_end_hz"]

        # Calculate array indices for the pass band (positive frequencies)
        k_start = int(np.floor(pass_band_start / freq_step))
        k_end = int(np.ceil(pass_band_end / freq_step))

        k_end_max = N // 2
        k_start = max(0, k_start)
        k_end = min(k_end_max, k_end)

        # 1. Isolate positive frequencies: Copy the FFT data 
        # (+= allows overlapping bands without issues, though = is fine if distinct)
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
        
        # Handle different bit depths
        if samples.dtype == np.int16:
            max_val = 32768
        elif samples.dtype == np.int32:
            max_val = 2147483648
        else:
            max_val = np.iinfo(samples.dtype).max
            
        signal_float = samples.astype(np.float64) / max_val
        
        return signal_float, Fs
        
    except Exception as e:
        print(f"Error processing audio file: {e}. Check if dependencies (like FFmpeg) are installed.")
        return None, None

def save_numpy_to_wav(signal_float, Fs, filepath):
    """ Saves a float NumPy array to a WAV file """
    # Ensure directory exists
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
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

    # Create output directory
    output_dir = r"../output/output_stems/animals"
    
    for source_name, bands in MUSICAL_SEPARATION_RANGES.items():
        output_filename = f"{output_dir}/{source_name}.wav"
        
        # Print info about all bands being processed for this instrument
        print(f"\n--- Isolating '{source_name}' ---")
        for i, band in enumerate(bands):
            print(f"   Band {i+1}: {band['freq_start_hz']} Hz - {band['freq_end_hz']} Hz")
        
        # A. Apply static filtering (isolation) with MULTIPLE bands
        isolated_fft = apply_equalization_for_isolation(
            full_fft_data, Fs, bands
        )
        
        # B. Inverse FFT to convert back to time domain
        isolated_time_series_complex = custom_ifft(isolated_fft)
        
        # C. Save the separated source (only using the real part)
        isolated_time_series_real = isolated_time_series_complex.real
        save_numpy_to_wav(isolated_time_series_real, Fs, output_filename)
        
        print(f"   -> Saved output to {output_filename}")
        
    print(f"\n--- Test Complete. Check the '{output_dir}' folder. ---")

if __name__ == "__main__":
    run_static_separation_test()