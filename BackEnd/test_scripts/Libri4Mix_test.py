import os
import torch
import torchaudio
import soundfile as sf
import librosa
from pathlib import Path
import shutil

# --- DUMMY CLASS DEFINITION ---
# We define this class to replace the missing one. 
# It accepts **kwargs so it swallows all the configuration arguments from the YAML without complaining.
class DummySpecAugment(torch.nn.Module):
    def __init__(self, *args, **kwargs):
        super().__init__()
    def forward(self, x, *args, **kwargs):
        return x

# Import SpeechBrain
from speechbrain.inference.separation import SepformerSeparation

def fix_hyperparams_file(model_path):
    """
    Creates a temporary hyperparams file where the missing class 
    is replaced by our local DummySpecAugment.
    """
    original_yaml = Path(model_path) / "hyperparams.yaml"
    fixed_yaml = Path(model_path) / "hyperparams_fixed.yaml"
    
    if not original_yaml.exists():
        raise FileNotFoundError(f"Could not find {original_yaml}")
    
    print(f"Generating fixed config file at: {fixed_yaml}")
    
    with open(original_yaml, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # THE MAGIC REPLACEMENT
    # We replace the missing library class with the one defined in this script (__main__)
    target_str = "speechbrain.lobes.augment.TimeDomainSpecAugment"
    replacement_str = "__main__.DummySpecAugment"
    
    if target_str in content:
        print(f"Found usage of '{target_str}', replacing with Dummy class...")
        new_content = content.replace(target_str, replacement_str)
        
        with open(fixed_yaml, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return str(fixed_yaml)
    else:
        print("Did not find the specific missing class in YAML. Using original file.")
        return str(original_yaml)

def separate_audio(input_audio_path):
    # --- CONFIGURATION ---
    
    # 1. EXACT PATH TO YOUR MODEL FOLDER
    LOCAL_MODEL_PATH = r"D:\SBE\3rd year\1st term\dsp\projects\task3\Code\signal_equalizer\BackEnd\Libri4Mix"
    
    # 2. OUTPUT FOLDER
    OUTPUT_FOLDER = "sep_outputs_4"
    
    # 3. SAMPLE RATE
    MODEL_SR = 8000 
    
    # ---------------------

    input_path = Path(input_audio_path)
    if not input_path.exists():
        print(f"Error: Input file '{input_path}' not found.")
        return

    print(f"--- Processing: {input_path.name} ---")
    
    # --- STEP 1: GENERATE FIXED YAML ---
    try:
        # We create a sanitized version of the config file
        hparams_file_path = fix_hyperparams_file(LOCAL_MODEL_PATH)
    except Exception as e:
        print(f"Error fixing YAML file: {e}")
        return

    print(f"Loading model using config: {hparams_file_path}")
    
    try:
        # We explicitly tell SpeechBrain to use our FIXED yaml file using 'hparams_file'
        # We still pass 'source' and 'savedir' so it knows where to find the .ckpt files
        sep_model = SepformerSeparation.from_hparams(
            source=LOCAL_MODEL_PATH,
            savedir=LOCAL_MODEL_PATH,
            hparams_file=hparams_file_path,
            run_opts={"device": "cuda"} if torch.cuda.is_available() else {"device": "cpu"}
        )
        print("✅ Model loaded successfully!")
    except Exception as e:
        print(f"\nCRITICAL ERROR loading model: {e}")
        return

    # --- STEP 2: PREPARE INPUT ---
    print(f"Resampling input to {MODEL_SR} Hz...")
    y, sr = librosa.load(str(input_path), sr=None, mono=True)
    
    if sr != MODEL_SR:
        y = librosa.resample(y, orig_sr=sr, target_sr=MODEL_SR)
    
    tmp_in = "tmp_input_fix.wav"
    sf.write(tmp_in, y, MODEL_SR)

    # --- STEP 3: RUN SEPARATION ---
    print("Running separation...")
    est_sources = sep_model.separate_file(path=tmp_in) 

    # --- STEP 4: SAVE OUTPUTS ---
    est = est_sources.detach().cpu().squeeze(0) # (Time, Sources)
    est = est.transpose(0, 1) # (Sources, Time)
    
    num_sources = est.shape[0]
    print(f"Model returned {num_sources} separated sources.")

    out_dir = Path(OUTPUT_FOLDER)
    out_dir.mkdir(exist_ok=True)
    
    saved_files = []

    for i, src in enumerate(est, start=1):
        out_filename = f"speaker_{i}.wav"
        out_filepath = out_dir / out_filename
        arr = src.numpy()
        sf.write(str(out_filepath), arr, MODEL_SR)
        saved_files.append(str(out_filepath))
        print(f"Saved: {out_filepath}")

    if os.path.exists(tmp_in):
        os.remove(tmp_in)
    
    # Clean up the temporary yaml file if you want (optional)
    # if "hyperparams_fixed.yaml" in hparams_file_path:
    #     os.remove(hparams_file_path)
        
    return saved_files

if __name__ == "__main__":
    MY_INPUT_FILE = "mixture.wav" 
    separate_audio(MY_INPUT_FILE)