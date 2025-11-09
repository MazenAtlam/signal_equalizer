from flask import Blueprint, request, jsonify
import os, sys
import numpy as np

# --- 1. Utility Imports ---
# Configure paths to import utils correctly
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(os.path.join(BASE_DIR, 'utils'))

# Import shared cache and core DSP functions
from blueprints.audio_bp import SIGNAL_CACHE
from custom_fft import custom_ifft, get_fft_components
from spectrogram import custom_spectrogram
from equalizer_core import apply_equalization 

equalizer_bp = Blueprint('equalizer_bp', __name__)

# --- Helper to generate common response data (prevents code repetition) ---
def generate_viz_data(time_series, Fs, fft_data_full):
    # Recalculate visualizations based on the new time series
    
    # 1. Get FFT components for magnitude plot
    frequencies, magnitudes_db, phases = get_fft_components(fft_data_full, Fs)
    
    # 2. Compute the new spectrogram
    spectrogram_matrix = custom_spectrogram(time_series, Fs)

    # 3. Chunk the time series for fast visualization in the frontend
    sample_step = max(1, len(time_series) // 2000)
    
    return {
        'new_magnitudes_db': magnitudes_db.tolist(),
        'spectrogram_data': spectrogram_matrix.tolist(),
        'full_time_series': time_series.tolist(), # <-- UPDATED TO SEND FULL ARRAY
    }


# --- 2. /api/equalizer/apply (POST) ---
@equalizer_bp.route('/apply', methods=['POST'])
def apply_equalizer():
    data = request.get_json()
    signal_id = data.get('signal_id')
    equalization_scheme = data.get('equalization_scheme')

    if not signal_id or signal_id not in SIGNAL_CACHE:
        return jsonify({'error': 'Signal ID not found or invalid.'}), 404
        
    if not equalization_scheme:
        # If the scheme is empty, we just reconstruct the original signal
        pass 

    signal_data = SIGNAL_CACHE[signal_id]
    
    try:
        # A. Apply Equalization to the Input FFT (using the new core utility)
        new_fft_data = apply_equalization(
            signal_data['input_fft'], signal_data['Fs'], equalization_scheme
        )
        
        # B. Inverse FFT (IFFT) to get the new sound wave
        new_time_series_complex = custom_ifft(new_fft_data)
        
        # C. Update Cache (The processed signal is now the 'current' signal)
        # We take the real part as the original time series was real
        new_time_series_real = new_time_series_complex.real
        signal_data['current_fft'] = new_fft_data
        signal_data['current_signal'] = new_time_series_real
        
        # D. Generate Visualization Data
        viz_data = generate_viz_data(new_time_series_real, signal_data['Fs'], new_fft_data)
        
        return jsonify({
            'message': 'Equalization applied successfully.',
            'signal_id': signal_id,
            **viz_data
        }), 200

    except Exception as e:
        print(f"Error during equalization: {e}")
        return jsonify({'error': f'An unexpected error occurred during equalization: {str(e)}'}), 500


# --- 3. /api/equalizer/set_mode (POST) ---
# This is a stub, as the full configuration file logic is still needed.
@equalizer_bp.route('/set_mode', methods=['POST'])
def set_equalizer_mode():
    data = request.get_json()
    mode_name = data.get('mode_name', 'generic')
    
    # --- STUB: Replace this with loading from a config/JSON file later ---
    # The key is changed from 'gain_db': 0 to 'scale_factor': 1.0
    if mode_name == 'musical':
        scheme = [
            {'label': 'Bass (20-250 Hz)', 'freq_start_hz': 20, 'freq_end_hz': 250, 'scale_factor': 1.0},
            {'label': 'Vocals/Mid (250-4k Hz)', 'freq_start_hz': 250, 'freq_end_hz': 4000, 'scale_factor': 1.0},
            {'label': 'Treble (4k-20k Hz)', 'freq_start_hz': 4000, 'freq_end_hz': 20000, 'scale_factor': 1.0},
        ]
    elif mode_name == 'generic': 
        scheme = [
            {'label': 'Generic Band 1', 'freq_start_hz': 20, 'freq_end_hz': 1000, 'scale_factor': 1.0}
        ]
    else: # Default/Other custom modes
        scheme = [{'label': f'{mode_name.title()} Band', 'freq_start_hz': 20, 'freq_end_hz': 5000, 'scale_factor': 1.0}]
        
    return jsonify({
        'message': f"Mode set to {mode_name}.",
        'mode_data': {'bands': scheme, 'mode_label': mode_name.title() }
    }), 200

# --- 4. /api/equalizer/set_scale (POST) ---
# Handles switching the frequency plot scale (Linear or Audiogram).
@equalizer_bp.route('/set_scale', methods=['POST'])
def set_visualization_scale():
    data = request.get_json()
    signal_id = data.get('signal_id')
    scale_type = data.get('scale_type', 'linear')

    if not signal_id or signal_id not in SIGNAL_CACHE:
        return jsonify({'error': 'Signal ID not found or invalid.'}), 404
        
    signal_data = SIGNAL_CACHE[signal_id]
    Fs = signal_data['Fs']
    N = len(signal_data['current_fft'])
    
    # --- STUB: Placeholder for Audiogram logic ---
    if scale_type == 'audiogram':
        # Standard Audiogram frequencies (logarithmic-like)
        # This determines the X-axis points for the plot.
        audiogram_freqs = np.array([125, 250, 500, 750, 1000, 1500, 2000, 3000, 4000, 6000, 8000])
        
        # Filter freqs to be less than or equal to Nyquist (Fs/2)
        nyquist = Fs / 2
        new_frequencies = audiogram_freqs[audiogram_freqs <= nyquist].tolist()
        
    else: # linear
        # Use the standard linear frequency axis calculation
        frequencies, _, _ = get_fft_components(signal_data['current_fft'], Fs)
        new_frequencies = frequencies.tolist()
        
    return jsonify({
        'message': f"Scale set to {scale_type}.",
        'new_frequencies': new_frequencies
    }), 200