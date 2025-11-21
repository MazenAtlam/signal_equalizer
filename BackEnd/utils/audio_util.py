# Backend/utils/audio_util.py

import numpy as np
import soundfile as sf
import librosa

def load_audio_to_numpy(filepath):
    """ 
    Loads an audio file using librosa, which bypasses the pydub/audioop dependency issues.
    Returns: 1D float64 NumPy array and the sampling rate (Fs).
    """
    try:
        # Load audio data (y) and original sampling rate (Fs)
        # mono=True ensures downmix, sr=None preserves original Fs
        signal_float, Fs = librosa.load(filepath, sr=None, mono=True)
        
        # Librosa loads as float32; convert to float64 for consistency 
        signal_float = signal_float.astype(np.float64)
        
        return signal_float, Fs
        
    except Exception as e:
        print(f"Error processing audio file with librosa: {e}")
        return None, None

def save_numpy_to_wav(signal_float, Fs, filepath):
    """ Saves a normalized float NumPy array to a WAV file using soundfile. """
    sf.write(filepath, signal_float, Fs, format='WAV', subtype='PCM_16')