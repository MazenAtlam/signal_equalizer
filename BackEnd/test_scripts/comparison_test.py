import numpy as np
import soundfile as sf
import os

def load_audio(filepath):
    """Loads audio, converts to mono, and returns numpy array."""
    if not os.path.exists(filepath):
        return None, None
    
    data, fs = sf.read(filepath)
    
    # Convert to mono if stereo
    if len(data.shape) > 1:
        data = np.mean(data, axis=1)
        
    # Normalize to prevent volume differences from skewing results
    max_val = np.max(np.abs(data))
    if max_val > 0:
        data = data / max_val
        
    return data, fs

def calculate_bss_metrics_numpy(reference_target, reference_interference, estimate):
    """
    Calculates SDR, SIR, and SAR using Orthogonal Projections (NumPy only).
    
    Args:
        reference_target (np.array): The AI Output for the target (e.g., AI Vocals).
        reference_interference (np.array): Sum of all other AI outputs (e.g., AI Drums + Bass).
        estimate (np.array): The Equalizer Output (e.g., EQ Vocals).
        
    Returns:
        tuple: (SDR, SIR, SAR) in dB.
    """
    # 1. Length Alignment
    min_len = min(len(reference_target), len(reference_interference), len(estimate))
    s_target = reference_target[:min_len]
    s_interf = reference_interference[:min_len]
    s_est = estimate[:min_len]

    # Small epsilon to avoid divide by zero
    eps = 1e-10

    # 2. Projection 1: Decompose Estimate into Target vs. Error
    # How much of the Target is in the Estimate? (alpha * Target)
    # Formula: Projection = (dot(a, b) / dot(b, b)) * b
    dot_tgt = np.dot(s_est, s_target)
    energy_tgt = np.dot(s_target, s_target) + eps
    alpha = dot_tgt / energy_tgt
    e_target = alpha * s_target  # This is the "Good" audio part

    # The rest is error (Interference + Artifacts)
    e_res = s_est - e_target

    # 3. Projection 2: Decompose Error into Interference vs. Artifacts
    # How much of the Interference is in the remaining error?
    dot_inf = np.dot(e_res, s_interf)
    energy_inf = np.dot(s_interf, s_interf) + eps
    beta = dot_inf / energy_inf
    e_interf = beta * s_interf # This is the "Leakage" part

    # The rest is pure Artifacts (noise/glitches created by the EQ)
    e_artif = e_res - e_interf

    # 4. Calculate Energies for Metrics
    # SDR: Target / (Interference + Artifacts)
    sdr_num = np.sum(e_target ** 2)
    sdr_den = np.sum((e_interf + e_artif) ** 2) + eps
    sdr = 10 * np.log10(sdr_num / sdr_den)

    # SIR: Target / Interference
    sir_num = np.sum(e_target ** 2)
    sir_den = np.sum(e_interf ** 2) + eps
    sir = 10 * np.log10(sir_num / sir_den)

    # SAR: (Target + Interference) / Artifacts
    # SAR measures "how clean is the audio" ignoring that we have interference
    sar_num = np.sum((e_target + e_interf) ** 2)
    sar_den = np.sum(e_artif ** 2) + eps
    sar = 10 * np.log10(sar_num / sar_den)

    return sdr, sir, sar

def run_comparison():
    # --- CONFIGURATION ---
    # Define the names of your sources
    SOURCES = ["vocals", "drums", "bass", "other"]
    
    # FOLDERS
    # AI OUTPUT (Reference / Ground Truth)
    # Note: Update this path to match where your AI script saved files
    AI_FOLDER = "../output/AI" 
    
    # EQUALIZER OUTPUT (Estimate)
    EQ_FOLDER = "../output/equalizer"

    print(f"{'Source':<10} | {'SDR (dB)':<10} | {'SIR (dB)':<10} | {'SAR (dB)':<10}")
    print("-" * 50)

    for source in SOURCES:
        # 1. Load the Reference Target (AI output for this source)
        ref_path = os.path.join(AI_FOLDER, f"{source}.wav")
        ref_target, _ = load_audio(ref_path)
        
        # 2. Load the Estimate (Equalizer output for this source)
        est_path = os.path.join(EQ_FOLDER, f"{source}.wav")
        estimate, _ = load_audio(est_path)

        if ref_target is None or estimate is None:
            print(f"{source:<10} | {'FILES MISSING':<30}")
            continue

        # 3. Load and Sum the Interfering Sources
        # (Interference = Sum of all AI outputs that are NOT the current source)
        interf_sum = np.zeros_like(ref_target)
        has_interference = False
        
        for other_source in SOURCES:
            if other_source != source:
                other_path = os.path.join(AI_FOLDER, f"{other_source}.wav")
                other_data, _ = load_audio(other_path)
                if other_data is not None:
                    # Ensure length match for summation
                    min_l = min(len(interf_sum), len(other_data))
                    interf_sum[:min_l] += other_data[:min_l]
                    has_interference = True
        
        if not has_interference:
            print(f"{source:<10} | {'NO INTERFERENCE DATA':<30}")
            continue

        # 4. Calculate Metrics
        sdr, sir, sar = calculate_bss_metrics_numpy(ref_target, interf_sum, estimate)
        
        print(f"{source:<10} | {sdr:10.2f} | {sir:10.2f} | {sar:10.2f}")

    print("-" * 50)
    print("Metric Definitions (Comparison vs AI Model):")
    print("SDR (Signal-to-Distortion): Overall similarity to the AI model.")
    print("SIR (Signal-to-Interference): How much other AI stems leaked into this EQ stem.")
    print("SAR (Signal-to-Artifacts): 'Digital weirdness' or phase issues in EQ vs AI.")

if __name__ == "__main__":
    run_comparison()