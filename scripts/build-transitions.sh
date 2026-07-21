#!/usr/bin/env bash
# Builds the snap-dive assets from the five existing Higgsfield clips —
# ffmpeg only, nothing regenerated.
#
#   transitions (native <video> playback, one per forward step):
#     t1  OBJECT -> DROP    = clip4k_1
#     t2  DROP   -> SPREAD  = clip4k_2
#     t3  SPREAD -> BOND    = clip4k_3
#     t4  BOND   -> LATTICE = clip4k_4 + clip4k_5 frames 0..63, joined
#         with a 6-frame cross-blend at the boundary (the video
#         equivalent of the frame feathering that already smoothed this
#         join in the scrub build). Frame 64 of clip5 is the fully
#         locked crystal at its most settled — the LATTICE rest frame.
#     t5  EXIT              = clip4k_5 frames 64..192: the pull-back out
#         of the lattice, droplets, and the full-circle return to the
#         bottle. Plays once when the visitor leaves LATTICE downward,
#         then the page releases into the content below.
#
#   Every transition ships in two formats and the client picks with
#   canPlayType: H.264/MP4 (universal hardware decode, Safari) and
#   VP9/WebM (open-codec builds, incl. the QA browser).
#
#   rest stills (what the visitor dwells on between steps) come from
#   the pristine 4K sources: desktop 1920 q90, hidpi 2560 q88, mobile
#   1280 q82. rest0..3 = first frames of clips 1..4; rest4 = clip5
#   frame 64. The 0.2s video fade-in on each departure absorbs the
#   still-to-video encode difference.
#
# Tiers: desktop 1920x1080 (CRF 20 / VP9 32) · mobile 1280x720 (23/34).
# Existing encodes are skipped, so reruns only fill gaps; stills and
# the manifest are always refreshed.
set -euo pipefail
cd "$(dirname "$0")/.."

SRC=bridge/out
OUT=public/dive
XFADE_AT=7.791667 # 8.041667s clip minus a 0.25s blend
SPLIT=64          # clip5 frame where the locked lattice rests
mkdir -p "$OUT/hidpi" "$OUT/m"

X264="-c:v libx264 -preset slow -profile:v high -pix_fmt yuv420p -movflags +faststart -an"
VP9="-c:v libvpx-vp9 -b:v 0 -row-mt 1 -tile-columns 2 -cpu-used 4 -pix_fmt yuv420p -an"

single_graph() { echo "scale=$1:$2:flags=lanczos"; }
final_graph() { # w h — clip4 + head of clip5, blended join
  echo "[1:v]trim=start_frame=0:end_frame=$SPLIT,setpts=PTS-STARTPTS[head];[0:v][head]xfade=transition=fade:duration=0.25:offset=$XFADE_AT[cat];[cat]scale=$1:$2:flags=lanczos[v]"
}
exit_graph() { # w h — tail of clip5
  echo "[0:v]trim=start_frame=$SPLIT,setpts=PTS-STARTPTS,scale=$1:$2:flags=lanczos[v]"
}

enc() { # $1 kind(single|final|exit)  $2 src-index  $3 out  $4 w  $5 h  $6 x264crf  $7 vp9crf
  local kind=$1 idx=$2 out=$3 w=$4 h=$5 c264=$6 cvp9=$7
  local mp4="$out.mp4" webm="$out.webm"
  case $kind in
    single)
      [ -f "$mp4" ] || ffmpeg -v error -y -i "$SRC/clip4k_$idx.mp4" -vf "$(single_graph "$w" "$h")" $X264 -crf "$c264" "$mp4"
      [ -f "$webm" ] || ffmpeg -v error -y -i "$SRC/clip4k_$idx.mp4" -vf "$(single_graph "$w" "$h")" $VP9 -crf "$cvp9" "$webm"
      ;;
    final)
      [ -f "$mp4" ] || ffmpeg -v error -y -i "$SRC/clip4k_4.mp4" -i "$SRC/clip4k_5.mp4" -filter_complex "$(final_graph "$w" "$h")" -map "[v]" $X264 -crf "$c264" "$mp4"
      [ -f "$webm" ] || ffmpeg -v error -y -i "$SRC/clip4k_4.mp4" -i "$SRC/clip4k_5.mp4" -filter_complex "$(final_graph "$w" "$h")" -map "[v]" $VP9 -crf "$cvp9" "$webm"
      ;;
    exit)
      [ -f "$mp4" ] || ffmpeg -v error -y -i "$SRC/clip4k_5.mp4" -filter_complex "$(exit_graph "$w" "$h")" -map "[v]" $X264 -crf "$c264" "$mp4"
      [ -f "$webm" ] || ffmpeg -v error -y -i "$SRC/clip4k_5.mp4" -filter_complex "$(exit_graph "$w" "$h")" -map "[v]" $VP9 -crf "$cvp9" "$webm"
      ;;
  esac
}

