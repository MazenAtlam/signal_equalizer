"""
Script to check if all required dependencies are installed and accessible.
Run this to diagnose issues with Demucs/SpeechBrain setup.
"""
import sys
import os
import subprocess

def check_python_version():
    """Check Python version."""
    print(f"Python version: {sys.version}")
    version_info = sys.version_info
    if version_info.major < 3 or (version_info.major == 3 and version_info.minor < 8):
        print("⚠ WARNING: Python 3.8+ is recommended")
        return False
    print("✓ Python version OK")
    return True

def check_ffmpeg():
    """Check if FFmpeg is accessible."""
    print("\n--- Checking FFmpeg ---")
    
    # Check in PATH
    try:
        result = subprocess.run(
            ["ffmpeg", "-version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            version_line = result.stdout.split('\n')[0]
            print(f"✓ FFmpeg found in PATH: {version_line}")
            return True
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass
    
    # Check in known locations
    ffmpeg_paths = [
        r"D:\SBE\3rd year\1st term\dsp\projects\task3\Spleeter_test\ffmpeg\bin\ffmpeg.exe",
        r"D:\SBE\3rd year\1st term\dsp\projects\task3\Spleeter_test\ffmpeg\ffmpeg.exe",
    ]
    
    for path in ffmpeg_paths:
        if os.path.exists(path):
            print(f"✓ FFmpeg found at: {path}")
            # Test if it works
            try:
                result = subprocess.run(
                    [path, "-version"],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                if result.returncode == 0:
                    version_line = result.stdout.split('\n')[0]
                    print(f"  Version: {version_line}")
                    return True
            except Exception as e:
                print(f"  ⚠ Found but cannot execute: {e}")
    
    print("✗ FFmpeg not found")
    print("  You may need to:")
    print("  1. Download FFmpeg from https://ffmpeg.org/download.html")
    print("  2. Extract it and place ffmpeg.exe in a bin/ subdirectory")
    print("  3. Or install via: choco install ffmpeg (if you have Chocolatey)")
    return False

def check_torch():
    """Check if PyTorch is installed."""
    print("\n--- Checking PyTorch ---")
    try:
        import torch
        print(f"✓ PyTorch version: {torch.__version__}")
        print(f"  CUDA available: {torch.cuda.is_available()}")
        if torch.cuda.is_available():
            print(f"  CUDA version: {torch.version.cuda}")
        return True
    except ImportError:
        print("✗ PyTorch not installed")
        print("  Install with: pip install torch")
        return False

def check_torchaudio():
    """Check if torchaudio is installed."""
    print("\n--- Checking torchaudio ---")
    try:
        import torchaudio
        print(f"✓ torchaudio version: {torchaudio.__version__}")
        return True
    except ImportError:
        print("✗ torchaudio not installed")
        print("  Install with: pip install torchaudio")
        return False

def check_torchcodec():
    """Check if torchcodec is installed."""
    print("\n--- Checking torchcodec ---")
    try:
        import torchcodec
        print("✓ torchcodec is installed")
        return True
    except ImportError:
        print("✗ torchcodec not installed")
        print("  Install with: pip install torchcodec")
        print("  Or for CUDA: pip install torchcodec --index-url=https://download.pytorch.org/whl/cu118")
        return False

def check_demucs():
    """Check if Demucs is installed and accessible."""
    print("\n--- Checking Demucs ---")
    try:
        import demucs
        print("✓ Demucs package is installed")
        
        # Try to run CLI
        try:
            result = subprocess.run(
                [sys.executable, "-m", "demucs.separate", "--help"],
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode == 0:
                print("✓ Demucs CLI is accessible")
                return True
            else:
                print("⚠ Demucs CLI returned error")
                return False
        except Exception as e:
            print(f"⚠ Cannot run Demucs CLI: {e}")
            return False
    except ImportError:
        print("✗ Demucs not installed")
        print("  Install with: pip install demucs")
        return False

def check_speechbrain():
    """Check if SpeechBrain is installed."""
    print("\n--- Checking SpeechBrain ---")
    try:
        import speechbrain
        print(f"✓ SpeechBrain is installed")
        return True
    except ImportError:
        print("✗ SpeechBrain not installed")
        print("  Install with: pip install speechbrain")
        return False

def check_other_deps():
    """Check other dependencies."""
    print("\n--- Checking Other Dependencies ---")
    deps = {
        'numpy': 'numpy',
        'soundfile': 'soundfile',
        'librosa': 'librosa',
    }
    
    all_ok = True
    for module, name in deps.items():
        try:
            mod = __import__(module)
            version = getattr(mod, '__version__', 'unknown')
            print(f"✓ {name}: {version}")
        except ImportError:
            print(f"✗ {name} not installed")
            print(f"  Install with: pip install {name}")
            all_ok = False
    
    return all_ok

def main():
    print("=" * 60)
    print("Dependency Check for AI Separator")
    print("=" * 60)
    
    results = []
    results.append(("Python", check_python_version()))
    results.append(("FFmpeg", check_ffmpeg()))
    results.append(("PyTorch", check_torch()))
    results.append(("torchaudio", check_torchaudio()))
    results.append(("torchcodec", check_torchcodec()))
    results.append(("Demucs", check_demucs()))
    results.append(("SpeechBrain", check_speechbrain()))
    results.append(("Other deps", check_other_deps()))
    
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    
    all_passed = True
    for name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{status}: {name}")
        if not passed:
            all_passed = False
    
    if all_passed:
        print("\n✓ All dependencies are installed and accessible!")
    else:
        print("\n⚠ Some dependencies are missing. Please install them before using the AI separator.")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())

