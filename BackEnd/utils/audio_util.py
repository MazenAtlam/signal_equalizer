# Backend/utils/audio_util.py

import numpy as np
from pydub import AudioSegment
import soundfile as sf
import array

def load_audio_to_numpy(filepath):
    """ Loads an audio file into a 1D float NumPy array and gets the sampling rate (Fs). """
    try:
        audio = AudioSegment.from_file(filepath)
        
        # Downmix to mono if stereo
        if audio.channels > 1:
            audio = audio.set_channels(1)

        Fs = audio.frame_rate
        
        # Get raw samples and convert to float64
        samples = np.array(audio.get_array_of_samples())
        
        # Determine max value for normalization
        dtype = samples.dtype
        max_val = np.iinfo(dtype).max
        
        # Normalize to float array [-1.0, 1.0]
        signal_float = samples.astype(np.float64) / max_val
        
        return signal_float, Fs
        
    except Exception as e:
        print(f"Error processing audio file with pydub: {e}")
        return None, None

def save_numpy_to_wav(signal_float, Fs, filepath):
    """ Saves a normalized float NumPy array to a WAV file using soundfile. """
    sf.write(filepath, signal_float, Fs, format='WAV', subtype='PCM_16')
