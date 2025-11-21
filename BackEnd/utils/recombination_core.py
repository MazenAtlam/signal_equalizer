# BackEnd/utils/recombination_core.py
import sys
import numpy as np
import os
import soundfile as sf
import librosa


# --- Configure paths to import utils correctly ---
# BASE_DIR should point to the BackEnd directory
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')) 
sys.path.append(os.path.join(BASE_DIR, 'utils')) # Ensure utils directory is in path
# --------------------------------------------------

# Import core DSP utilities
# Python can now find custom_fft and equalizer_core because their directory is in sys.path
import custom_fft
import equalizer_core 


def apply_eq_and_recombine(source_paths, Fs, eq_scheme, UPLOAD_FOLDER):
    """
    Applies custom equalization scheme (using frontend keys) to each source 
    and sums them into a final mixture.
    """
    final_mixture = None
    
    # Loop through each separated source file provided by the AI
    for source_key, source_filepath in source_paths.items():
        # 1. Load Source Audio
        source_time_series, _ = librosa.load(source_filepath, sr=Fs, mono=True)
        source_time_series = source_time_series.astype(np.float64) # Ensure float64
        
        # 2. Convert to Frequency Domain (Custom FFT)
        source_fft_data = custom_fft.custom_fft(source_time_series) # <-- FIXED CALL
        
        # 3. Apply the EQ scheme (Requires key mapping)
        processed_eq_scheme = []
        for band in eq_scheme:
            mapped_band = {
                'freq_start_hz': band['start_frequency'], 
                'freq_end_hz': band['end_frequency'],     
                'scale_factor': band['scale_value']       
            }
            processed_eq_scheme.append(mapped_band)
            
        processed_fft_data = equalizer_core.apply_equalization(source_fft_data, Fs, processed_eq_scheme) # <-- FIXED CALL
        
        # 4. Convert back to Time Domain (Custom IFFT)
        processed_time_series = custom_fft.custom_ifft(processed_fft_data).real # <-- FIXED CALL
        
        # 5. Recombine (Summation)
        if final_mixture is None:
            final_mixture = processed_time_series
        else:
            final_mixture += processed_time_series
            
        # Clean up the original separated source file
        if os.path.exists(source_filepath):
             os.remove(source_filepath)
            
    # 6. Normalize the final mixture to prevent clipping 
    max_abs_val = np.max(np.abs(final_mixture))
    if max_abs_val > 1.0:
        final_mixture /= max_abs_val
        
    return final_mixture
    
def calculate_performance_metrics():
    """
    Placeholder for the complex evaluation metrics (SDR, SI-SDR, etc.)
    This function would compare: (AI-Separated Sources) vs (Original Ground Truth/Mixed Input)
    """
    return {
        'SDR / SIR / SAR' : 0.0,
        'SI-SDR (scale-invariant SDR)' : 0.0,
        'Log-spectral distance / spectral convergence / L2 on magnitude spectrograms' : 0.0,
        'Reconstruction error' : 0.0,
        'Perceptual / listening test (MOS / AB test)' : 0.0,
        'Runtime / memory' : 0.0
    }