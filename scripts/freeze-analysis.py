#!/usr/bin/env python3
"""Frame-diff freeze analysis of a screen recording, matching the
method used on the user's real capture: grayscale frame-to-frame mean
absolute difference; a freeze is diff below threshold sustained for
3+ consecutive captured frames.

  python3 scripts/freeze-analysis.py <video> [threshold]
  python3 scripts/freeze-analysis.py --windows <video> [threshold]

Default mode analyses the span between the first and last white-corner
marker burst as one window (the scrub-era behaviour). --windows scores
every inter-burst window separately and aggregates — built for the
snap dive, where rest dwells are static by design and only the marked
playback windows are meaningful.
"""
import json
import subprocess
import sys

args = [a for a in sys.argv[1:] if a != "--windows"]
windows_mode = "--windows" in sys.argv[1:]
video = args[0]
threshold = float(args[1]) if len(args) > 1 else 0.5

W, H = 320, 180
probe = subprocess.run(
    ["ffprobe", "-v", "error", "-select_streams", "v",
     "-show_entries", "stream=r_frame_rate", "-of", "csv=p=0", video],
    capture_output=True, text=True).stdout.strip()
num, den = probe.split("/")
fps = float(num) / float(den)

proc = subprocess.Popen(
    ["ffmpeg", "-v", "error", "-i", video, "-vf", f"scale={W}:{H},format=gray",
     "-f", "rawvideo", "-"],
    stdout=subprocess.PIPE)

frame_bytes = W * H
prev = None
diffs = []
markers = []  # frame indices whose top-left corner is the white marker
fidx = 0
CW, CH = 14, 12  # corner region in the 320x180 downscale (56px at 1280)
while True:
    buf = proc.stdout.read(frame_bytes)
    if len(buf) < frame_bytes:
        break
    corner = sum(buf[y * W + x] for y in range(CH) for x in range(CW)) / (CW * CH)
    if corner > 160:
        markers.append(fidx)
    if prev is not None:
        s = 0
        for a, b in zip(buf, prev):
            s += a - b if a >= b else b - a
        diffs.append(s / frame_bytes)
    prev = buf
    fidx += 1
proc.wait()

def find_episodes(seg):
    frozen = [d < threshold for d in seg]
    episodes = []
    i = 0
    while i < len(frozen):
        if frozen[i]:
            j = i
            while j < len(frozen) and frozen[j]:
                j += 1
            if j - i >= 3:
                episodes.append((i, j - i))
            i = j
        else:
            i += 1
    return episodes


def stats(seg):
    episodes = find_episodes(seg)
    frozen_frames = sum(length for _, length in episodes)
    out = {
        "framesAnalyzed": len(seg),
        "durationS": round(len(seg) / fps, 1),
        "freezeEpisodes": len(episodes),
        "pctTimeFrozen": round(100 * frozen_frames / max(len(seg), 1), 1),
        "longestFreezeS": round(max((length for _, length in episodes), default=0) / fps, 2),
        "medianGapS": None,
    }
    if len(episodes) >= 2:
        starts = [s for s, _ in episodes]
        gaps = sorted(b - a for a, b in zip(starts, starts[1:]))
        out["medianGapS"] = round(gaps[len(gaps) // 2] / fps, 2)
    return out


bursts = []
if markers:
    bursts = [[markers[0]]]
    for m in markers[1:]:
        if m - bursts[-1][-1] <= 3:
            bursts[-1].append(m)
        else:
            bursts.append([m])

if windows_mode and len(bursts) >= 2:
    segments = []
    for a, b in zip(bursts, bursts[1:]):
        s = a[-1] + 2
        e = b[0] - 2
        if e - s >= 5:
            segments.append(diffs[s:e])
    result = {
        "fps": round(fps, 2),
        "windows": [dict(window=i + 1, **stats(seg)) for i, seg in enumerate(segments)],
        "aggregate": stats([d for seg in segments for d in seg]),
    }
    print("FREEZE_ANALYSIS " + json.dumps(result))
else:
    # Analyse between the end of the first burst and the start of the
    # last one — the active window (scrub-era behaviour).
    seg = diffs
    if len(bursts) >= 2:
        seg = diffs[bursts[0][-1] + 2 : bursts[-1][0] - 2]
    result = dict(fps=round(fps, 2), **stats(seg))
    print("FREEZE_ANALYSIS " + json.dumps(result))
