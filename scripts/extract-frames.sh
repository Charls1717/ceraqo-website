#!/usr/bin/env bash
# Builds the scroll-scrub frame sequences from the five source clips.
#
# Sources, per zone N (1..5):
#   bridge/out/clip4k50_N.mp4 corrected-label re-render (preferred; exists
#                             for zones 1 and 5 — the bottle shots)
#   bridge/out/clip4k_N.mp4   AI-upscaled 4K master
#   bridge/out/clipN.mp4      1080p original (fallback)
#
# Output tiers (same global numbering, zones and feathering in each):
#   public/frames/desktop/fNNNN.webp          1920px q90 — default
#   public/frames/hidpi/fNNNN.webp            2560px q88 — devicePixelRatio-gated
#   public/frames/mobile/fNNNN.webp           1440px q80 — landscape phones
#   public/frames/mobile-portrait/fNNNN.webp  748x1620 q80 — portrait phones
#                             (centre crop to ~9:19.5, full source height)
#   public/frames/stills/zN.webp      one still per zone
#   public/poster.webp, public/og.jpg
#   src/data/frame-manifest.json
#
# Every 2nd source frame; the renderer cross-fades between adjacent
# frames, so spatial quality is spent where it cannot be recovered later.

set -euo pipefail
cd "$(dirname "$0")/.."

STEP=2
declare -A TIER_W=([desktop]=1920 [hidpi]=2560 [mobile]=1440)
declare -A TIER_Q=([desktop]=90 [hidpi]=88 [mobile]=80)
TIERS=(desktop hidpi mobile mobile-portrait)
# mobile-portrait is cropped, not plain-scaled: centre 996px column of the
# 2160-high master, downscaled to 748x1620 (phone cover-crop shows only
# this region, so the sides are pure waste at portrait aspect).
tier_vf() {
  if [[ $1 == mobile-portrait ]]; then
    echo "select='not(mod(n\,$STEP))',crop=996:ih:(iw-996)/2:0,scale=748:1620:flags=lanczos"
  else
    echo "select='not(mod(n\,$STEP))',scale=${TIER_W[$1]}:-2:flags=lanczos"
  fi
}
tier_q() { if [[ $1 == mobile-portrait ]]; then echo 80; else echo "${TIER_Q[$1]}"; fi; }

rm -rf public/frames
mkdir -p public/frames/desktop public/frames/hidpi public/frames/mobile public/frames/mobile-portrait public/frames/stills
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

global=0
declare -a ZSTART ZEND

for i in 0 1 2 3 4; do
  n=$((i + 1))
  clip="bridge/out/clip4k50_$n.mp4"
  [[ -f $clip ]] || clip="bridge/out/clip4k_$n.mp4"
  [[ -f $clip ]] || clip="bridge/out/clip$n.mp4"
  [[ -f $clip ]] || { echo "missing source for zone $n" >&2; exit 1; }
  echo "== zone $n <- $clip"

  for t in "${TIERS[@]}"; do
    mkdir -p "$TMP/$t$i"
    ffmpeg -hide_banner -loglevel error -i "$clip" \
      -vf "$(tier_vf "$t")" -vsync vfr \
      -c:v libwebp -quality "$(tier_q "$t")" "$TMP/$t$i/%05d.webp"
  done

  count=$(ls "$TMP/desktop$i" | wc -l)
  ZSTART[$i]=$global
  for f in $(ls "$TMP/desktop$i" | sort); do
    global=$((global + 1))
    name=$(printf 'f%04d.webp' "$global")
    for t in "${TIERS[@]}"; do
      mv "$TMP/$t$i/$f" "public/frames/$t/$name"
    done
  done
  ZEND[$i]=$((global - 1))
  echo "   $count frames -> global ${ZSTART[$i]}..${ZEND[$i]}"

  mid=$(( (ZSTART[$i] + ZEND[$i]) / 2 + 1 ))
  cp "public/frames/desktop/$(printf 'f%04d.webp' "$mid")" \
     "public/frames/stills/z$n.webp"
done

# Feather each clip boundary in every tier: independently processed clips
# can drift a whisker in tone at the joins; blending the previous final
# frame into the first frames of the next clip makes the step a morph.
FEATHER_ALPHAS=(0.83 0.66 0.50 0.33 0.17)
for i in 0 1 2 3; do
  lastfile=$(printf 'f%04d.webp' $((ZEND[$i] + 1)))
  for k in "${!FEATHER_ALPHAS[@]}"; do
    a=${FEATHER_ALPHAS[$k]}
    tgt=$(printf 'f%04d.webp' $((ZEND[$i] + 2 + k)))
    for t in "${TIERS[@]}"; do
      ffmpeg -hide_banner -loglevel error -y \
        -i "public/frames/$t/$tgt" -i "public/frames/$t/$lastfile" \
        -filter_complex "[0:v][1:v]blend=all_expr='A*(1-$a)+B*$a'" \
        -c:v libwebp -quality "$(tier_q "$t")" "$TMP/feather.webp"
      mv "$TMP/feather.webp" "public/frames/$t/$tgt"
    done
  done
  echo "   feathered boundary after frame $((ZEND[$i] + 1))"
done

cp public/frames/desktop/f0001.webp public/poster.webp

ffmpeg -y -hide_banner -loglevel error \
  -i "public/frames/desktop/$(printf 'f%04d.webp' "$global")" \
  -vf "scale=1200:675:force_original_aspect_ratio=increase,crop=1200:630" \
  -q:v 3 public/og.jpg

probe() { ffprobe -v error -select_streams v -show_entries stream=width,height -of csv=p=0 "$1" | tr ',' ' '; }
read DW DH < <(probe public/frames/desktop/f0001.webp)
read HW HH < <(probe public/frames/hidpi/f0001.webp)
read MW MH < <(probe public/frames/mobile/f0001.webp)
read PW PH < <(probe public/frames/mobile-portrait/f0001.webp)

python3 - "$global" "$DW" "$DH" "$HW" "$HH" "$MW" "$MH" "$PW" "$PH" \
  "${ZSTART[0]},${ZEND[0]}" "${ZSTART[1]},${ZEND[1]}" "${ZSTART[2]},${ZEND[2]}" \
  "${ZSTART[3]},${ZEND[3]}" "${ZSTART[4]},${ZEND[4]}" <<'PY'
import json, sys
count = int(sys.argv[1])
dw, dh, hw, hh, mw, mh, pw, ph = map(int, sys.argv[2:10])
ids = ["object", "drop", "spread", "bond", "lattice"]
zones = []
for zid, pair in zip(ids, sys.argv[10:15]):
    s, e = map(int, pair.split(","))
    zones.append({"id": zid, "start": s, "end": e})
manifest = {
    "generated": True,
    "desktop": {"dir": "/frames/desktop", "width": dw, "height": dh, "count": count},
    "hidpi": {"dir": "/frames/hidpi", "width": hw, "height": hh, "count": count},
    "mobile": {"dir": "/frames/mobile", "width": mw, "height": mh, "count": count},
    "mobilePortrait": {"dir": "/frames/mobile-portrait", "width": pw, "height": ph, "count": count},
    "zones": zones,
}
with open("src/data/frame-manifest.json", "w") as f:
    json.dump(manifest, f, indent=2)
    f.write("\n")
print("manifest:", count, "frames per tier")
PY

du -sh public/frames/desktop public/frames/hidpi public/frames/mobile
echo "done."
