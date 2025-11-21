"""
Script to help fix torchcodec DLL loading issues on Windows.
This script checks common issues and provides solutions.
"""
import sys
import os
import subprocess
import platform

def check_vc_redist():
    """Check if Visual C++ Redistributable might be installed."""
    print("Checking for Visual C++ Redistributable...")
    # Common installation paths
    vc_paths = [
        r"C:\Windows\System32\vcruntime140.dll",
        r"C:\Windows\System32\msvcp140.dll",
    ]
    
    found = False
    for path in vc_paths:
        if os.path.exists(path):
            print(f"  ✓ Found: {path}")
            found = True
    
    if not found:
        print("  ✗ Visual C++ Redistributable may not be installed")
        print("  Download from: https://aka.ms/vs/17/release/vc_redist.x64.exe")
        return False
    
    return True

def check_ffmpeg_dlls():
    """Check if FFmpeg DLLs are accessible."""
    print("\nChecking FFmpeg DLLs...")
    
    # Check if ffmpeg is in PATH
    try:
        result = subprocess.run(
            ["ffmpeg", "-version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            print("  ✓ FFmpeg is accessible via PATH")
            # Try to find where ffmpeg.exe is located
            try:
                which_result = subprocess.run(
                    ["where", "ffmpeg"],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                if which_result.returncode == 0:
                    ffmpeg_path = which_result.stdout.strip().split('\n')[0]
                    ffmpeg_dir = os.path.dirname(ffmpeg_path)
                    print(f"  FFmpeg location: {ffmpeg_dir}")
                    
                    # Check for common DLLs
                    dlls = ['avcodec-*.dll', 'avformat-*.dll', 'avutil-*.dll']
                    import glob
                    found_dlls = []
                    for pattern in dlls:
                        matches = glob.glob(os.path.join(ffmpeg_dir, pattern))
                        found_dlls.extend(matches)
                    
                    if found_dlls:
                        print(f"  ✓ Found {len(found_dlls)} FFmpeg DLLs in directory")
                    else:
                        print("  ⚠ No FFmpeg DLLs found in same directory as ffmpeg.exe")
                        print("  This might cause torchcodec to fail loading")
                        return False
                    
                    return True
            except Exception:
                pass
    except Exception:
        print("  ✗ FFmpeg not found in PATH")
        return False
    
    return False

def check_torchcodec():
    """Check torchcodec installation."""
    print("\nChecking torchcodec installation...")
    try:
        import torchcodec
        print("  ✓ torchcodec is installed")
        
        # Try to find the DLL files
        import torchcodec
        torchcodec_path = os.path.dirname(torchcodec.__file__)
        print(f"  torchcodec path: {torchcodec_path}")
        
        # Check for DLL files
        dll_files = [
            'libtorchcodec_core4.dll',
            'libtorchcodec_core5.dll',
            'libtorchcodec_core6.dll',
            'libtorchcodec_core7.dll',
            'libtorchcodec_core8.dll',
        ]
        
        found_dlls = []
        for dll in dll_files:
            dll_path = os.path.join(torchcodec_path, dll)
            if os.path.exists(dll_path):
                found_dlls.append(dll)
        
        if found_dlls:
            print(f"  ✓ Found DLLs: {', '.join(found_dlls)}")
        else:
            print("  ✗ No torchcodec DLLs found")
            return False
        
        return True
    except ImportError:
        print("  ✗ torchcodec is not installed")
        return False

def check_pytorch_version():
    """Check PyTorch version compatibility."""
    print("\nChecking PyTorch version...")
    try:
        import torch
        import torchaudio
        print(f"  PyTorch version: {torch.__version__}")
        print(f"  torchaudio version: {torchaudio.__version__}")
        
        # Check if version might be incompatible
        torch_version = torch.__version__
        if '2.9' in torch_version or '2.8' in torch_version:
            print("  ⚠ PyTorch 2.8+ might have compatibility issues with torchcodec")
            print("  Consider downgrading to PyTorch 2.4.0:")
            print("    pip install torch==2.4.0 torchaudio==2.4.0")
            return False
        
        return True
    except ImportError:
        print("  ✗ PyTorch not installed")
        return False

def main():
    print("=" * 60)
    print("torchcodec DLL Loading Issue Diagnostics")
    print("=" * 60)
    print(f"Platform: {platform.system()} {platform.machine()}")
    print(f"Python: {sys.version}")
    print()
    
    issues = []
    
    if not check_vc_redist():
        issues.append("Visual C++ Redistributable")
    
    if not check_ffmpeg_dlls():
        issues.append("FFmpeg DLLs")
    
    if not check_torchcodec():
        issues.append("torchcodec installation")
    
    if not check_pytorch_version():
        issues.append("PyTorch version compatibility")
    
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    
    if issues:
        print("⚠ Potential issues found:")
        for issue in issues:
            print(f"  - {issue}")
        print("\nRecommended solutions:")
        print("1. Install Visual C++ Redistributable:")
        print("   https://aka.ms/vs/17/release/vc_redist.x64.exe")
        print("2. Ensure FFmpeg has all DLLs in the same directory")
        print("3. Try downgrading PyTorch:")
        print("   pip install torch==2.4.0 torchaudio==2.4.0")
        print("4. Reinstall torchcodec:")
        print("   pip uninstall torchcodec")
        print("   pip install torchcodec")
    else:
        print("✓ No obvious issues found")
        print("If torchcodec still fails, the issue might be:")
        print("- Missing system dependencies")
        print("- DLL conflicts")
        print("- Architecture mismatch (32-bit vs 64-bit)")
    
    return 0 if not issues else 1

if __name__ == "__main__":
    sys.exit(main())

