import numpy as np

def custom_fft(x):
    """
    Computes the Discrete Fourier Transform (DFT) of a 1D array x using the
    Cooley-Tukey Radix-2 Decimation-In-Time (DIT) Fast Fourier Transform (FFT) algorithm.
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
    even = custom_fft(x[::2]) # DFT of even-indexed samples
    odd = custom_fft(x[1::2])  # DFT of odd-indexed samples

    # Combine step (Butterfly operation)
    k = np.arange(N // 2)
    twiddle_factor = np.exp(-2j * np.pi * k / N)
    
    left_half = even + twiddle_factor * odd
    right_half = even - twiddle_factor * odd
    
    return np.concatenate([left_half, right_half])

def custom_ifft(X):
    """
    Computes the Inverse Discrete Fourier Transform (IDFT) of a 1D spectrum X.
    """
    N = len(X)
    
    # 1. Take the FFT of the conjugate of the spectrum
    x_n = custom_fft(np.conj(X))
    
    # 2. Divide by N and take the conjugate again
    return np.conj(x_n) / N