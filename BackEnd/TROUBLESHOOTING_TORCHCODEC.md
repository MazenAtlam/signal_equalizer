# Troubleshooting torchcodec DLL Loading Issues

## Problem
Demucs fails with error: "Could not load libtorchcodec" even though:
- FFmpeg is installed and in PATH
- torchcodec is installed
- DLL files exist but can't be loaded

## Root Cause
This is a common Windows issue where torchcodec DLLs can't load due to:
1. Missing Visual C++ Redistributable
2. PyTorch version incompatibility (PyTorch 2.9.0 might be too new)
3. Missing FFmpeg DLL dependencies

## Solutions (Try in Order)

### Solution 1: Install Visual C++ Redistributable (Most Common Fix)
1. Download and install Visual C++ Redistributable:
   - **64-bit**: https://aka.ms/vs/17/release/vc_redist.x64.exe
   - **32-bit**: https://aka.ms/vs/17/release/vc_redist.x86.exe
2. Restart your computer after installation
3. Test again

### Solution 2: Downgrade PyTorch to Compatible Version
PyTorch 2.9.0 might be too new for torchcodec. Try downgrading:

```bash
# Activate your virtual environment
cd "signal_equalizer\BackEnd"
.\equalizer_ai_venv\Scripts\activate

# Uninstall current versions
pip uninstall torch torchaudio torchcodec -y

# Install compatible versions
pip install torch==2.4.0 torchaudio==2.4.0

# Reinstall torchcodec
pip install torchcodec
```

### Solution 3: Ensure FFmpeg Has All DLLs
FFmpeg needs all its DLLs in the same directory:

1. Download a complete FFmpeg build (not just ffmpeg.exe):
   - https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip
   - Extract the `bin` folder
   - Ensure it contains: `ffmpeg.exe`, `avcodec-*.dll`, `avformat-*.dll`, `avutil-*.dll`, etc.

2. Add the bin directory to PATH:
   ```powershell
   # Add to system PATH or set in environment
   $env:PATH = "C:\path\to\ffmpeg\bin;" + $env:PATH
   ```

### Solution 4: Reinstall torchcodec
Sometimes a clean reinstall helps:

```bash
pip uninstall torchcodec -y
pip install torchcodec --no-cache-dir
```

### Solution 5: Use Alternative PyTorch Installation
If the above doesn't work, try installing from PyTorch's official index:

```bash
# For CPU-only
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu

# For CUDA (if you have GPU)
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu118
```

## Verification

Run the diagnostic script:
```bash
python test_scripts/fix_torchcodec.py
```

This will check:
- Visual C++ Redistributable
- FFmpeg DLLs
- torchcodec installation
- PyTorch version compatibility

## Alternative: Use Older Demucs Version
If torchcodec continues to fail, you can try using an older version of Demucs that might not require torchcodec:

```bash
pip uninstall demucs -y
pip install demucs==3.0.6
```

**Note**: Older versions might have different API, so this is a last resort.

## Current Status
- ✅ FFmpeg detection code is implemented
- ✅ Environment variables are set automatically
- ✅ Error messages provide helpful guidance
- ⚠️ torchcodec DLL loading needs to be fixed (usually Solution 1 or 2)

## Next Steps
1. **First**: Install Visual C++ Redistributable (Solution 1) - this fixes 80% of cases
2. **If that fails**: Downgrade PyTorch (Solution 2)
3. **If still failing**: Run diagnostic script and check specific errors
4. **Last resort**: Try alternative Demucs version or contact support

## Testing
After applying a solution, test with:
```bash
curl -X POST -H "Content-Type: application/json" -d "{\"signal_id\": \"YOUR_SIGNAL_ID\", \"customized_mode_preset\": \"Musical\", \"equalizer_scheme\": [{\"start_frequency\": 250, \"end_frequency\": 10000, \"scale_value\": 1.5}]}" http://127.0.0.1:5000/api/equalizer/equalize_with_ai
```

