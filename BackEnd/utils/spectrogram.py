import numpy as np
import os, sys

# Assuming utils is the parent directory
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__))))
from custom_fft import custom_fft 

def custom_spectrogram(signal, Fs, window_size=1024, overlap_ratio=0.5):
    """
    Computes the spectrogram of a signal using the custom FFT implementation (STFT).
    """
    N = len(signal)
    
    overlap = int(window_size * overlap_ratio)
    step_size = window_size - overlap
    
    window = np.hamming(window_size)
    num_frames = (N - overlap) // step_size
    
    spectrogram_matrix = np.zeros((num_frames, window_size // 2), dtype=np.float64)
    
    for i in range(num_frames):
        start_index = i * step_size
        end_index = start_index + window_size
        
        frame = signal[start_index:end_index]
        windowed_frame = frame * window
        
        spectrum = custom_fft(windowed_frame)
        magnitude = np.abs(spectrum[:window_size // 2])
        
        # Convert magnitude to dB for visualization
        magnitude_db = 20 * np.log10(magnitude + 1e-12) 
        spectrogram_matrix[i, :] = magnitude_db

    return spectrogram_matrix.T # (Frequency_Bins x Time_Frames)