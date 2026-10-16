"""Generate the guided-tour narration with the locally installed Kokoro TTS.

Usage:  python audio/generate.py
Writes one mp3 per tour step into audio/ as tour-NN.mp3.
"""
import json
import re
import sys
from pathlib import Path

from kokoro import KPipeline

ROOT = Path(__file__).resolve().parent.parent
VOICE = "af_sarah"
RATE = 24000


def tour_steps():
    """Pull the narration line out of each TOUR entry, in order."""
    src = (ROOT / "object" / "study.mjs").read_text(encoding="utf8")
    block = src[src.index("export const TOUR = [") :]
    block = block[: block.index("\n];")]
    return re.findall(r'.say:\s*"((?:[^"\\]|\\.)*)"', block)


def main():
    steps = tour_steps()
    out_dir = ROOT / "audio"
    out_dir.mkdir(exist_ok=True)
    pipeline = KPipeline(lang_code="a")
    for i, step in enumerate(steps):
        text = step
        parts = []
        for _, _, audio in pipeline(text, voice=VOICE, speed=1.0):
            parts.append(audio)
        if not parts:
            print(f"  step {i}: no audio", file=sys.stderr)
            continue
        import numpy as np
        import wave

        wav = np.concatenate(parts)
        out = out_dir / f"tour-{i:02d}.wav"
        pcm = np.clip(wav * 32767, -32768, 32767).astype("<i2")
        with wave.open(str(out), "wb") as fh:
            fh.setnchannels(1)
            fh.setsampwidth(2)
            fh.setframerate(RATE)
            fh.writeframes(pcm.tobytes())
        print(f"out: {out}")
    print(f"done · {len(steps)} steps")


if __name__ == "__main__":
    main()
