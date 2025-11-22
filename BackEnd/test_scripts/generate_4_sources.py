import torch
import torchaudio
import numpy as np

def create_mix(sources, out_path):
    # Load all 4 source files
    wavs = []
    min_len = float('inf')
    
    for src in sources:
        wav, sr = torchaudio.load(src)
        # Resample to 8k or 16k if needed (LibriMix is usually 8k or 16k)
        # transform = torchaudio.transforms.Resample(sr, 16000)
        # wav = transform(wav)
        wavs.append(wav)
        if wav.shape[1] < min_len:
            min_len = wav.shape[1]

    # Trim all to the minimum length (min mode)
    wavs = [w[:, :min_len] for w in wavs]
    
    # Stack them to create the clean sources reference (4, Time)
    clean_sources = torch.cat(wavs, dim=0)
    
    # Mix them down to 1 channel (sum) and normalize to prevent clipping
    mixture = torch.sum(clean_sources, dim=0, keepdim=True)
    mixture = mixture / torch.max(torch.abs(mixture))
    
    # Save the mixture
    torchaudio.save(out_path, mixture, sr)
    print(f"Created 4-speaker mix at {out_path}")

# Replace these with paths to any 4 clean speech files you have
source_files = ["anas.wav", "mazen.wav", "Mostafa.wav", "sherif.wav"]
create_mix(source_files, "test_mix_4spk.wav")