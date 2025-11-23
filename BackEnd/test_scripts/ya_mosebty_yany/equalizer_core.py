import numpy as np

def apply_equalization(fft_data, Fs, eq_scheme):
    """
    Applies gain scaling to specific frequency bands in the FFT data.
    """
    N = len(fft_data)
    
    # Create a mask initialized to 1 (no change)
    # We use complex scaling to preserve phase, but scale factor is usually real
    mask = np.ones(N, dtype=np.float64)
    
    # Calculate frequency for each bin up to Nyquist
    # freq = index * Fs / N
    frequencies = np.fft.fftfreq(N, d=1/Fs)
    
    for band in eq_scheme:
        low = band['freq_start_hz']
        high = band['freq_end_hz']
        scale = band['scale_factor']
        
        # Find indices within this frequency band
        # We must handle positive and negative frequencies for symmetry
        # frequencies array has usually [0, 1, ..., N/2-1, -N/2, ..., -1]
        
        # Apply to frequencies that match magnitude (abs) to cover pos and neg
        idx = np.where((np.abs(frequencies) >= low) & (np.abs(frequencies) <= high))
        
        # Apply the scale factor to the mask at these indices
        mask[idx] *= scale
        
    # Multiply the original FFT data by the calculated mask
    return fft_data * mask