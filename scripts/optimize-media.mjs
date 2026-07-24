/**
 * Media pipeline: turns curated Higgsfield masters from bridge/review
 * into the web-optimized set the site actually ships (public/media).
 *
 *   node scripts/optimize-media.mjs
 *
 * Stills  → WebP, 1920w (backgrounds render ≤1920 under the vignette),
 *           plus the 1200×630 social card from the hero master.
 * Videos  → H.264 1080p, CRF 23, faststart, silent. One file per clip —
 *           phones and reduced-motion visitors receive stills instead
 *           (see AmbientVideo), so no mobile rendition is needed.
 *
 * The curation map lives here on purpose: which master won each slot is
 * part of the build's record (see docs/higgsfield-prompts.md).
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import ffmpeg from "ffmpeg-static";

const ROOT = path.resolve(import.meta.dirname, "..");
const REVIEW = path.join(ROOT, "bridge", "review");
const OUT = path.join(ROOT, "public", "media");
mkdirSync(OUT, { recursive: true });

/** master file in bridge/review → shipped name in public/media */
const STILLS = [
  ["hero-b.png", "hero-poster.webp"],
  ["kit-b.png", "application-kit.webp"],
  ["science-a.png", "science-layer.webp"],
  ["gloss-b.png", "result-gloss.webp"],
];

const VIDEOS = [
  ["hero-loop.mp4", "hero-loop.mp4"],
  ["science-crystal.mp4", "science-crystal.mp4"],
  ["application-wipe.mp4", "application-wipe.mp4"],
  ["result-beading.mp4", "result-beading.mp4"],
  ["ambient-menu.mp4", "ambient-menu.mp4"],
];

for (const [src, dest] of STILLS) {
  const from = path.join(REVIEW, src);
  if (!existsSync(from)) {
    console.warn(`skip still (missing master): ${src}`);
    continue;
  }
  await sharp(from).resize(1920).webp({ quality: 82 }).toFile(path.join(OUT, dest));
  console.log(`still  ${src} → media/${dest}`);
}

// Social card from the hero master.
const heroMaster = path.join(REVIEW, "hero-b.png");
if (existsSync(heroMaster)) {
  await sharp(heroMaster)
    .resize(1200, 630, { fit: "cover", position: "attention" })
    .jpeg({ quality: 84 })
    .toFile(path.join(ROOT, "public", "og.jpg"));
  console.log("still  hero-b.png → public/og.jpg (1200×630)");
}

for (const [src, dest] of VIDEOS) {
  const from = path.join(REVIEW, src);
  if (!existsSync(from)) {
    console.warn(`skip video (missing master): ${src}`);
    continue;
  }
  execFileSync(ffmpeg, [
    "-hide_banner", "-loglevel", "error", "-y",
    "-i", from,
    "-an",
    "-vf", "scale=1920:1080",
    "-c:v", "libx264", "-preset", "slow", "-crf", "23",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart",
    path.join(OUT, dest),
  ]);
  console.log(`video  ${src} → media/${dest}`);
}

console.log("done.");
