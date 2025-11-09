# Backend/blueprints/audio_bp.py

from flask import Blueprint, request, jsonify, current_app, send_from_directory
import os
import uuid
import numpy as np

# --- 1. Utility Imports ---
# Configure paths to import utils correctly
import sys
BASE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
sys.path.append(os.path.join(BASE_DIR, 'utils'))

from audio_util import load_audio_to_numpy, save_numpy_to_wav
from custom_fft import custom_fft, custom_ifft, get_fft_components
from spectrogram import custom_spectrogram

audio_bp = Blueprint('audio_bp', __name__)

# --- 2. In-Memory Data Cache ---
# Stores {signal_id: {'Fs', 'time_series', 'input_fft', 'current_fft', 'current_signal', 'output_path'}}
SIGNAL_CACHE = {} 
ALLOWED_EXTENSIONS = {'wav', 'mp3', 'flac'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# --- 3. /api/audio/upload (POST) ---
@audio_bp.route('/upload', methods=['POST'])
def upload_signal():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400
    
    file = request.files['file']
    if file.filename == '' or not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type or no file selected'}), 400
        
    try:
        # Save the file temporarily
        temp_filename = str(uuid.uuid4()) + '.' + file.filename.rsplit('.', 1)[1].lower()
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], temp_filename)
        file.save(filepath)
        
        # 1. Load Audio and Get Fs (uses pydub)
        signal_time_series, Fs = load_audio_to_numpy(filepath)
        
        if signal_time_series is None:
            return jsonify({'error': 'Could not process audio file. Check audio format/dependencies.'}), 500
        
        # 2. Compute Initial DSP (uses custom_fft/spectrogram)
        fft_data_full = custom_fft(signal_time_series)
        frequencies, magnitudes_db, phases = get_fft_components(fft_data_full, Fs)
        spectrogram_matrix = custom_spectrogram(signal_time_series, Fs)
        
        # 3. Cache Data 
        signal_id = str(uuid.uuid4())
        
        SIGNAL_CACHE[signal_id] = {
            'Fs': Fs,
            'time_series': signal_time_series, 
            'input_fft': fft_data_full,        
            'current_fft': fft_data_full,      # Output spectrum starts as input
            'current_signal': signal_time_series, # Output signal starts as input
            'output_path': None                
        }
        
        # 4. Clean up the original uploaded file
        os.remove(filepath)
        
        # 5. Prepare data for React visualization (chunking for large arrays)
        sample_step = max(1, len(signal_time_series) // 2000)
        
        return jsonify({
            'message': 'Signal loaded and processed successfully.',
            'signal_id': signal_id,
            'Fs': Fs,
            'duration': len(signal_time_series) / Fs,
            'data': {
                'full_time_series': signal_time_series.tolist(), # <-- UPDATED TO SEND FULL ARRAY
                'frequencies': frequencies.tolist(),
                'magnitudes_db': magnitudes_db.tolist(),
                'spectrogram_data': spectrogram_matrix.tolist()
            }
        }), 200
    
    

    except Exception as e:
        print(f"Server error during upload: {e}")
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500


# --- 4. /api/audio/download_output (GET) ---
@audio_bp.route('/download_output', methods=['GET'])
def download_output_signal():
    signal_id = request.args.get('signal_id')
    if not signal_id or signal_id not in SIGNAL_CACHE:
        return jsonify({'error': 'Signal ID not found or invalid.'}), 404
        
    signal_data = SIGNAL_CACHE[signal_id]
    
    try:
        # Generate temporary file path
        output_filename = f"output_{signal_id}.wav"
        output_filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], output_filename)
        
        # Save the current output signal array to a WAV file
        save_numpy_to_wav(signal_data['current_signal'], signal_data['Fs'], output_filepath)

        # Serve the file for streaming (playback in React)
        response = send_from_directory(
            directory=current_app.config['UPLOAD_FOLDER'],
            path=output_filename,
            as_attachment=False, 
            mimetype='audio/wav'
        )
        
        # Clean up the local WAV file after the request
        @response.call_on_close
        def cleanup():
            if os.path.exists(output_filepath):
                os.remove(output_filepath)
        
        return response
        
    except Exception as e:
        print(f"Server error during download: {e}")
        return jsonify({'error': f'An unexpected error occurred during audio output: {str(e)}'}), 500