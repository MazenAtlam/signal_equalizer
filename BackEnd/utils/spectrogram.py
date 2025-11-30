import numpy as np
import os, sys

# Assuming utils is the parent directory
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__))))
from custom_fft import custom_fft 

#Fs: Sample rate is passed in but not actually used in the calculation loop, it is typically needed later to label the Y-axis correctly.

def custom_spectrogram(signal, Fs, window_size=1024, overlap_ratio=0.5):
    """
    Computes the spectrogram of a signal using the custom FFT implementation (STFT).
    """
    N = len(signal)
    
    overlap = int(window_size * overlap_ratio)
    step_size = window_size - overlap

    # We multiply the chunk by a "Window Function" (like a Hamming window). This is a bell curve that gradually fades the signal to zero at the edges, removing the sharp cuts.
    window = np.hamming(window_size)
    num_frames = (N - overlap) // step_size
    
    # divide by 2 as The FFT output is symmetric for real-valued signals (audio). The second half is a mirror image of the first (negative frequencies), so we discard it to save space.
    spectrogram_matrix = np.zeros((num_frames, window_size // 2), dtype=np.float64)
    
    for i in range(num_frames):
        start_index = i * step_size
        end_index = start_index + window_size
        
        frame = signal[start_index:end_index]
        windowed_frame = frame * window  # element-wise multiplication
        
        spectrum = custom_fft(windowed_frame)
        magnitude = np.abs(spectrum[:window_size // 2])  # .abs Calculates the Magnitude divide by 2 as before
        
        # Convert magnitude to dB for visualization
        magnitude_db = 20 * np.log10(magnitude + 1e-12)  # This adds a tiny number (epsilon).if the magnitude is exactly 0 prevents the code from crashing.
        spectrogram_matrix[i, :] = magnitude_db

    return spectrogram_matrix.T # (Frequency_Bins x Time_Frames)