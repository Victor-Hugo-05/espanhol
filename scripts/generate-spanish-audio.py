#!/usr/bin/env python3
"""Generate Spanish MP3 speech files for all present-tense Verb Challenge exercises.

Run locally or on GitHub Actions: python3 scripts/generate-spanish-audio.py
Requires: pip install edge-tts
"""
import asyncio
import json
import pathlib
import random

import edge_tts

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "audio" / "es-present"
DATA = [ROOT / f"verbs-es-present-{i}.json" for i in range(1, 5)]
VOICE = "es-ES-ElviraNeural"


async def generate_clip(index, sentence, sem):
    target = OUT / f"{index:04d}.mp3"
    if target.exists() and target.stat().st_size > 250:
        return False

    async with sem:
        for attempt in range(6):
            try:
                tmp = target.with_suffix(".tmp.mp3")
                communicator = edge_tts.Communicate(sentence, VOICE, rate="-5%")
                await communicator.save(str(tmp))
                if tmp.stat().st_size < 250:
                    raise RuntimeError("Empty or invalid MP3")
                tmp.replace(target)
                print(f"Generated {target.name}: {sentence}", flush=True)
                return True
            except Exception as error:
                print(f"Attempt {attempt+1} failed on {index}: {error}", flush=True)
                tmp.unlink(missing_ok=True)
                if attempt == 5:
                    raise
                await asyncio.sleep(min(25, 2**attempt + random.random()))


async def main():
    exercises = []
    for path in DATA:
        exercises.extend(json.loads(path.read_text(encoding="utf-8")))
    assert len(exercises) == 200, f"Expected 200 questions, got {len(exercises)}"
    OUT.mkdir(parents=True, exist_ok=True)
    sem = asyncio.Semaphore(3)
    jobs = [generate_clip(i, q["sentence"].replace("___", q["correct"]), sem)
            for i, q in enumerate(exercises, 1)]
    results = await asyncio.gather(*jobs, return_exceptions=True)
    errors = [(i, str(r)) for i, r in enumerate(results, 1) if isinstance(r, Exception)]
    if errors:
        raise RuntimeError(f"Could not generate {len(errors)} audio files: {errors[:12]}")
    print(f"All {len(exercises)} Spanish MP3 clips ready; generated {sum(results)}.", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
