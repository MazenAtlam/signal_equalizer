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

def apply_eq_and_recombine(source_paths, Fs, eq_scheme, UPLOAD_FOLDER):
    """
    Applies volume scaling (Mixing) to separated sources based on labels.
    
    Args:
        source_paths: Dict {'drums': 'path/to/drums.wav', ...}
        Fs: Sampling rate
        eq_scheme: Dict or List mapping labels to scale values.
                   Example: {'drums': 1.2, 'vocals': 0.0} 
                   OR List: [{'label': 'drums', 'value': 1.2}, ...]
    """
    final_mixture = None
    
    # 1. Normalize eq_scheme to a dictionary { 'label_lower': float_scale }
    scale_map = {}
    if isinstance(eq_scheme, list):
        # Handle case if Frontend sends a list of objects
        for item in eq_scheme:
            # Adjust keys based on your actual frontend JSON structure
            label = item.get('name')
            value = item.get('value')
            if label:
                scale_map[label.lower()] = float(value)
    elif isinstance(eq_scheme, dict):
        # Handle case if Frontend sends a direct dictionary
        scale_map = {k.lower(): float(v) for k, v in eq_scheme.items()}

    print(f"Applying Mixing Scales: {scale_map}")

    # 2. Iterate through the separated files provided by AI
    for source_key, source_filepath in source_paths.items():
        # source_key comes from the AI model (e.g., 'drums', 'speaker_1')
        normalized_key = source_key.lower()

        # Default scale is 1.0 if not found in the scheme
        # We try strict matching, or partial matching for flexibility
        scale_factor = scale_map.get(normalized_key, 1.0)
        
        # Handle potential mismatch (e.g. Model says "speaker_1", Frontend says "Speaker 1")
        if normalized_key not in scale_map:
            # Fallback: try to find if the key exists inside the map keys
            for map_k, map_v in scale_map.items():
                if map_k in normalized_key or normalized_key in map_k:
                    scale_factor = map_v
                    break

        print(f"Processing {source_key}: Applying gain {scale_factor}")

        # 3. Load Source Audio
        # We assume Mono for mixing simplicity, but you can use stereo if preferred
        source_time_series, _ = librosa.load(source_filepath, sr=Fs, mono=True)
        source_time_series = source_time_series.astype(np.float64)

        # 4. Apply Scaling (Time Domain Volume Control)
        # No FFT needed here, just simple multiplication
        processed_time_series = source_time_series * scale_factor

        # 5. Accumulate into Final Mixture
        if final_mixture is None:
            final_mixture = processed_time_series
        else:
            # Ensure lengths match before adding (rare edge case with librosa load)
            min_len = min(len(final_mixture), len(processed_time_series))
            final_mixture[:min_len] += processed_time_series[:min_len]

        # Clean up temp file
        if os.path.exists(source_filepath):
            os.remove(source_filepath)

    # 6. Safety: Handle case where no files were processed
    if final_mixture is None:
        return np.zeros(1024) # Return silence if failed

    # 7. Normalize only if clipping occurs (Optional: standard for mixing)
    max_abs_val = np.max(np.abs(final_mixture))
    if max_abs_val > 1.0:
        final_mixture /= max_abs_val

    return final_mixture



def calculate_performance_metrics(static_time_series, ai_time_series):
    # 1. Ensure lengths match
    min_len = min(len(static_time_series), len(ai_time_series))
    
    # 2. Trim both signals to the minimum length
    static_trimmed = static_time_series[:min_len]
    ai_trimmed = ai_time_series[:min_len]

    # 3. Calculate Mean Squared Error (Difference calculation)
    difference_array = static_trimmed - ai_trimmed
    mse = np.mean(difference_array ** 2)
    
    # 4. Calculate Percentage Difference (Normalized Error)
    norm_diff = np.linalg.norm(difference_array)
    norm_static = np.linalg.norm(static_trimmed)
    
    percent_diff = (norm_diff / norm_static) * 100 if norm_static > 0 else 0

    performance = {
        "mse": float(mse),
        "percent_diff": float(percent_diff)
    }

    return performance