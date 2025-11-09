import numpy as np

def apply_equalization(full_fft_data, Fs, equalization_scheme):
    """
    Applies gain adjustments to the FFT data based on the equalization scheme.

    Args:
        full_fft_data (np.ndarray): The complex array of the full (two-sided) FFT.
        Fs (int): Sampling rate.
        equalization_scheme (list): List of band objects with frequency range and gain_db.

    Returns:
        np.ndarray: The new complex FFT data after equalization.
    """
    N = len(full_fft_data)
    # 1. Create a copy of the FFT data to modify
    new_fft_data = full_fft_data.copy()

    # Calculate frequency step (resolution)
    freq_step = Fs / N

    for band in equalization_scheme:
        freq_start = band['freq_start_hz']
        freq_end = band['freq_end_hz']

        scale_factor = band['scale_factor']
        linear_gain = scale_factor

        # 3. Determine the array indices (bins) for the positive frequencies
        k_start = int(np.floor(freq_start / freq_step))
        k_end = int(np.ceil(freq_end / freq_step))

        # Clamp indices to the valid single-sided range (0 to N//2)
        k_end_max = N // 2
        k_start = max(0, k_start)
        k_end = min(k_end_max, k_end)

        # 4. Apply gain to the positive frequency components
        new_fft_data[k_start:k_end] *= linear_gain

        # 5. Apply gain to the negative frequency components (conjugate symmetry)
        # Frequencies are mirrored in the second half of the FFT array.
        if k_start > 0: # Exclude DC component (k=0) from mirroring
            k_neg_start = N - k_end
            k_neg_end = N - k_start
            new_fft_data[k_neg_start:k_neg_end] *= linear_gain

    return new_fft_data