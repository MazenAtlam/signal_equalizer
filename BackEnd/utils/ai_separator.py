import os
import sys
import requests
import soundfile as sf
import numpy as np
import time 
import torch 
import torchaudio 
import librosa
import subprocess
import importlib.util # Required for safe file importing

# --- PATH CONFIGURATION ---
# This points to the directory where ai_separator.py is located (BackEnd/)
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
# This points to where model.py is located (BackEnd/test_scripts/)
TEST_SCRIPTS_DIR = os.path.join(CURRENT_DIR, 'test_scripts')

# --- FFmpeg Configuration ---
BASE_DIR = os.path.abspath(os.path.join(CURRENT_DIR, '..'))
FFMPEG_POSSIBLE_PATHS = [
    os.path.join(BASE_DIR, "ffmpeg/bin") 
]

def _setup_ffmpeg_path():
    """Add FFmpeg to PATH and configure environment variables."""
    current_path = os.environ.get('PATH', '')
    ffmpeg_found = None
    
    try:
        result = subprocess.run(["ffmpeg", "-version"], capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            return True
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass
    
    for ffmpeg_path in FFMPEG_POSSIBLE_PATHS:
        abs_ffmpeg_path = os.path.abspath(ffmpeg_path)
        if os.path.exists(abs_ffmpeg_path):
            ffmpeg_exe = os.path.join(abs_ffmpeg_path, 'ffmpeg.exe')
            if os.path.exists(ffmpeg_exe):
                ffmpeg_found = abs_ffmpeg_path
                break
    
    if ffmpeg_found:
        if ffmpeg_found not in current_path:
            os.environ['PATH'] = ffmpeg_found + os.pathsep + current_path
        os.environ['TORCHCODEC_FFMPEG_PATH'] = ffmpeg_found
        return True
    return False

_setup_ffmpeg_path()

# --- GLOBAL MODEL INITIALIZATION ---
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
VOICE_SEPARATOR_MODEL = None
MODEL_DEF_URL = "https://raw.githubusercontent.com/asteroid-team/asteroid/master/egs/wsj0-mix-var/Multi-Decoder-DPRNN/model.py"

def _ensure_model_file_exists():
    """
    Ensures model.py exists in the test_scripts directory.
    """
    if not os.path.exists(TEST_SCRIPTS_DIR):
        os.makedirs(TEST_SCRIPTS_DIR)
        
    model_path = os.path.join(TEST_SCRIPTS_DIR, "model.py")
    
    if not os.path.exists(model_path):
        print(f"model.py not found in {TEST_SCRIPTS_DIR}. Downloading...")
        try:
            response = requests.get(MODEL_DEF_URL)
            response.raise_for_status()
            with open(model_path, "w", encoding='utf-8') as f:
                f.write(response.text)
            print("Successfully downloaded model.py")
        except Exception as e:
            print(f"Error downloading model.py: {e}")
            raise RuntimeError(f"Required model file missing and download failed: {e}")

def _load_voice_model():
    """Lazy loads the MultiDecoderDPRNN model using importlib for safety."""
    global VOICE_SEPARATOR_MODEL
    
    if VOICE_SEPARATOR_MODEL is None:
        print(f"Loading MultiDecoderDPRNN model (Device: {DEVICE})...")
        
        # 1. Ensure the file exists
        _ensure_model_file_exists()
        
        try:
            # 2. Fix for PyTorch Lightning
            import pytorch_lightning.callbacks.model_checkpoint
            import pytorch_lightning.callbacks.early_stopping
            torch.serialization.add_safe_globals([
                pytorch_lightning.callbacks.model_checkpoint.ModelCheckpoint,
                pytorch_lightning.callbacks.early_stopping.EarlyStopping
            ])

            # 3. Import using importlib to avoid name collisions
            model_path = os.path.join(TEST_SCRIPTS_DIR, "model.py")
            spec = importlib.util.spec_from_file_location("MultiDecoderDPRNN_module", model_path)
            if spec is None:
                raise ImportError(f"Could not load spec from {model_path}")
            
            module = importlib.util.module_from_spec(spec)
            sys.modules["MultiDecoderDPRNN_module"] = module 
            spec.loader.exec_module(module)

            # Get the class from the loaded module
            MultiDecoderDPRNN = module.MultiDecoderDPRNN
            
            # 4. Load from HuggingFace
            VOICE_SEPARATOR_MODEL = MultiDecoderDPRNN.from_pretrained("JunzheJosephZhu/MultiDecoderDPRNN")
            VOICE_SEPARATOR_MODEL.eval()
            VOICE_SEPARATOR_MODEL.to(DEVICE)
            print("MultiDecoderDPRNN model loaded successfully.")
            
        except Exception as e:
            raise RuntimeError(f"Failed to load MultiDecoderDPRNN model: {str(e)}")
            
    return VOICE_SEPARATOR_MODEL

def save_signal_to_temp(signal_array, Fs, signal_id, UPLOAD_FOLDER):
    """Saves signal to temp WAV file."""
    temp_input_filename = f"ai_input_{signal_id}.wav"
    temp_input_filepath = os.path.join(UPLOAD_FOLDER, temp_input_filename)
    
    if signal_array.dtype != np.float32:
        signal_array = signal_array.astype(np.float32)
    
    max_val = np.max(np.abs(signal_array))
    if max_val > 1.0:
        signal_array = signal_array / max_val

    # Convert to stereo for Demucs compatibility
    if signal_array.ndim == 1:  
        signal_array_stereo = np.stack([signal_array, signal_array], axis=1)
        sf.write(temp_input_filepath, signal_array_stereo, int(Fs), format='WAV', subtype='PCM_16')
    else:
        sf.write(temp_input_filepath, signal_array, int(Fs), format='WAV', subtype='PCM_16')
    
    return temp_input_filepath

# --- 1. DEMUCS IMPLEMENTATION (Musical) ---
def run_demucs_separation(input_filepath, Fs, output_dir):
    print(f"Running Demucs on {input_filepath}...")
    try:
        from demucs.pretrained import get_model
        from demucs.apply import apply_model
        
        wav, sr = sf.read(input_filepath, dtype='float32')
        if len(wav.shape) == 1: wav = wav.reshape(1, -1)
        else: wav = wav.T
        if wav.shape[0] > 2: wav = wav[:2]
        
        wav_tensor = torch.from_numpy(wav).float().unsqueeze(0).to(DEVICE)
        model = get_model('htdemucs')
        model.to(DEVICE)
        model.eval()
        
        with torch.no_grad():
            sources = apply_model(model, wav_tensor, device=DEVICE, split=True, overlap=0.25, progress=True)
        
        sources = sources.squeeze(0).cpu().numpy()
        input_file_base = os.path.splitext(os.path.basename(input_filepath))[0]
        final_stems_path = os.path.join(output_dir, "htdemucs", input_file_base)
        os.makedirs(final_stems_path, exist_ok=True)
        
        source_names = ['drums', 'bass', 'other', 'vocals']
        sources_dict = {}
        
        for i, source_name in enumerate(source_names):
            if i >= sources.shape[0]: continue
            source_audio = sources[i]
            if source_audio.shape[0] > 1: source_audio_mono = np.mean(source_audio, axis=0)
            else: source_audio_mono = source_audio[0]
            
            output_path = os.path.join(final_stems_path, f"{source_name}.wav")
            sf.write(output_path, source_audio_mono, int(model.samplerate), subtype='PCM_16')
            sources_dict[source_name] = output_path
            
        return sources_dict
    except Exception as e:
        raise RuntimeError(f"Demucs failed: {e}")

# --- 2. VOICE IMPLEMENTATION (MultiDecoderDPRNN) ---
def run_speechbrain_separation(input_filepath, Fs, output_dir):
    """
    Runs the MultiDecoderDPRNN model. 
    """
    print(f"Running MultiDecoderDPRNN on {input_filepath}...")
    
    # 1. Load the model
    model = _load_voice_model()
    os.makedirs(output_dir, exist_ok=True)

    # 2. Load Audio
    try:
        mixture, file_fs = torchaudio.load(input_filepath)
        
        # SAFETY: FORCE MONO
        if mixture.shape[0] > 1:
            mixture = torch.mean(mixture, dim=0, keepdim=True)

        # SAFETY: FORCE 8kHz RESAMPLE (Model Requirement)
        MODEL_SAMPLE_RATE = 8000 
        if file_fs != MODEL_SAMPLE_RATE:
            print(f"Resampling from {file_fs} to {MODEL_SAMPLE_RATE} Hz...")
            resampler = torchaudio.transforms.Resample(orig_freq=file_fs, new_freq=MODEL_SAMPLE_RATE)
            mixture = resampler(mixture)

        mixture = mixture.to(DEVICE)

    except Exception as e:
        raise RuntimeError(f"Failed to load audio file: {e}")

    # 3. Perform Separation
    try:
        with torch.no_grad():
            est_sources = model.separate(mixture)
            est_sources = est_sources.cpu()
    except Exception as e:
        raise RuntimeError(f"Inference failed on MultiDecoderDPRNN: {e}")

    # 4. Save Outputs (Logic from saif.py)
    if est_sources.ndim == 3 and est_sources.shape[0] == 1:
        est_sources = est_sources.squeeze(0)

    sources_dict = {}
    for i in range(est_sources.shape[0]):
        source_key = f"speaker_{i+1}"
        output_path = os.path.join(output_dir, f"{source_key}.wav")
        
        source_tensor = est_sources[i]
        if source_tensor.ndim == 1:
            source_tensor = source_tensor.unsqueeze(0)
            
        # Save at 8000Hz (Model Rate)
        torchaudio.save(output_path, source_tensor, MODEL_SAMPLE_RATE)
        sources_dict[source_key] = output_path

    if not sources_dict:
        raise RuntimeError("Model ran but failed to save output files.")

    print(f"Separation complete. Saved: {list(sources_dict.keys())}")
    return sources_dict