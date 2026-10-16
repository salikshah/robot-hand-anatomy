"""Generate the narration for the 10 s motion reel (motion/motion.html beats)."""
import sys
from pathlib import Path

import numpy as np
import torch
import wave

from kokoro import KPipeline

ROOT = Path(__file__).resolve().parent.parent
VOICE = "af_sarah"
RATE = 24000
TEXT = (
    "A twenty-two degree of freedom, tendon-driven robot hand. "
    "Twenty-five motors, fifteen tendons, tactile fingertips. "
    "Coupled knuckles curl into a fist, then the hand comes apart."
)


def main():
    out = ROOT / "audio" / "reel.wav"
    parts = [a for _, _, a in KPipeline(lang_code="a")(TEXT, voice=VOICE, speed=1.0)]
    if not parts:
        print("no audio", file=sys.stderr)
        sys.exit(1)
    wav = np.concatenate(parts)
    pcm = np.clip(wav * 32767, -32768, 32767).astype("<i2")
    with wave.open(str(out), "wb") as fh:
        fh.setnchannels(1)
        fh.setsampwidth(2)
        fh.setframerate(RATE)
        fh.writeframes(pcm.tobytes())
    seconds = len(pcm) / RATE
    print(f"out: {out} ({seconds:.1f}s)")


if __name__ == "__main__":
    main()
