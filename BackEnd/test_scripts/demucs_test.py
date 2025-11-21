import sys
import subprocess
from pathlib import Path

import os
os.environ["TORCHAUDIO_BACKEND"] = "soundfile" 
# This tells the system: "Don't use FFmpeg to save files, use Soundfile instead."
# --- CONFIGURATION ---
# The name of your local file
INPUT_FILENAME = "audio_example.mp3"
# The folder where results will be saved
OUTPUT_FOLDER = "separated_results"
# The model name (htdemucs = 4 stems: vocals, drums, bass, other)
MODEL_NAME = "htdemucs"

def main():
    # 1. Check if the input file exists locally
    input_path = Path(INPUT_FILENAME)
    if not input_path.exists():
        print(f"ERROR: The file '{INPUT_FILENAME}' was not found in this folder.")
        print("Please make sure the mp3 file is next to this script.")
        return

    print(f"--- Starting Demucs Separation for: {INPUT_FILENAME} ---")
    print(f"Model: {MODEL_NAME}")
    print("This might take a minute depending on your computer's speed...")

# 2. Construct the command
    cmd = [
        sys.executable, "-m", "demucs.separate",
        "-n", MODEL_NAME,
        "--out", OUTPUT_FOLDER,
        INPUT_FILENAME
    ]
    
    # --- FORCE SOUNDFILE BACKEND ---
    # We create a copy of the computer's environment variables
    env = os.environ.copy()
    # We force torchaudio to use 'soundfile' instead of 'ffmpeg' or 'torchcodec'
    env["TORCHAUDIO_BACKEND"] = "soundfile" 

    try:
        # 3. Run the command with the modified environment
        subprocess.run(cmd, check=True, env=env)
        
        print("\n" + "="*40)
        print("SUCCESS! Separation complete.")
        print("="*40)
        
        # 4. Tell the user exactly where the files are
        # Demucs structure: output_folder / model_name / file_name / stems
        result_path = Path(OUTPUT_FOLDER) / MODEL_NAME / input_path.stem
        
        print(f"\nYour files are located here:\n{result_path.resolve()}")
        print("\nYou should see:")
        print(" - vocals.wav")
        print(" - drums.wav")
        print(" - bass.wav")
        print(" - other.wav")
        
    except subprocess.CalledProcessError as e:
        print("\nERROR: Demucs failed to run.")
        print("Make sure FFmpeg is installed and added to your PATH.")
        print(f"Details: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    main()