echo "== desktop transitions (1920x1080) =="
for i in 1 2 3; do enc single "$i" "$OUT/t$i" 1920 1080 20 32; echo "  t$i"; done
enc final - "$OUT/t4" 1920 1080 20 32
echo "  t4 (clip4 + clip5 head, blended join)"
enc exit - "$OUT/t5" 1920 1080 20 32
echo "  t5 (exit: clip5 tail)"

echo "== mobile transitions (1280x720) =="
for i in 1 2 3; do enc single "$i" "$OUT/m/t$i" 1280 720 23 34; echo "  m/t$i"; done
enc final - "$OUT/m/t4" 1280 720 23 34
enc exit - "$OUT/m/t5" 1280 720 23 34
echo "  m/t4 + m/t5"

still() { # $1 src  $2 frame  $3 width  $4 height  $5 quality  $6 out
  ffmpeg -v error -y -i "$1" -vf "select='eq(n\,$2)',scale=$3:$4:flags=lanczos" \
    -fps_mode vfr -frames:v 1 -c:v libwebp -quality "$5" "$6"
}

echo "== rest stills (from the 4K sources) =="
for i in 1 2 3 4; do
  still "$SRC/clip4k_$i.mp4" 0 1920 1080 90 "$OUT/rest$((i - 1)).webp"
  still "$SRC/clip4k_$i.mp4" 0 2560 1440 88 "$OUT/hidpi/rest$((i - 1)).webp"
  still "$SRC/clip4k_$i.mp4" 0 1280 720 82 "$OUT/m/rest$((i - 1)).webp"
done
still "$SRC/clip4k_5.mp4" "$SPLIT" 1920 1080 90 "$OUT/rest4.webp"
still "$SRC/clip4k_5.mp4" "$SPLIT" 2560 1440 88 "$OUT/hidpi/rest4.webp"
still "$SRC/clip4k_5.mp4" "$SPLIT" 1280 720 82 "$OUT/m/rest4.webp"
echo "  done (desktop q90 / hidpi 2560 q88 / mobile q82)"

echo "== manifest =="
python3 - <<'PY'
import json, os, subprocess

def probe_duration(p):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v",
         "-show_entries", "stream=duration", "-of", "csv=p=0", p],
        capture_output=True, text=True).stdout.strip()
    return round(float(out), 3)

def tier(prefix, width, height):
    ts = []
    for i in range(1, 6):
        base = f"public/dive/{prefix}t{i}"
        ts.append({
            "mp4": {"src": f"/dive/{prefix}t{i}.mp4", "bytes": os.path.getsize(base + ".mp4")},
            "webm": {"src": f"/dive/{prefix}t{i}.webm", "bytes": os.path.getsize(base + ".webm")},
            "duration": probe_duration(base + ".mp4"),
        })
    rests = []
    for i in range(5):
        p = f"public/dive/{prefix}rest{i}.webp"
        rests.append({"src": f"/dive/{prefix}rest{i}.webp", "bytes": os.path.getsize(p)})
    return {"width": width, "height": height, "transitions": ts, "rests": rests}

manifest = {
    "desktop": tier("", 1920, 1080),
    "mobile": tier("m/", 1280, 720),
    "hidpiRests": [
        {"src": f"/dive/hidpi/rest{i}.webp",
         "bytes": os.path.getsize(f"public/dive/hidpi/rest{i}.webp")}
        for i in range(5)
    ],
}
with open("src/data/dive-manifest.json", "w") as f:
    json.dump(manifest, f, indent=2)
for t in ("desktop", "mobile"):
    mp4 = sum(x["mp4"]["bytes"] for x in manifest[t]["transitions"]) / 1e6
    webm = sum(x["webm"]["bytes"] for x in manifest[t]["transitions"]) / 1e6
    print(f"  {t}: mp4 {mp4:.1f} MB · webm {webm:.1f} MB")
PY
echo "done"
