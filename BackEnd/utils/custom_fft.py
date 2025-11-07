import numpy as np

def custom_fft(x):
    """
    Computes the Discrete Fourier Transform (DFT) of a 1D array x using the
    Cooley-Tukey Radix-2 Decimation-In-Time (DIT) Fast Fourier Transform (FFT) algorithm.
    
    NOTE: This implementation does NOT use np.fft.
    
    Args:
        x (np.ndarray): Input signal (time-domain).
        
    Returns:
        np.ndarray: The frequency spectrum (complex numbers).
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

# utils/custom_fft.py (continuing the file)

def custom_ifft(X):
    """
    Computes the Inverse Discrete Fourier Transform (IDFT) of a 1D spectrum X
    using the custom_fft function.
    
    Args:
        X (np.ndarray): Input frequency spectrum (complex numbers).
        
    Returns:
        np.ndarray: The reconstructed time-domain signal (complex numbers).
    """
    N = len(X)
    
    # 1. Take the FFT of the conjugate of the spectrum
    x_n = custom_fft(np.conj(X))
    
    # 2. Divide by N and take the conjugate again
    return np.conj(x_n) / N



def get_fft_components(X, Fs):
    """
    Calculates the magnitude (in dB) and phase of the single-sided spectrum.
    
    Args:
        X (np.ndarray): Complex frequency spectrum from custom_fft.
        Fs (int): Sampling rate.
        
    Returns:
        tuple: (frequencies, magnitudes_db, phases)
    """
    N = len(X)
    # Single-sided spectrum (positive frequencies only)
    single_sided_X = X[:N//2]
    
    # Magnitude (scaled by 2/N)
    magnitudes = np.abs(single_sided_X)
    
    # Convert to dB (avoid log(0) by adding a small epsilon)
    magnitudes_db = 20 * np.log10(magnitudes / (N/2) + 1e-12)
    
    # Phase
    phases = np.angle(single_sided_X)
    
    # Frequency axis
    frequencies = np.linspace(0, Fs/2, N//2, endpoint=False)
    
    return frequencies, magnitudes_db, phases