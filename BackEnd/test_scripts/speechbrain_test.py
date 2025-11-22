import os
import torch
import torchaudio
import soundfile as sf
import librosa
from pathlib import Path
from speechbrain.inference.separation import SepformerSeparation

def separate_audio(input_audio_path):
    # --- CONFIGURATION ---
    # Use raw string (r"...") to handle Windows backslashes correctly
    LOCAL_MODEL_PATH = r"..\models"
    
    OUTPUT_FOLDER = "sep_outputs"
    
    # Ensure the input file exists
    input_path = Path(input_audio_path)
    if not input_path.exists():
        print(f"Error: Input file '{input_path}' not found.")
        return

    print(f"--- processing {input_path.name} ---")

    # 1. Load the Model from Local Folder
    print(f"Loading model from: {LOCAL_MODEL_PATH}")
    
    # Note: source points to your local folder. savedir is set to the same to prevent 
    # SpeechBrain from trying to download files to a cache folder.
    try:
        sep_model = SepformerSeparation.from_hparams(
            source=LOCAL_MODEL_PATH,
            savedir=LOCAL_MODEL_PATH,
            run_opts={"device": "cuda"} if torch.cuda.is_available() else {"device": "cpu"}
        )
        print("Model loaded successfully.")
    except Exception as e:
        print(f"Error loading model. Ensure 'hyperparams.yaml' is in the model folder.\nError: {e}")
        return

    # 2. Prepare Input (Resample to 8k Hz)
    # Most SepFormer models trained on LibriMix expect 8000 Hz.
    model_sr = 8000 
    print(f"Resampling input to {model_sr} Hz...")
    
    y, sr = librosa.load(str(input_path), sr=None, mono=True)
    if sr != model_sr:
        y = librosa.resample(y, orig_sr=sr, target_sr=model_sr)
        print(f"Resampled from {sr} to {model_sr}")
    
    # Save a temporary file for SpeechBrain to read
    tmp_in = "tmp_input_8k.wav"
    sf.write(tmp_in, y, model_sr)

    # 3. Run Separation
    print("Running separation...")
    # separate_file returns a tensor of shape [1, Time, Sources]
    est_sources = sep_model.separate_file(path=tmp_in) 

    # 4. Process and Save Output
    # Move to cpu and remove batch dimension -> (Time, n_src)
    est = est_sources.detach().cpu().squeeze(0)
    # Transpose to (n_src, Time) for saving
    est = est.transpose(0, 1)

    out_dir = Path(OUTPUT_FOLDER)
    out_dir.mkdir(exist_ok=True)
    
    saved_files = []

    for i, src in enumerate(est, start=1):
        # Construct filename (e.g., speaker_1.wav)
        out_filename = f"speaker_{i}.wav"
        out_filepath = out_dir / out_filename
        
        # Convert tensor to numpy and save
        arr = src.numpy()
        sf.write(str(out_filepath), arr, model_sr)
        
        saved_files.append(str(out_filepath))
        print(f"Saved Source {i}: {out_filepath}")

    # Cleanup temp file
    if os.path.exists(tmp_in):
        os.remove(tmp_in)
        
    return saved_files

# --- EXECUTION BLOCK ---
if __name__ == "__main__":
    # CHANGE THIS to the path of the audio file you want to test
    # For example: "C:\\Users\\Name\\Music\\mixture.wav"
    # or just "mixture.wav" if it is in the same folder as this script.
    MY_INPUT_FILE = "mixture.wav" 
    
    if not os.path.exists(MY_INPUT_FILE):
        # Create a dummy file just for demonstration if the user runs this immediately
        # without providing a file, so it doesn't crash.
        print(f"Input file '{MY_INPUT_FILE}' not found. Creating a dummy silence file for testing...")
        import numpy as np
        sr = 8000
        dummy_audio = np.random.uniform(-0.1, 0.1, sr*5) # 5 seconds of white noise
        sf.write(MY_INPUT_FILE, dummy_audio, sr)

    separate_audio(MY_INPUT_FILE)
    
    print("\nDone! Check the 'sep_outputs' folder.")