import numpy as np
import custom_fft
import copy # Ensure copy is imported

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
        
        # Handle key inconsistency (frontend sends scale_value, config sends scale_factor)
        if 'scale_factor' in band:
            scale_factor = band['scale_factor']
            
        linear_gain = scale_factor

        # Determine the array indices (bins) for the positive frequencies
        k_start = int(np.floor(freq_start / freq_step))
        k_end = int(np.ceil(freq_end / freq_step))

        # Clamp indices to the valid single-sided range
        k_end_max = N // 2
        k_start = max(0, k_start)
        k_end = min(k_end_max, k_end)
        
        # Skip invalid ranges
        if k_start >= k_end:
            continue

        # 1. Apply gain to the positive frequency components
        new_fft_data[k_start:k_end] *= linear_gain

        # 2. Apply to negative frequencies (Mirroring) based on N parity
        if N % 2 == 0:
            # Even N: DC at 0, Nyquist at N/2
            # Positive: 1 to N/2 - 1
            # Negative: N/2 + 1 to N - 1
            # Mirror of index i is N - i
            
            # If our range starts at 0 (DC), handle DC separately
            if k_start == 0:
                pass # DC component is usually left alone or handled carefully
            
            # --- FIXED LOGIC START ---
            # We applied gain to [k_start, k_end). The indices are k_start, ..., k_end-1.
            # We must apply gain to their mirrors: N-k_start, ..., N-(k_end-1).
            # The mirror range goes backwards from N-k_start to N-k_end+1.
            # In Python slice notation [start:end], we need:
            # Start: N - k_end + 1
            # End:   N - k_start + 1
            
            eff_k_start = max(1, k_start) # Don't mirror DC (0) using this formula
            
            k_neg_start = N - k_end + 1
            k_neg_end = N - eff_k_start + 1
            
            # Safety clamp
            k_neg_start = max(N // 2 + 1, k_neg_start)
            k_neg_end = min(N, k_neg_end)
            
            if k_neg_start < k_neg_end:
                new_fft_data[k_neg_start:k_neg_end] *= linear_gain
            # --- FIXED LOGIC END ---

            # Handle Nyquist frequency (k = N/2) if it was included in k_end
            # If k_end was clamped to N//2, the loop k_start:k_end STOPS before N//2.
            # So we check the ORIGINAL k_end before clamping or logic to see if it intended to cover Nyquist.
            # However, simpler check: if the band covers the highest freq, hit Nyquist.
            if k_end == N // 2:
                 new_fft_data[N // 2] *= linear_gain

        else:
            # Odd N: DC at 0
            # Positive: 1 to (N-1)/2
            # Negative: (N+1)/2 to N-1
            # Mirror of i is N - i
            
            if k_start == 0:
                pass 

            eff_k_start = max(1, k_start)
            
            k_neg_start = N - k_end + 1
            k_neg_end = N - eff_k_start + 1
            
            if k_neg_start < k_neg_end:
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