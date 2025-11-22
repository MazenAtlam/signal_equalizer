import os
import sys
import soundfile as sf
import numpy as np
import time 
import torch # The core AI framework
import torchaudio # Audio processing utility
import librosa
import subprocess
# Configure paths to import utils correctly
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
MODELS_DIR = os.path.join(BASE_DIR, 'models')

# --- FFmpeg Configuration ---
# Try to add FFmpeg to PATH if it exists at the specified location
FFMPEG_POSSIBLE_PATHS = [
    os.path.join(BASE_DIR, "ffmpeg/bin")  # Local BackEnd/ffmpeg directory

]

def _setup_ffmpeg_path():
    """Add FFmpeg to PATH and configure environment variables for torchcodec."""
    current_path = os.environ.get('PATH', '')
    ffmpeg_found = None
    
    # First, check if ffmpeg is already in PATH
    try:
        result = subprocess.run(
            ["ffmpeg", "-version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            print("FFmpeg found in system PATH")
            # Still set TORCHCODEC_FFMPEG_PATH if not set
            if 'TORCHCODEC_FFMPEG_PATH' not in os.environ:
                # Try to find where ffmpeg is
                try:
                    which_result = subprocess.run(
                        ["where", "ffmpeg"] if sys.platform == 'win32' else ["which", "ffmpeg"],
                        capture_output=True,
                        text=True,
                        timeout=5
                    )
                    if which_result.returncode == 0:
                        ffmpeg_exe = which_result.stdout.strip().split('\n')[0]
                        ffmpeg_dir = os.path.dirname(ffmpeg_exe)
                        os.environ['TORCHCODEC_FFMPEG_PATH'] = ffmpeg_dir
                        print(f"Set TORCHCODEC_FFMPEG_PATH to: {ffmpeg_dir}")
                except Exception:
                    pass
            return True
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass
    
    # Check known locations - use absolute paths
    for ffmpeg_path in FFMPEG_POSSIBLE_PATHS:
        # Convert to absolute path
        abs_ffmpeg_path = os.path.abspath(ffmpeg_path)
        if os.path.exists(abs_ffmpeg_path):
            # Check if ffmpeg.exe exists in this path
            ffmpeg_exe = os.path.join(abs_ffmpeg_path, 'ffmpeg.exe')
            if os.path.exists(ffmpeg_exe):
                ffmpeg_found = abs_ffmpeg_path
                print(f"Found FFmpeg at: {ffmpeg_found}")
                break
    
    if ffmpeg_found:
        # Add to PATH (prepend so it's found first)
        if ffmpeg_found not in current_path:
            os.environ['PATH'] = ffmpeg_found + os.pathsep + current_path
            print(f"✓ Added FFmpeg to PATH: {ffmpeg_found}")
        else:
            print(f"✓ FFmpeg already in PATH: {ffmpeg_found}")
        
        # Set environment variables for torchcodec to find FFmpeg
        os.environ['TORCHCODEC_FFMPEG_PATH'] = ffmpeg_found
        print(f"✓ Set TORCHCODEC_FFMPEG_PATH: {ffmpeg_found}")
        
        # On Windows, ensure DLLs can be loaded
        if sys.platform == 'win32':
            # Make sure the path is at the beginning for DLL loading
            env_path = os.environ.get('PATH', '')
            if ffmpeg_found not in env_path:
                os.environ['PATH'] = ffmpeg_found + os.pathsep + env_path
            elif env_path.startswith(ffmpeg_found + os.pathsep):
                pass  # Already at the start
            else:
                # Move to front
                paths = env_path.split(os.pathsep)
                if ffmpeg_found in paths:
                    paths.remove(ffmpeg_found)
                os.environ['PATH'] = ffmpeg_found + os.pathsep + os.pathsep.join(paths)
        
        # Verify FFmpeg works and check version
        try:
            result = subprocess.run(
                [os.path.join(ffmpeg_found, 'ffmpeg.exe'), "-version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                version_line = result.stdout.split('\n')[0]
                print(f"✓ FFmpeg verified: {version_line}")
                
                # Check FFmpeg version - version 8 is not supported on Windows by torchcodec
                if "ffmpeg version 8" in version_line.lower() and sys.platform == 'win32':
                    print("⚠ WARNING: FFmpeg version 8 is NOT supported on Windows by torchcodec!")
                    print("  torchcodec only supports FFmpeg versions 4, 5, 6, and 7 on Windows.")
                    print("  This may cause errors when Demucs tries to save output files.")
                    print("  Recommended: Download FFmpeg version 7 from:")
                    print("  https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip")
                
                return True
        except Exception as e:
            print(f"⚠ Warning: FFmpeg found but cannot execute: {e}")
        
        return True
    
    print("⚠ Warning: FFmpeg not found in expected locations")
    print(f"  Checked paths: {FFMPEG_POSSIBLE_PATHS}")
    return False

# Setup FFmpeg path on module import
_setup_ffmpeg_path()

# --- GLOBAL MODEL INITIALIZATION (Loads models once when server starts) ---
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# Initialize SpeechBrain separator as None, will be loaded lazily on first use
# Demucs uses CLI subprocess, so no global separator needed
SPEECHBRAIN_SEPARATOR = None

def _check_demucs_installed():
    """Check if Demucs is installed and accessible via CLI."""
    try:
        import demucs
        # Try to run demucs CLI to verify it works
        result = subprocess.run(
            [sys.executable, "-m", "demucs.separate", "--help"],
            capture_output=True,
            text=True,
            timeout=10
        )
        return result.returncode == 0
    except (ImportError, subprocess.TimeoutExpired, FileNotFoundError):
        return False

def _load_speechbrain_separator():
    """Lazy load SpeechBrain separator from local models directory."""
    global SPEECHBRAIN_SEPARATOR
    if SPEECHBRAIN_SEPARATOR is None:
        try:
            from speechbrain.pretrained import SepformerSeparation
            
            # Verify models directory exists
            if not os.path.exists(MODELS_DIR):
                raise FileNotFoundError(f"Models directory not found: {MODELS_DIR}")
            
            # Verify required files exist
            required_files = ['hyperparams.yaml', 'encoder.ckpt', 'decoder.ckpt', 'masknet.ckpt']
            for file in required_files:
                file_path = os.path.join(MODELS_DIR, file)
                if not os.path.exists(file_path):
                    raise FileNotFoundError(f"Required model file not found: {file_path}")
            
            print(f"Loading SpeechBrain model from {MODELS_DIR} (Device: {DEVICE})...")
            SPEECHBRAIN_SEPARATOR = SepformerSeparation.from_hparams(
                source=MODELS_DIR,  # Local directory instead of HuggingFace repo
                savedir=MODELS_DIR,
                run_opts={"device": DEVICE}
            )
            print("SpeechBrain model loaded successfully.")
        except ImportError as e:
            raise ImportError("SpeechBrain not installed. Install with: pip install speechbrain") from e
        except Exception as e:
            raise RuntimeError(f"Failed to load SpeechBrain model from {MODELS_DIR}: {str(e)}") from e
    return SPEECHBRAIN_SEPARATOR
# -------------------------------------------------------------------------

# def save_signal_to_temp(signal_array, Fs, signal_id, UPLOAD_FOLDER):
    """
    Saves the current signal (from cache) to a temporary WAV file for AI input.
    Uses PCM_16 format which is widely compatible and doesn't require torchcodec.
    """
    temp_input_filename = f"ai_input_{signal_id}.wav"
    temp_input_filepath = os.path.join(UPLOAD_FOLDER, temp_input_filename)
    
    # Ensure signal is in the right format (float32, normalized to [-1, 1])
    if signal_array.dtype != np.float32:
        signal_array = signal_array.astype(np.float32)
    
    # Normalize to prevent clipping
    max_val = np.max(np.abs(signal_array))
    if max_val > 1.0:
        signal_array = signal_array / max_val
    
    # Save as PCM_16 WAV (standard format, widely compatible)
    sf.write(temp_input_filepath, signal_array, int(Fs), format='WAV', subtype='PCM_16')
    
    # Verify the file was created and is readable
    if not os.path.exists(temp_input_filepath):
        raise RuntimeError(f"Failed to create temporary audio file: {temp_input_filepath}")
    
    return temp_input_filepath

def save_signal_to_temp(signal_array, Fs, signal_id, UPLOAD_FOLDER):
    """
    Saves the current signal (from cache) to a temporary WAV file for AI input.
    Uses PCM_16 format which is widely compatible and doesn't require torchcodec.
    """
    temp_input_filename = f"ai_input_{signal_id}.wav"
    temp_input_filepath = os.path.join(UPLOAD_FOLDER, temp_input_filename)
    
    # Ensure signal is in the right format (float32, normalized to [-1, 1])
    if signal_array.dtype != np.float32:
        signal_array = signal_array.astype(np.float32)
    
    # Normalize to prevent clipping
    max_val = np.max(np.abs(signal_array))
    if max_val > 1.0:
        signal_array = signal_array / max_val

    # --- Convert mono → stereo for Demucs ---
    if signal_array.ndim == 1:  
        signal_array = np.stack([signal_array, signal_array], axis=1)  
        # shape becomes (samples, 2)

    # Save as PCM_16 WAV
    sf.write(temp_input_filepath, signal_array, int(Fs), format='WAV', subtype='PCM_16')
    
    if not os.path.exists(temp_input_filepath):
        raise RuntimeError(f"Failed to create temporary audio file: {temp_input_filepath}")
    
    return temp_input_filepath

# --- 1. DEMUCS IMPLEMENTATION ---
def run_demucs_separation(input_filepath, Fs, output_dir):
    """
    Runs the Demucs model (htdemucs) on the file and saves stems to output_dir.
    Uses Python API with soundfile to avoid torchcodec issues.
    """
    print(f"Running Demucs on {input_filepath} (Device: {DEVICE})...")
    
    try:
        # Try to import Demucs API
        try:
            from demucs.pretrained import get_model
            from demucs.apply import apply_model
        except ImportError as e:
            raise ImportError(
                f"Could not import Demucs API. Error: {e}\n"
                "Please ensure Demucs is installed: pip install demucs\n"
                "Try: pip install --upgrade demucs"
            ) from e
        
        # Load audio using soundfile (avoids torchcodec/torchaudio)
        print("Loading audio file...")
        wav, sr = sf.read(input_filepath, dtype='float32')
        
        # Demucs expects audio in shape [channels, samples]
        # soundfile returns [samples, channels] for multi-channel
        if len(wav.shape) == 1:
            # Mono audio
            wav = wav.reshape(1, -1)  # [1, samples]
        else:
            # Multi-channel: transpose to [channels, samples]
            wav = wav.T  # [channels, samples]
            if wav.shape[0] > 2:
                wav = wav[:2]  # Take first 2 channels if more than stereo
        
        # Convert to tensor and add batch dimension
        wav_tensor = torch.from_numpy(wav).float().unsqueeze(0).to(DEVICE)  # [batch=1, channels, samples]
        
        # Load model (this will download on first use)
        print("Loading Demucs model (htdemucs)...")
        model = get_model('htdemucs')
        model.to(DEVICE)
        model.eval()
        
        # Get model sample rate
        model_sr = model.samplerate
        
        # Resample if needed
        if sr != model_sr:
            print(f"Resampling from {sr} Hz to {model_sr} Hz...")
            # Resample each channel separately
            if wav.shape[0] == 1:
                # Mono
                wav_resampled = librosa.resample(wav[0], orig_sr=sr, target_sr=model_sr)
                wav_resampled = wav_resampled.reshape(1, -1)
            else:
                # Multi-channel: resample each channel
                wav_resampled = np.array([
                    librosa.resample(wav[i], orig_sr=sr, target_sr=model_sr)
                    for i in range(wav.shape[0])
                ])
            wav = wav_resampled
            wav_tensor = torch.from_numpy(wav).float().unsqueeze(0).to(DEVICE)
            sr = model_sr
        
        # Apply separation
        print("Running separation (this may take a while)...")
        with torch.no_grad():
            sources = apply_model(model, wav_tensor, device=DEVICE, split=True, overlap=0.25, progress=True)
        
        # sources shape: [batch, sources, channels, samples]
        # Expected sources order: ['drums', 'bass', 'other', 'vocals']
        sources = sources.squeeze(0).cpu().numpy()  # [sources=4, channels, samples]
        
        # Create output directory structure
        input_file_base = os.path.splitext(os.path.basename(input_filepath))[0]
        final_stems_path = os.path.join(output_dir, "htdemucs", input_file_base)
        os.makedirs(final_stems_path, exist_ok=True)
        
        # Save each source using soundfile (avoids torchcodec)
        source_names = ['drums', 'bass', 'other', 'vocals']
        sources_dict = {}
        
        print("Saving separated sources...")
        for i, source_name in enumerate(source_names):
            if i >= sources.shape[0]:
                print(f"⚠ Warning: Source index {i} out of range (only {sources.shape[0]} sources)")
                continue
            
            source_audio = sources[i]  # [channels, samples]
            
            # Convert to mono if stereo (take mean of channels)
            if source_audio.shape[0] > 1:
                # Average channels for mono output
                source_audio_mono = np.mean(source_audio, axis=0)
            else:
                source_audio_mono = source_audio[0]
            
            # Ensure it's 1D
            if len(source_audio_mono.shape) > 1:
                source_audio_mono = source_audio_mono.flatten()
            
            # Normalize to prevent clipping (but preserve dynamics)
            max_val = np.max(np.abs(source_audio_mono))
            if max_val > 1.0:
                source_audio_mono = source_audio_mono / max_val
            elif max_val > 0:
                # Normalize to use full dynamic range if not clipping
                source_audio_mono = source_audio_mono / max_val * 0.95  # Leave some headroom
            
            # Save with soundfile (use model sample rate)
            output_path = os.path.join(final_stems_path, f"{source_name}.wav")
            try:
                sf.write(output_path, source_audio_mono, int(sr), format='WAV', subtype='PCM_16')
                
                if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                    file_size = os.path.getsize(output_path)
                    sources_dict[source_name] = output_path
                    print(f"✓ Saved {source_name}: {output_path} ({file_size} bytes)")
                else:
                    print(f"⚠ Warning: File created but is empty: {output_path}")
            except Exception as e:
                print(f"⚠ Warning: Failed to save {source_name}: {e}")
        
        if not sources_dict:
            raise RuntimeError("Failed to save any separated sources.")
        
        print(f"✓ Successfully separated and saved {len(sources_dict)} sources")
        return sources_dict
        
    except ImportError as e:
        # If Python API doesn't work, provide helpful error
        raise ImportError(
            f"Demucs Python API import failed: {e}\n"
            "This might be due to an incompatible Demucs version.\n"
            "Try: pip install --upgrade demucs"
        ) from e
    except Exception as e:
        # Fallback: Provide detailed error message
        error_msg = f"Demucs separation failed: {str(e)}\n"
        error_msg += "\nIf this is a torchcodec/FFmpeg error, try:\n"
        error_msg += "1. Install Visual C++ Redistributable:\n"
        error_msg += "   https://aka.ms/vs/17/release/vc_redist.x64.exe\n"
        error_msg += "2. Ensure FFmpeg version 7 is installed (not 8)\n"
        error_msg += "3. Or try downgrading PyTorch: pip install torch==2.4.0 torchaudio==2.4.0"
        raise RuntimeError(error_msg) from e

def run_speechbrain_separation(input_filepath, Fs, output_dir):
    """
    Runs the MultiDecoderDPRNN model with safety checks for Sample Rate and Channels.
    """
    print(f"Running MultiDecoderDPRNN on {input_filepath} (Device: {DEVICE})...")
    
    # 1. Load the model
    model = _load_voice_model()
    os.makedirs(output_dir, exist_ok=True)

    # 2. Load Audio
    try:
        mixture, file_fs = torchaudio.load(input_filepath)
        
        # --- SAFETY CHECK 1: FORCE MONO ---
        # If stereo (2, N), average to mono (1, N)
        if mixture.shape[0] > 1:
            mixture = torch.mean(mixture, dim=0, keepdim=True)

        # --- SAFETY CHECK 2: RESAMPLE IF NEEDED ---
        # Most Asteroid/DPRNN models expect 8000 Hz. 
        # If your model is 8k but file is 44k, we must resample.
        MODEL_SAMPLE_RATE = 8000 
        
        if file_fs != MODEL_SAMPLE_RATE:
            resampler = torchaudio.transforms.Resample(orig_freq=file_fs, new_freq=MODEL_SAMPLE_RATE)
            mixture = resampler(mixture)

        mixture = mixture.to(DEVICE)

    except Exception as e:
        raise RuntimeError(f"Failed to load/process audio file: {e}")

    # 3. Perform Separation
    try:
        with torch.no_grad():
            est_sources = model.separate(mixture)
            est_sources = est_sources.cpu()
    except Exception as e:
        raise RuntimeError(f"Inference failed on MultiDecoderDPRNN: {e}")

    # 4. Save Outputs
    if est_sources.ndim == 3 and est_sources.shape[0] == 1:
        est_sources = est_sources.squeeze(0)

    sources_dict = {}
    print(f"Saving {est_sources.shape[0]} separated sources...")
    
    for i in range(est_sources.shape[0]):
        source_key = f"speaker_{i+1}"
        output_filename = f"{source_key}.wav"
        output_path = os.path.join(output_dir, output_filename)
        
        source_tensor = est_sources[i]
        if source_tensor.ndim == 1:
            source_tensor = source_tensor.unsqueeze(0)
            
        # IMPORTANT: Save at the MODEL'S sample rate (8000), not the original Fs
        torchaudio.save(output_path, source_tensor, MODEL_SAMPLE_RATE)
        sources_dict[source_key] = output_path

    if not sources_dict:
        raise RuntimeError("Model ran but failed to save any output files.")

    print(f"✓ MultiDecoderDPRNN separation complete. Saved {list(sources_dict.keys())}")
    return sources_dict