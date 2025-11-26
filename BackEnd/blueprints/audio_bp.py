# Backend/blueprints/audio_bp.py

from flask import Blueprint, request, jsonify, current_app, send_from_directory
import os
import uuid

# --- 1. Utility Imports ---
# Configure paths to import utils correctly
import sys
BASE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
sys.path.append(os.path.join(BASE_DIR, 'utils'))

from audio_util import load_audio_to_numpy
from custom_fft import custom_fft, get_fft_components
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

        return jsonify({
            'signal_id': signal_id,
            'time_series': signal_time_series.tolist(),
            'frequency_arr': frequencies.tolist(),
            'magnitude_arr': magnitudes_db.tolist(),
            'spectrogram': spectrogram_matrix.tolist(),
            'Fs': Fs
        }), 200
    
    

    except Exception as e:
        print(f"Server error during upload: {e}")
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500
