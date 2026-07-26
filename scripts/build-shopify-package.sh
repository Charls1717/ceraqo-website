#!/usr/bin/env bash
# Assembles the drag-and-drop Shopify package:
#   shopify-package/cdn-assets/     -> theme Assets folder
#   shopify-package/page-template/  -> theme Templates
#   shopify-package/frames-upload/  -> Content > Files (flat names)
# plus split zips sized for comfortable uploads. The flat-name rule
# MUST match flatAssetName() in src/lib/assetUrl.ts:
#   /frames/desktop/f0001.webp -> qa-frames-desktop-f0001.webp
set -euo pipefail
cd "$(dirname "$0")/.."

npm run build:shopify

OUT=shopify-package
rm -rf "$OUT"
mkdir -p "$OUT/cdn-assets" "$OUT/page-template" "$OUT/frames-upload/misc"

cp dist-shopify/qa-index.js dist-shopify/qa-index.css "$OUT/cdn-assets/"
cp dist-shopify/qa-*.woff dist-shopify/qa-*.woff2 "$OUT/cdn-assets/" 2>/dev/null || true
cp public/favicon.svg "$OUT/cdn-assets/qa-favicon.svg"
cp shopify/page.q-armor.liquid "$OUT/page-template/"
cp shopify/README-SHOPIFY.md "$OUT/README-SHOPIFY.md"

flat() { echo "qa-$(echo "$1" | sed 's#^/##; s#/#-#g')"; }

for t in desktop hidpi mobile mobile-portrait; do
  mkdir -p "$OUT/frames-upload/$t"
  for f in public/frames/$t/*.webp; do
    ln "$f" "$OUT/frames-upload/$t/$(flat "/frames/$t/$(basename "$f")")"
  done
done
for z in public/frames/stills/*.webp; do
  ln "$z" "$OUT/frames-upload/misc/$(flat "/frames/stills/$(basename "$z")")"
done
ln public/poster.webp "$OUT/frames-upload/misc/qa-poster.webp"

cd "$OUT"
zip -q -r -j qarmor-shopify-core.zip README-SHOPIFY.md page-template cdn-assets frames-upload/misc
for t in desktop hidpi mobile mobile-portrait; do
  (cd "frames-upload/$t" && zip -q -r "../../qarmor-frames-$t.zip" .)
done
cd ..
ls -la "$OUT"/*.zip
echo "package ready in $OUT/"
