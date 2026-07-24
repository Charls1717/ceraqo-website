/**
 * Static export so the site ships to GitHub Pages (or any static host) via
 * the repo's existing deploy workflow. NEXT_BASE_PATH mirrors the old Vite
 * `--base` input: empty for a custom-domain/root deploy, "/ceraqo-website"
 * for the default project-pages URL.
 *
 * images.unoptimized is required by `output: "export"`; every still we ship
 * is pre-sized and pre-compressed (WebP) by scripts/optimize-stills.mjs, so
 * the runtime optimizer isn't missed.
 */
const basePath = (process.env.NEXT_BASE_PATH ?? "").replace(/\/+$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

export default nextConfig;
