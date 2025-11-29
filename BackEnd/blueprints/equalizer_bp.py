from flask import Blueprint, request, jsonify, current_app, send_from_directory
import os, sys
import numpy as np
import time

# --- 1. Utility Imports ---
# Configure paths to import utils correctly
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(os.path.join(BASE_DIR, 'utils'))

# Import shared cache and core DSP functions
from blueprints.audio_bp import SIGNAL_CACHE
from custom_fft import custom_ifft, get_fft_components
from spectrogram import custom_spectrogram
from equalizer_core import apply_equalization
from ai_separator import run_demucs_separation, run_speechbrain_separation, save_signal_to_temp
from recombination_core import apply_eq_and_recombine, calculate_performance_metrics
# from utils.equalizer_core import calculate_static_output
equalizer_bp = Blueprint('equalizer_bp', __name__)

# --- Helper to generate common response data (prevents code repetition) ---
def generate_viz_data(time_series, Fs, fft_data_full):
    # Recalculate visualizations based on the new time series
    
    # 1. Get FFT components for magnitude plot
    frequencies, magnitudes_db, phases = get_fft_components(fft_data_full, Fs)
    
    # 2. Compute the new spectrogram
    spectrogram_matrix = custom_spectrogram(time_series, Fs)

    return {
        'magnitude_arr': magnitudes_db.tolist(),
        'spectrogram': spectrogram_matrix.tolist(),
        'time_series': time_series.tolist(),
        'frequency_arr': frequencies.tolist()
    }


# --- 2. /api/equalizer/equalize (POST) ---
@equalizer_bp.route('/equalize', methods=['POST'])
def apply_equalizer():
    data = request.get_json()
    signal_id = data.get('signal_id')
    eq_scheme = data.get('equalizer_scheme')

    if not signal_id or signal_id not in SIGNAL_CACHE:
        return jsonify({'error': 'Signal ID not found or invalid.'}), 404
        
    if not eq_scheme:
        # If the scheme is empty, we just reconstruct the original signal
        pass 

    signal_data = SIGNAL_CACHE[signal_id]
    
    try:
        # A. Apply Equalization to the Input FFT (using the new core utility)
        new_fft_data = apply_equalization(
            signal_data['input_fft'], signal_data['Fs'],
            eq_scheme
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


@equalizer_bp.route('/equalize_with_ai', methods=['POST'])
def equalize_with_ai_comparison():
    data = request.get_json()
    signal_id = data.get('signal_id')
    customized_mode_preset = data.get('customized_mode_preset')
    mode_name = customized_mode_preset.lower() if customized_mode_preset else None
    eq_scheme = data.get('equalizer_scheme')

    if not signal_id or signal_id not in SIGNAL_CACHE:
        return jsonify({'error': 'Signal ID not found.'}), 404
        
    signal_data = SIGNAL_CACHE[signal_id]
    UPLOAD_FOLDER = current_app.config['UPLOAD_FOLDER'] 
    Fs = signal_data['Fs']
    input_time_series = signal_data['current_signal']
    
    try:
        # --- 0. Static Baseline ---
        static_time_series = input_time_series

        # --- 1. AI Separation ---
        temp_input_path = save_signal_to_temp(input_time_series, Fs, signal_id, UPLOAD_FOLDER)
        output_dir = os.path.join(UPLOAD_FOLDER, signal_id, f"ai_run_{int(time.time())}") 
        os.makedirs(output_dir, exist_ok=True)

        if mode_name == 'musical':
            source_paths = run_demucs_separation(temp_input_path, Fs, output_dir)
        elif mode_name == 'human':
            source_paths = run_speechbrain_separation(temp_input_path, Fs, output_dir)
        else:
            return jsonify({'error': 'Invalid preset.'}), 400

        # --- 2. Custom Mixing (Time Domain) ---
        reconstructed_signal = apply_eq_and_recombine(source_paths, Fs, eq_scheme, UPLOAD_FOLDER)
        
        # --- 3. Visualization Data ---
        # FIX IS HERE: We import the function, so we call it directly.
        # Ensure you have "from utils.custom_fft import custom_fft" at the top of this file
        from utils.custom_fft import custom_fft 
        reconstructed_fft = custom_fft(reconstructed_signal)

        viz_data = generate_viz_data(reconstructed_signal, signal_data['Fs'], reconstructed_fft)
        # --- 4. Metric Calculation ---
        performance_metrics = calculate_performance_metrics(static_time_series, reconstructed_signal)
        
        return jsonify({
            'signal_id': signal_id,
            **viz_data, 
            'performance': performance_metrics
        }), 200

    except Exception as e:
        print(f"Error in equalize_with_ai: {e}")
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500