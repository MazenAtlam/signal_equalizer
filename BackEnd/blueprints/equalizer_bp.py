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
from custom_fft import custom_fft, custom_ifft, get_fft_components
from spectrogram import custom_spectrogram
from equalizer_core import apply_equalization
from ai_separator import run_demucs_separation, run_speechbrain_separation, save_signal_to_temp
from recombination_core import apply_eq_and_recombine, calculate_performance_metrics
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


# --- NEW ENDPOINT 1: /api/equalizer/separate_ai (POST) ---

@equalizer_bp.route('/separate_ai', methods=['POST'])
def separate_with_ai():
    data = request.get_json()
    signal_id = data.get('signal_id')
    mode_name = data.get('mode_name') # Should be 'musical' or 'voices'

    if not signal_id or signal_id not in SIGNAL_CACHE:
        return jsonify({'error': 'Signal ID not found or invalid.'}), 404
        
    signal_data = SIGNAL_CACHE[signal_id]
    
    # 1. RETRIEVE UPLOAD FOLDER PATH (Correct way)
    UPLOAD_FOLDER = current_app.config['UPLOAD_FOLDER'] 
    Fs = signal_data['Fs']
    time_series = signal_data['current_signal']
    
    try:
        # 2. Save the signal from cache to a temporary file for AI input
        temp_input_path = save_signal_to_temp(time_series, Fs, signal_id, UPLOAD_FOLDER)
        
        # Create a unique sub-folder for this signal's AI outputs
        output_dir = os.path.join(UPLOAD_FOLDER, signal_id)
        os.makedirs(output_dir, exist_ok=True)

        # 3. Determine which AI model to run
        if mode_name == 'musical':
            source_paths = run_demucs_separation(temp_input_path, Fs, output_dir)
            
        elif mode_name == 'voices':
            source_paths = run_speechbrain_separation(temp_input_path, Fs, output_dir)
            
        else:
            os.remove(temp_input_path)
            return jsonify({'error': 'Invalid mode for AI separation.'}), 400

        # 4. Store the output source file paths in the cache
        signal_data['ai_sources'] = source_paths
        
        # 5. Cleanup temporary AI input file
        os.remove(temp_input_path) 
        
        # 6. Return keys for the frontend to render playback buttons
        return jsonify({
            'message': f"AI Separation complete using {mode_name} model.",
            'sources': list(source_paths.keys()) # e.g., ['vocals', 'drums', 'bass']
        }), 200

    except Exception as e:
        print(f"Error during AI separation: {e}")
        return jsonify({'error': f'AI separation failed: {str(e)}'}), 500


# --- NEW ENDPOINT 2: /api/equalizer/download_source (GET) ---

@equalizer_bp.route('/download_source', methods=['GET'])
def download_ai_source():
    signal_id = request.args.get('signal_id')
    source_key = request.args.get('source_key') # e.g., 'vocals', 'speaker_1'
    
    if not signal_id or signal_id not in SIGNAL_CACHE:
        return jsonify({'error': 'Signal ID not found or invalid.'}), 404
        
    signal_data = SIGNAL_CACHE[signal_id]
    
    if 'ai_sources' not in signal_data or source_key not in signal_data['ai_sources']:
        return jsonify({'error': f'AI source "{source_key}" not found for this signal.'}), 404
        
    source_filepath = signal_data['ai_sources'][source_key]
    output_filename = os.path.basename(source_filepath)
    
    try:
        # Serve the file for streaming
        response = send_from_directory(
            directory=os.path.dirname(source_filepath),
            path=output_filename,
            as_attachment=False, 
            mimetype='audio/wav'
        )
        
        return response
        
    except Exception as e:
        print(f"Server error during AI source download: {e}")
        return jsonify({'error': f'An unexpected error occurred during audio output: {str(e)}'}), 500
    

# --- NEW ENDPOINT: /api/equalizer/equalize_with_ai (POST) ---
@equalizer_bp.route('/equalize_with_ai', methods=['POST'])
def equalize_with_ai_comparison():
    data = request.get_json()
    signal_id = data.get('signal_id')
    customized_mode_preset = data.get('customized_mode_preset')
    mode_name = customized_mode_preset.lower() if customized_mode_preset else None # e.g., 'musical'
    eq_scheme = data.get('equalizer_scheme')

    if not signal_id or signal_id not in SIGNAL_CACHE:
        return jsonify({'error': 'Signal ID not found or invalid.'}), 404
        
    if not customized_mode_preset or not mode_name:
        return jsonify({'error': 'Customized mode preset is missing or invalid.'}), 400
        
    if not eq_scheme:
        return jsonify({'error': 'Equalization scheme is missing.'}), 400
        
    signal_data = SIGNAL_CACHE[signal_id]
    UPLOAD_FOLDER = current_app.config['UPLOAD_FOLDER'] 
    Fs = signal_data['Fs']
    
    # Use the current signal (if it has been previously equalized, otherwise uses input)
    input_time_series = signal_data['current_signal']
    
    try:
        # --- 1. AI Separation ---
        temp_input_path = save_signal_to_temp(input_time_series, Fs, signal_id, UPLOAD_FOLDER)
        output_dir = os.path.join(UPLOAD_FOLDER, signal_id, f"ai_run_{int(time.time())}") # Unique folder for this run
        os.makedirs(output_dir, exist_ok=True)

        if mode_name == 'musical':
            source_paths = run_demucs_separation(temp_input_path, Fs, output_dir)
        elif mode_name == 'human' or mode_name == 'voices':
            source_paths = run_speechbrain_separation(temp_input_path, Fs, output_dir)
        else:
            os.remove(temp_input_path)
            return jsonify({'error': 'Invalid preset. Must be Musical or Human.'}), 400

        # --- 2. Custom Equalization & Recombination ---
        reconstructed_signal = apply_eq_and_recombine(source_paths, Fs, eq_scheme, UPLOAD_FOLDER)
        
        # --- 3. Visualization Data for the Reconstructed Signal ---
        reconstructed_fft = custom_fft(reconstructed_signal)
        frequencies, magnitudes_db, phases = get_fft_components(reconstructed_fft, Fs)
        
        # --- 4. Metric Calculation (Placeholder) ---
        performance_metrics = calculate_performance_metrics()
        
        # --- 5. Return Frontend Format ---
        return jsonify({
            'signal_id': signal_id,
            'ai_frequency_arr': frequencies.tolist(),
            'ai_magnitude_arr': magnitudes_db.tolist(),
            'ai_time_series': reconstructed_signal.tolist(), # Full time series for cine viewer
            'performance': performance_metrics
        }), 200

    except Exception as e:
        print(f"Error in equalize_with_ai: {e}")
        return jsonify({'error': f'An unexpected error occurred during AI comparison: {str(e)}'}), 500    