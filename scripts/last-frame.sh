#!/usr/bin/env bash
# Extracts the exact final frame of a clip as a lossless PNG,
# used as the start_image of the next clip in the chain.
#   usage: last-frame.sh <clip.mp4> <out.png>
set -euo pipefail
clip=$1
out=$2
frames=$(ffprobe -v error -select_streams v -count_frames \
  -show_entries stream=nb_read_frames -of csv=p=0 "$clip")
ffmpeg -hide_banner -loglevel error -y -i "$clip" \
  -vf "select='eq(n\,$((frames - 1)))'" -vframes 1 "$out"
echo "$out <- frame $((frames - 1)) of $clip"
