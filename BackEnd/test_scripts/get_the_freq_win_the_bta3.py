import numpy as np
import matplotlib.pyplot as plt
from scipy.io import wavfile

def analyze_audio_spectrum(filename):
    """
    Reads a wav file, performs FFT, and plots the frequency spectrum.
    """
    try:
        # 1. Read the audio file
        # rate is samples per second (Hz), data is the amplitude array
        rate, data = wavfile.read(filename)
        
        # 2. Handle Stereo vs Mono
        # If data has 2 dimensions, it's stereo. We average channels to get mono.
        if data.ndim > 1:
            print(f"Stereo file detected. converting to mono for analysis...")
            data = data.mean(axis=1)
        else:
            print("Mono file detected.")

        # 3. Perform Fast Fourier Transform (FFT)
        N = len(data)  # Number of samples
        T = 1.0 / rate # Sample spacing (inverse of sample rate)
        
        # yf contains complex values (magnitude and phase)
        yf = np.fft.fft(data)
        
        # xf contains the frequency bins
        xf = np.fft.fftfreq(N, T)

        # 4. Filter for Positive Frequencies only
        # FFT output is symmetric; we only need the first half (positive frequencies)
        # We also usually ignore the DC component (0Hz) at index 0
        r_idx = N // 2
        freqs = xf[1:r_idx]
        magnitudes = np.abs(yf[1:r_idx])

        # 5. Find the Dominant Frequency
        # The index of the maximum magnitude tells us the dominant frequency
        dominant_freq_index = np.argmax(magnitudes)
        dominant_freq = freqs[dominant_freq_index]
        
        print(f"Analysis Complete.")
        print(f"Dominant Frequency found at: {dominant_freq:.2f} Hz")

        # 6. Plotting the Frequency Spectrum (The "Histogram" of frequencies)
        plt.figure(figsize=(12, 6))
        
        # Plot full spectrum
        plt.plot(freqs, magnitudes, color='blue', alpha=0.7)
        plt.title(f'Frequency Domain Analysis of {filename}')
        plt.xlabel('Frequency (Hz)')
        plt.ylabel('Magnitude (Energy)')
        plt.grid(True, which='both', linestyle='--', linewidth=0.5)
        
        # Add a marker for the dominant frequency
        plt.axvline(x=dominant_freq, color='red', linestyle='--', label=f'Dominant: {dominant_freq:.2f} Hz')
        plt.legend()

        # Optional: Limit x-axis to human hearing range or relevant range
        # Most speech/music is below 20kHz. 
        # You can uncomment the line below to zoom in on lower frequencies (e.g., 0-5000 Hz)
        # plt.xlim(0, 5000) 

        plt.tight_layout()
        plt.show()

    except FileNotFoundError:
        print(f"Error: The file '{filename}' was not found.")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    # Ensure 'input.wav' is in the same directory as this script
    analyze_audio_spectrum('../output/AI/vocals.wav')