#!/usr/bin/env python3
"""Frame-diff freeze analysis of a screen recording, matching the
method used on the user's real capture: grayscale frame-to-frame mean
absolute difference; a freeze is diff below threshold sustained for
3+ consecutive captured frames.

  python3 scripts/freeze-analysis.py <video> [threshold]
"""
import json
import subprocess
import sys

video = sys.argv[1]
threshold = float(sys.argv[2]) if len(sys.argv) > 2 else 0.5

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

# Analyse only between the end of the first marker burst and the start
# of the last one — the active-scrub window.
if markers:
    bursts = [[markers[0]]]
    for m in markers[1:]:
        if m - bursts[-1][-1] <= 3:
            bursts[-1].append(m)
        else:
            bursts.append([m])
    if len(bursts) >= 2:
        start = bursts[0][-1] + 2
        end = bursts[-1][0] - 2
        diffs = diffs[start:end]

frozen = [d < threshold for d in diffs]
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

frozen_frames = sum(length for _, length in episodes)
result = {
    "fps": round(fps, 2),
    "framesAnalyzed": len(diffs),
    "durationS": round(len(diffs) / fps, 1),
    "freezeEpisodes": len(episodes),
    "pctTimeFrozen": round(100 * frozen_frames / max(len(diffs), 1), 1),
    "longestFreezeS": round(max((length for _, length in episodes), default=0) / fps, 2),
    "medianGapS": None,
}
if len(episodes) >= 2:
    starts = [s for s, _ in episodes]
    gaps = sorted(b - a for a, b in zip(starts, starts[1:]))
    result["medianGapS"] = round(gaps[len(gaps) // 2] / fps, 2)
print("FREEZE_ANALYSIS " + json.dumps(result))
