#!/usr/bin/env bash
# Builds the scroll-scrub frame sequences from the five source clips.
#
#   bridge/out/clip1.mp4 .. clip5.mp4
#     -> public/frames/desktop/fNNNN.webp  (every 2nd frame, 1600px wide)
#     -> public/frames/mobile/fNNNN.webp   (same frames, 960px wide)
#     -> public/frames/stills/zN.webp      (one curated still per zone)
#     -> public/poster.webp                (first frame)
#     -> src/data/frame-manifest.json      (counts + zone ranges)
#
# Frame numbering is global and continuous across the five clips, in
# dive order, so scrubbing the full sequence is one unbroken shot.

set -euo pipefail
cd "$(dirname "$0")/.."

STEP=2          # keep every 2nd frame
DESKTOP_W=1600
MOBILE_W=960
DESKTOP_Q=80
MOBILE_Q=72

CLIPS=(bridge/out/clip1.mp4 bridge/out/clip2.mp4 bridge/out/clip3.mp4 bridge/out/clip4.mp4 bridge/out/clip5.mp4)
ZONE_IDS=(object drop spread bond lattice)

for c in "${CLIPS[@]}"; do
  [[ -f $c ]] || { echo "missing $c" >&2; exit 1; }
done

rm -rf public/frames
mkdir -p public/frames/desktop public/frames/mobile public/frames/stills
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

global=0
declare -a ZSTART ZEND

for i in "${!CLIPS[@]}"; do
  clip=${CLIPS[$i]}
  echo "== $clip"
  mkdir -p "$TMP/d$i" "$TMP/m$i"
  ffmpeg -hide_banner -loglevel error -i "$clip" \
    -vf "select='not(mod(n\,$STEP))',scale=$DESKTOP_W:-2" -vsync vfr \
    -c:v libwebp -quality $DESKTOP_Q "$TMP/d$i/%05d.webp"
  ffmpeg -hide_banner -loglevel error -i "$clip" \
    -vf "select='not(mod(n\,$STEP))',scale=$MOBILE_W:-2" -vsync vfr \
    -c:v libwebp -quality $MOBILE_Q "$TMP/m$i/%05d.webp"

  n=$(ls "$TMP/d$i" | wc -l)
  ZSTART[$i]=$global
  for f in $(ls "$TMP/d$i" | sort); do
    global=$((global + 1))
    name=$(printf 'f%04d.webp' "$global")
    mv "$TMP/d$i/$f" "public/frames/desktop/$name"
    mv "$TMP/m$i/$f" "public/frames/mobile/$name"
  done
  ZEND[$i]=$((global - 1))
  echo "   $n frames -> global ${ZSTART[$i]}..${ZEND[$i]}"

  # Curated still: middle of the clip, a bit sharper than the scrub set
  mid=$(( (ZSTART[$i] + ZEND[$i]) / 2 - ZSTART[$i] + 1 ))
  cp "public/frames/desktop/$(printf 'f%04d.webp' $((ZSTART[$i] + mid)))" \
     "public/frames/stills/z$((i + 1)).webp"
done

# Feather each clip boundary: Seedance re-encodes the chained start image
# with a whisker of tonal drift, so blend the previous clip's final frame
# into the first few frames of the next clip. The one-frame step becomes a
# short morph and the joint scrubs invisibly.
FEATHER_ALPHAS=(0.83 0.66 0.50 0.33 0.17)
for i in 0 1 2 3; do
  lastfile=$(printf 'f%04d.webp' $((ZEND[$i] + 1)))
  for k in "${!FEATHER_ALPHAS[@]}"; do
    a=${FEATHER_ALPHAS[$k]}
    tgt=$(printf 'f%04d.webp' $((ZEND[$i] + 2 + k)))
    for set in desktop:$DESKTOP_Q mobile:$MOBILE_Q; do
      dir=${set%%:*}; q=${set##*:}
      ffmpeg -hide_banner -loglevel error -y \
        -i "public/frames/$dir/$tgt" -i "public/frames/$dir/$lastfile" \
        -filter_complex "[0:v][1:v]blend=all_expr='A*(1-$a)+B*$a'" \
        -c:v libwebp -quality "$q" "$TMP/feather.webp"
      mv "$TMP/feather.webp" "public/frames/$dir/$tgt"
    done
  done
  echo "   feathered boundary after frame $((ZEND[$i] + 1))"
done

cp public/frames/desktop/f0001.webp public/poster.webp

# Probe output dimensions
read DW DH < <(ffprobe -v error -select_streams v -show_entries stream=width,height -of csv=p=0 public/frames/desktop/f0001.webp | tr ',' ' ')
read MW MH < <(ffprobe -v error -select_streams v -show_entries stream=width,height -of csv=p=0 public/frames/mobile/f0001.webp | tr ',' ' ')

python3 - "$global" "$DW" "$DH" "$MW" "$MH" \
  "${ZSTART[0]},${ZEND[0]}" "${ZSTART[1]},${ZEND[1]}" "${ZSTART[2]},${ZEND[2]}" \
  "${ZSTART[3]},${ZEND[3]}" "${ZSTART[4]},${ZEND[4]}" <<'PY'
import json, sys
count = int(sys.argv[1])
dw, dh, mw, mh = map(int, sys.argv[2:6])
ids = ["object", "drop", "spread", "bond", "lattice"]
zones = []
for zid, pair in zip(ids, sys.argv[6:11]):
    s, e = map(int, pair.split(","))
    zones.append({"id": zid, "start": s, "end": e})
manifest = {
    "generated": True,
    "desktop": {"dir": "/frames/desktop", "width": dw, "height": dh, "count": count},
    "mobile": {"dir": "/frames/mobile", "width": mw, "height": mh, "count": count},
    "zones": zones,
}
with open("src/data/frame-manifest.json", "w") as f:
    json.dump(manifest, f, indent=2)
    f.write("\n")
print("manifest:", count, "frames,", "zones:", zones)
PY

du -sh public/frames/desktop public/frames/mobile
echo "done."
