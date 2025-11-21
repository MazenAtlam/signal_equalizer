import requests
import json
import os
import numpy as np
import soundfile as sf
import time

# --- CONFIGURATION ---
BASE_URL = "http://127.0.0.1:5000/api"
TEST_FILE_NAME = "mixture.wav"
Fs = 44100 # Sampling rate for test audio
T = 5.0    # 5 seconds duration

# --- 1. UTILITY: GENERATE TEST FILE ---
def generate_test_audio_file(filename, Fs, duration):
    """Generates a 5-second WAV file with a simple frequency mix."""
    t = np.linspace(0., duration, int(Fs*duration), endpoint=False)
    
    # Mix three tones (low, mid, high)
    f1, f2, f3 = 200.0, 1500.0, 7000.0
    signal = (0.3 * np.sin(2.*np.pi*f1*t) + 
              0.2 * np.sin(2.*np.pi*f2*t) + 
              0.1 * np.sin(2.*np.pi*f3*t))
              
    # Normalize
    signal /= np.max(np.abs(signal))
    sf.write(filename, signal, Fs, format='WAV', subtype='FLOAT')
    print(f"-> Generated temporary input file: {filename}")

# --- 2. MAIN TEST FUNCTION ---
def run_full_backend_test():
    signal_id = None
    
    # Step 0: Cleanup and Setup
    if os.path.exists(TEST_FILE_NAME):
        os.remove(TEST_FILE_NAME)
        
    generate_test_audio_file(TEST_FILE_NAME, Fs, T)
    
    print("\n=======================================================")
    print("STEP 1: Testing /api/audio/upload (Initial Processing)")
    print("=======================================================")
    
    # Step 1: Upload the file
    try:
        with open(TEST_FILE_NAME, 'rb') as f:
            files = {'file': f}
            upload_url = f"{BASE_URL}/audio/upload"
            response = requests.post(upload_url, files=files)
            response.raise_for_status()
            
            data = response.json()
            signal_id = data.get('signal_id')
            
            print(f"SUCCESS: Signal loaded. ID: {signal_id}")
            
    except requests.exceptions.RequestException as e:
        print(f"FAILURE in Upload Step. Check server status (port 5000). Error: {e}")
        return

    # Step 2: Execute the complex AI Comparison Pipeline
    print("\n=======================================================")
    print("STEP 2: Testing /api/equalizer/equalize_with_ai (DSP + AI)")
    print("=======================================================")
    
    test_payload = {
        'signal_id': signal_id,
        'customized_mode_preset': 'Musical',
        'equalizer_scheme': [
            {'start_frequency': 250, 'end_frequency': 10000, 'scale_value': 1.5}, 
            {'start_frequency': 20, 'end_frequency': 250, 'scale_value': 1.0}
        ]
    }
    
    try:
        comparison_url = f"{BASE_URL}/equalizer/equalize_with_ai"
        
        # Note: We send JSON data directly
        start_time = time.time()
        response = requests.post(comparison_url, json=test_payload)
        response.raise_for_status()
        end_time = time.time()
        
        comparison_data = response.json()
        
        # Final Verification
        print(f"SUCCESS: Comparison pipeline complete in {end_time - start_time:.2f} seconds.")
        print(f"Status: {comparison_data.get('message', 'OK')}")
        print("\n--- RETURNED DATA VERIFICATION ---")
        print(f"Time Series Samples: {len(comparison_data.get('ai_time_series', []))} (Cine Viewer)")
        print(f"Magnitude Points: {len(comparison_data.get('ai_magnitude_arr', []))} (Freq Graph)")
        print(f"Performance Placeholder: {comparison_data.get('performance', {}).get('SDR / SIR / SAR')}")

    except requests.exceptions.RequestException as e:
        print(f"FAILURE in Comparison Step. Check console for Flask Traceback. Error: {e}")

    finally:
        # Cleanup the test audio file
        if os.path.exists(TEST_FILE_NAME):
            os.remove(TEST_FILE_NAME)
            print(f"\n-> Cleaned up {TEST_FILE_NAME}")

if __name__ == "_main_":
    run_full_backend_test()