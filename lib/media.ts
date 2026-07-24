/**
 * Central manifest of every visual asset the experience uses.
 *
 * All entries under /media are Higgsfield generations produced for this
 * build (see docs/higgsfield-prompts.md for the exact prompt behind each
 * file, and how to regenerate variants). /images/bottle-hero.png is the
 * one real photograph — the supplied product shot — and is also the
 * identity reference used by every bottle-bearing generation.
 *
 * If a file is missing at runtime the components degrade gracefully
 * (AmbientVideo falls back to its poster, then to flat ink), so the site
 * survives an incomplete asset drop.
 */

/** Static-export friendly base path (mirrors next.config basePath). */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const asset = (path: string) => `${BASE}${path}`;

export interface VideoAsset {
  mp4: string;
  poster?: string;
}

export const MEDIA = {
  /** Real supplied product photograph (identity reference). */
  bottleHero: asset("/images/bottle-hero.png"),

  /** HERO — slow cinematic push-in on the bottle, dark studio. */
  heroLoop: {
    mp4: asset("/media/hero-loop.mp4"),
    poster: asset("/media/hero-poster.webp"),
  } as VideoAsset,

  /** CH1 SCIENCE a — crystalline layer levelling/curing macro. */
  scienceCrystal: {
    mp4: asset("/media/science-crystal.mp4"),
    poster: asset("/media/science-layer.webp"),
  } as VideoAsset,
  /** CH1 SCIENCE b — coating cross-section still. */
  scienceLayerStill: asset("/media/science-layer.webp"),

  /** CH2 APPLICATION a — applicator pad wipe motion. */
  applicationWipe: {
    mp4: asset("/media/application-wipe.mp4"),
    poster: asset("/media/application-kit.webp"),
  } as VideoAsset,
  /** CH2 APPLICATION b — three-piece kit still. */
  kitStill: asset("/media/application-kit.webp"),

  /** CH3 RESULT a — water beading payoff macro. */
  resultBeading: {
    mp4: asset("/media/result-beading.mp4"),
    poster: asset("/media/result-gloss.webp"),
  } as VideoAsset,
  /** CH3 RESULT b — gloss reflection still. */
  glossStill: asset("/media/result-gloss.webp"),

  /** Fullscreen menu / footer ambient drift. */
  ambientMenu: {
    mp4: asset("/media/ambient-menu.mp4"),
  } as VideoAsset,

  /** The Opening's static fallback still (rendered from the WebGL scene
   *  at the film moment — see scripts/build-opening-still.mjs). */
  openingStill: asset("/media/opening-still.webp"),
} as const;
