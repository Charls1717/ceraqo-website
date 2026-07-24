/**
 * Builds the sharp label decal for the WebGL bottle from the real
 * product photograph — the hybrid path the brief prescribes when a 3D
 * scan can't carry crisp label text.
 *
 *   node scripts/build-label-decal.mjs
 *
 * Crops the front label band (CERAQO / rule / Q-ARMOR / defense-grade /
 * 30 ml · n° 001) from public/images/bottle-hero.png and exports
 * public/textures/label-decal.png with a transparent-black surround so
 * it wraps onto a slightly offset cylinder segment without a visible
 * card edge.
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "public", "images", "bottle-hero.png");
const OUT_DIR = path.join(ROOT, "public", "textures");
mkdirSync(OUT_DIR, { recursive: true });

// Label band in source pixels (2752×1536 master, bottle centered).
const CROP = { left: 1168, top: 664, width: 486, height: 648 };

const band = await sharp(SRC)
  .extract(CROP)
  .resize(512, 752)
  .toBuffer();

// Fade the crop's edges so the decal dissolves into the bottle body.
const mask = Buffer.from(
  `<svg width="512" height="752">
     <defs>
       <radialGradient id="g" cx="50%" cy="50%" r="72%">
         <stop offset="70%" stop-color="#fff"/>
         <stop offset="100%" stop-color="#000"/>
       </radialGradient>
     </defs>
     <rect width="512" height="752" fill="url(#g)"/>
   </svg>`,
);

await sharp(band)
  .composite([{ input: mask, blend: "dest-in" }])
  .png()
  .toFile(path.join(OUT_DIR, "label-decal.png"));

console.log("textures/label-decal.png written");
