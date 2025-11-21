"""
Test script for the /api/equalizer/equalize_with_ai endpoint
"""
import requests
import json
import os

BASE_URL = "http://127.0.0.1:5000"

def test_equalize_with_ai():
    """Test the equalize_with_ai endpoint"""
    
    # Step 1: Upload a file to get a signal_id
    print("Step 1: Uploading audio file...")
    test_file = os.path.join(os.path.dirname(__file__), "mixture.wav")
    
    if not os.path.exists(test_file):
        # Try alternative locations
        test_file = os.path.join(os.path.dirname(__file__), "..", "input", "mixture.wav")
        if not os.path.exists(test_file):
            test_file = os.path.join(os.path.dirname(__file__), "..", "mixture.wav")
    
    if not os.path.exists(test_file):
        print(f"ERROR: Could not find mixture.wav file for testing")
        return False
    
    print(f"Using test file: {test_file}")
    
    with open(test_file, 'rb') as f:
        files = {'file': ('mixture.wav', f, 'audio/wav')}
        response = requests.post(f"{BASE_URL}/api/audio/upload", files=files)
    
    if response.status_code != 200:
        print(f"ERROR: Upload failed with status {response.status_code}")
        print(f"Response: {response.text}")
        return False
    
    upload_data = response.json()
    signal_id = upload_data.get('signal_id')
    print(f"✓ Upload successful! Signal ID: {signal_id}")
    
    # Step 2: Test equalize_with_ai endpoint
    print("\nStep 2: Testing equalize_with_ai endpoint...")
    
    payload = {
        "signal_id": signal_id,
        "customized_mode_preset": "Musical",
        "equalizer_scheme": [
            {
                "start_frequency": 250,
                "end_frequency": 10000,
                "scale_value": 1.5
            },
            {
                "start_frequency": 20,
                "end_frequency": 250,
                "scale_value": 1.0
            }
        ]
    }
    
    headers = {"Content-Type": "application/json"}
    response = requests.post(
        f"{BASE_URL}/api/equalizer/equalize_with_ai",
        headers=headers,
        data=json.dumps(payload)
    )
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print("✓ Success! Response keys:", list(result.keys()))
        if 'ai_frequency_arr' in result:
            print(f"  - Frequency array length: {len(result['ai_frequency_arr'])}")
        if 'ai_magnitude_arr' in result:
            print(f"  - Magnitude array length: {len(result['ai_magnitude_arr'])}")
        if 'ai_time_series' in result:
            print(f"  - Time series length: {len(result['ai_time_series'])}")
        return True
    else:
        print(f"✗ Error: {response.status_code}")
        try:
            error_data = response.json()
            print(f"Error message: {error_data.get('error', 'Unknown error')}")
        except:
            print(f"Response text: {response.text}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Testing /api/equalizer/equalize_with_ai endpoint")
    print("=" * 60)
    
    try:
        success = test_equalize_with_ai()
        if success:
            print("\n" + "=" * 60)
            print("✓ All tests passed!")
            print("=" * 60)
        else:
            print("\n" + "=" * 60)
            print("✗ Tests failed!")
            print("=" * 60)
    except requests.exceptions.ConnectionError:
        print("\nERROR: Could not connect to the server.")
        print("Make sure the Flask server is running on http://127.0.0.1:5000")
    except Exception as e:
        print(f"\nERROR: Unexpected error: {e}")
        import traceback
        traceback.print_exc()

