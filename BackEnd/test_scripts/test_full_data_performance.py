import numpy as np
from pydub import AudioSegment
import time
import os

# --- 1. CONFIGURATION ---

# IMPORTANT: Set the path to your input audio file
TEST_FILE_INPUT = 'input.wav' 

# --- 2. SIMULATION OF USER'S CORE DSP UTILITIES ---

def load_audio_to_numpy(filepath):
    """ Loads an audio file into a 1D float NumPy array and gets the sampling rate (Fs). 
        (Based on BackEnd/utils/audio_util.py)
    """
    try:
        audio = AudioSegment.from_file(filepath)
        
        # Downmix to mono if stereo
        if audio.channels > 1:
            audio = audio.set_channels(1)

        Fs = audio.frame_rate
        
        # Get raw samples and convert to float64
        samples = np.array(audio.get_array_of_samples())
        
        # Determine max value for normalization
        dtype = samples.dtype
        max_val = np.iinfo(dtype).max
        
        # Normalize to float array [-1.0, 1.0]
        signal_float = samples.astype(np.float64) / max_val
        
        return signal_float, Fs
        
    except Exception as e:
        print(f"Error processing audio file with pydub: {e}")
        return None, None


def custom_fft(x):
    """
    Computes the Discrete Fourier Transform (DFT) of a 1D array x using the
    Cooley-Tukey Radix-2 Decimation-In-Time (DIT) Fast Fourier Transform (FFT) algorithm.
    (Based on BackEnd/utils/custom_fft.py)
    """
    N = len(x)
    
    # --- 1. Handle Padding (Ensure N is a power of 2) ---
    if N & (N - 1) != 0:
        # N is not a power of 2. Pad with zeros to the next power of 2.
        next_power_of_2 = 1 << (N - 1).bit_length()
        x_padded = np.zeros(next_power_of_2, dtype=x.dtype)
        x_padded[:N] = x
        x = x_padded
        N = next_power_of_2

    # --- 2. Base Case ---
    if N <= 1:
        return x

    # --- 3. Recursive DIT-FFT ---
    # Divide step
    even = custom_fft(x[::2]) # DFT of even-indexed samples
    odd = custom_fft(x[1::2])  # DFT of odd-indexed samples

    # Combine step (Butterfly operation)
    k = np.arange(N // 2)
    # Twiddle factors: W_N^k = exp(-j * 2 * pi * k / N)
    twiddle_factor = np.exp(-2j * np.pi * k / N)
    
    # Butterfly calculation
    left_half = even + twiddle_factor * odd
    right_half = even - twiddle_factor * odd
    
    return np.concatenate([left_half, right_half])


# --- 3. MAIN TEST LOGIC ---

def run_performance_test():
    
    # Check file existence
    if not os.path.exists(TEST_FILE_INPUT):
        print(f"ERROR: Input file not found at '{TEST_FILE_INPUT}'. Please check path.")
        return

    print("--- Starting Full DSP Pipeline Performance Test ---")

    # A. Load Audio (Time Domain Extraction)
    start_load = time.time()
    signal_time_series, Fs = load_audio_to_numpy(TEST_FILE_INPUT)
    end_load = time.time()
    
    if signal_time_series is None:
        print("Test Aborted.")
        return

    N = len(signal_time_series)
    N_padded = 1 << (N - 1).bit_length() if N & (N - 1) != 0 else N

    # B. Run Custom FFT (Frequency Domain Calculation)
    start_fft = time.time()
    fft_data_full = custom_fft(signal_time_series)
    end_fft = time.time()

    
    # --- C. DISPLAY RESULTS ---
    print("\n--- PERFORMANCE & DATA SUMMARY ---")
    
    # 1. Timing Results
    load_time = end_load - start_load
    fft_time = end_fft - start_fft
    total_time = end_fft - start_load
    
    print(f"1. Total Time Elapsed: {total_time:.4f} seconds")
    print(f"   - Audio Loading Time: {load_time:.4f} seconds")
    print(f"   - Custom FFT Calculation Time: {fft_time:.4f} seconds (CPU intensive)")
    
    # 2. Signal Properties
    print(f"\n2. Signal Properties:")
    print(f"   - Sampling Rate (Fs): {Fs} Hz")
    print(f"   - Signal Length (Samples): {N}")
    print(f"   - FFT Array Size (Padded N): {len(fft_data_full)} (Padded to {N_padded})")
    print(f"   - Duration: {N / Fs:.2f} seconds")

    # 3. Full Time Series Data Snippet
    print(f"\n3. Full Time Series Data Snippet (10 samples):")
    # This snippet represents the start of the full time vs magnitude array the API would return.
    print("   ", signal_time_series[:10].tolist())


if __name__ == '__main__':
    run_performance_test()