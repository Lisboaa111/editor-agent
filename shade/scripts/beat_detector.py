#!/usr/bin/env python3
"""
Beat detection script using librosa
Usage: python3 beat_detector.py <audio_file>
Output: JSON with BPM and beat timestamps
"""

import sys
import json
import librosa


def detect_beats(audio_path):
    """Detect beats in audio file using librosa"""

    try:
        # Load audio file
        y, sr = librosa.load(audio_path, sr=None)

        # Get duration
        duration = librosa.get_duration(y=y, sr=sr)

        # Get tempo (BPM) and beat frames
        tempo, beats = librosa.beat.beat_track(y=y, sr=sr)

        # Convert beat frames to timestamps
        beat_times = librosa.frames_to_time(beats, sr=sr)

        # Clean up beats - round to 3 decimal places
        beat_times = [round(t, 3) for t in beat_times.tolist()]

        # Estimate energy (RMS)
        rms = librosa.feature.rms(y=y)[0]
        avg_energy = float(sum(rms) / len(rms))

        # Determine mood based on tempo
        mood = "dramatic"
        if tempo >= 120:
            mood = "energetic"
        elif tempo >= 100:
            mood = "upbeat"
        elif tempo < 90:
            mood = "calm"

        return {
            "bpm": round(float(tempo), 1),
            "beats": beat_times,
            "duration": round(duration, 2),
            "energy": round(avg_energy, 4),
            "mood": mood,
        }

    except Exception as e:
        return {"error": str(e)}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python3 beat_detector.py <audio_file>"}))
        sys.exit(1)

    audio_file = sys.argv[1]
    result = detect_beats(audio_file)
    print(json.dumps(result, indent=2))
