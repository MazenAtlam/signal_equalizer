import numpy as np
import custom_fft
def apply_equalization(full_fft_data, Fs, equalization_scheme):
    """
    Applies gain adjustments to the FFT data based on the equalization scheme.
    """
    N = len(full_fft_data)
    new_fft_data = full_fft_data.copy()
    freq_step = Fs / N

    for band in equalization_scheme:
        freq_start = band['freq_start_hz']
        freq_end = band['freq_end_hz']
        scale_factor = band['scale_factor']
        linear_gain = scale_factor

        # Determine the array indices (bins) for the positive frequencies
        k_start = int(np.floor(freq_start / freq_step))
        k_end = int(np.ceil(freq_end / freq_step))

        # Clamp indices to the valid single-sided range (0 to N//2)
        k_end_max = N // 2
        k_start = max(0, k_start)
        k_end = min(k_end_max, k_end)

        # Apply gain to the positive frequency components
        new_fft_data[k_start:k_end] *= linear_gain

        # FIX: Proper handling of negative frequencies and DC component
        # For real signals, FFT is symmetric: X[k] = conjugate(X[N-k])
        # We need to handle different cases based on N (even/odd)
        if N % 2 == 0:
            # Even N: DC (0), positive (1 to N/2-1), Nyquist (N/2), negative (N/2+1 to N-1)
            if k_start == 0:
                # DC component - only apply to k=0, don't mirror
                pass
            else:
                # Apply to negative frequencies (mirror of positive)
                k_neg_start = N - k_end
                k_neg_end = N - k_start
                new_fft_data[k_neg_start:k_neg_end] *= linear_gain

                # Handle Nyquist frequency (k = N/2) if it's in our range
                if k_end == N // 2:
                    new_fft_data[N // 2] *= linear_gain
        else:
            # Odd N: DC (0), positive (1 to (N-1)/2), negative ((N+1)/2 to N-1)
            if k_start == 0:
                # DC component
                pass
            else:
                k_neg_start = N - k_end + 1
                k_neg_end = N - k_start + 1
                new_fft_data[k_neg_start:k_neg_end] *= linear_gain

    return new_fft_data



def calculate_static_output(time_series_signal, Fs, frontend_eq_scheme):
    """
    Takes raw audio, applies standard EQ (using your existing function), 
    and returns the time-series result.
    """
    # 1. Convert to Frequency Domain
    fft_data = custom_fft.custom_fft(time_series_signal)
    
    # 2. Map Frontend Keys to what apply_equalization expects
    # The frontend sends 'start_frequency', but your function needs 'freq_start_hz'
    mapped_scheme = []
    for band in frontend_eq_scheme:
        mapped_scheme.append({
            'freq_start_hz': band['start_frequency'],
            'freq_end_hz': band['end_frequency'],
            'scale_factor': band['scale_value']
        })

    # 3. Apply YOUR existing function
    processed_fft = apply_equalization(fft_data, Fs, mapped_scheme)
    
    # 4. Convert back to Time Domain
    reconstructed_signal = custom_fft.custom_ifft(processed_fft).real
    
    # 5. Normalize (Important for fair comparison with AI output)
    max_val = np.max(np.abs(reconstructed_signal))
    if max_val > 0:
        reconstructed_signal = reconstructed_signal / max_val
        
    return reconstructed_signal