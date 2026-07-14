#!/usr/bin/env python3
"""Build the Q-ARMOR dive frame sequence from the five Seedance clips.

Concatenates the clips with short crossfades at the shared junction keyframes
(each clip was generated with start_image = previous junction and end_image =
next junction, so the dissolve blends two nearly identical images and the join
is invisible), then extracts the scroll-scrub WebP frame sets and rewrites
src/components/site/dive/frame-manifest.json with exact zone boundaries.

Usage:
  python3 scripts/build_dive_frames.py <clip1> <clip2> <clip3> <clip4> <clip5>

Requires ffmpeg/ffprobe (uses imageio-ffmpeg's binary if none on PATH).
"""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
OUT_DESKTOP = REPO / "public/frames/desktop"
OUT_MOBILE = REPO / "public/frames/mobile"
MANIFEST = REPO / "src/components/site/dive/frame-manifest.json"

XFADE = 0.4  # seconds of dissolve at each junction
DESKTOP_FPS = 8  # 24fps source -> every 3rd frame
MOBILE_FPS = 4  # every 6th frame
DESKTOP_W = 1600
MOBILE_W = 960
DESKTOP_Q = 74
MOBILE_Q = 66
ZONE_KEYS = ["SURFACE", "DROP", "SPREAD", "BOND", "LATTICE"]


def ffmpeg_exe() -> str:
    exe = shutil.which("ffmpeg")
    if exe:
        return exe
    import imageio_ffmpeg

    return imageio_ffmpeg.get_ffmpeg_exe()


def probe_duration(ff: str, path: Path) -> float:
    """Container duration via ffmpeg banner (works without a separate ffprobe)."""
    proc = subprocess.run([ff, "-i", str(path)], capture_output=True, text=True)
    for line in proc.stderr.splitlines():
        line = line.strip()
        if line.startswith("Duration:"):
            hms = line.split("Duration:")[1].split(",")[0].strip()
            h, m, s = hms.split(":")
            return int(h) * 3600 + int(m) * 60 + float(s)
    raise RuntimeError(f"no duration found for {path}")


def run(cmd: list[str]) -> None:
    print("+", " ".join(str(c) for c in cmd[:8]), "…" if len(cmd) > 8 else "")
    subprocess.run(cmd, check=True)


def main() -> None:
    clips = [Path(a) for a in sys.argv[1:]]
    if len(clips) != 5:
        sys.exit("pass exactly 5 clips in dive order")
    ff = ffmpeg_exe()

    durs = [probe_duration(ff, c) for c in clips]
    print("clip durations:", [round(d, 2) for d in durs])

    # xfade chain: offset_k = sum(D_1..D_k) - k * XFADE
    offsets = []
    acc = 0.0
    for k, d in enumerate(durs[:-1], start=1):
        acc += d
        offsets.append(acc - k * XFADE)
    total = sum(durs) - XFADE * (len(clips) - 1)
    print("xfade offsets:", [round(o, 2) for o in offsets], "total:", round(total, 2))

    # Build filtergraph
    parts = []
    prev = "[0:v]"
    for i, off in enumerate(offsets, start=1):
        out = f"[x{i}]" if i < len(offsets) or True else "[vout]"
        parts.append(
            f"{prev}[{i}:v]xfade=transition=dissolve:duration={XFADE}:offset={off:.3f}{out}"
        )
        prev = out
    graph = ";".join(parts)
    last = prev

    work = REPO / ".bridge"
    work.mkdir(exist_ok=True)
    master = work / "dive_master.mp4"
    cmd = [ff, "-hide_banner", "-loglevel", "warning", "-y"]
    for c in clips:
        cmd += ["-i", str(c)]
    cmd += [
        "-filter_complex",
        graph,
        "-map",
        last,
        "-c:v",
        "libx264",
        "-crf",
        "14",
        "-preset",
        "fast",
        "-pix_fmt",
        "yuv420p",
        str(master),
    ]
    run(cmd)

    # Extract frame sets
    for out_dir, fps, width, q in (
        (OUT_DESKTOP, DESKTOP_FPS, DESKTOP_W, DESKTOP_Q),
        (OUT_MOBILE, MOBILE_FPS, MOBILE_W, MOBILE_Q),
    ):
        if out_dir.exists():
            shutil.rmtree(out_dir)
        out_dir.mkdir(parents=True)
        run(
            [
                ff,
                "-hide_banner",
                "-loglevel",
                "warning",
                "-y",
                "-i",
                str(master),
                "-vf",
                f"fps={fps},scale={width}:-2",
                "-c:v",
                "libwebp",
                "-quality",
                str(q),
                str(out_dir / "f%04d.webp"),
            ]
        )

    d_count = len(list(OUT_DESKTOP.glob("f*.webp")))
    m_count = len(list(OUT_MOBILE.glob("f*.webp")))
    d_bytes = sum(p.stat().st_size for p in OUT_DESKTOP.glob("f*.webp"))
    m_bytes = sum(p.stat().st_size for p in OUT_MOBILE.glob("f*.webp"))
    print(f"desktop: {d_count} frames, {d_bytes/1e6:.1f} MB")
    print(f"mobile:  {m_count} frames, {m_bytes/1e6:.1f} MB")

    # Zone fractions: junction moment = middle of each dissolve
    bounds = [0.0] + [(off + XFADE / 2) / total for off in offsets] + [1.0]
    zones = [
        {"key": key, "p0": round(bounds[i], 5), "p1": round(bounds[i + 1], 5)}
        for i, key in enumerate(ZONE_KEYS)
    ]

    manifest = {
        "generated": "build_dive_frames.py",
        "fps": 24,
        "desktop": {"basePath": "/frames/desktop", "count": d_count, "ext": "webp", "width": DESKTOP_W},
        "mobile": {"basePath": "/frames/mobile", "count": m_count, "ext": "webp", "width": MOBILE_W},
        "zones": zones,
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n")
    print("manifest written:", MANIFEST)


if __name__ == "__main__":
    main()
