# CERAQO™ — Q-ARMOR™

A real-time WebGL launch site for **Q-ARMOR**, CERAQO's next-generation
vehicle surface protection (canonical directive: `docs/BRIEF.md`). One
continuous three.js world; the camera travels a CatmullRom curve
through chapter stations as the visitor scrolls:

> HERO → 01 THE SCIENCE → 02 THE APPLICATION → 03 THE RESULT → pre-order

Dark materials-lab aesthetic: near-black graphite and gunmetal carry the
site; champagne/rose-gold — matching the bottle lettering — is the only
expressive accent. The bottle is a Higgsfield 3D scan (hybrid label
decal from the real photo, `public/images/bottle-hero.png`);
`docs/higgsfield-prompts.md` records every generation.

## Stack

- **Next.js 14** (App Router, TypeScript, static export)
- **three.js via @react-three/fiber + drei** — the live world
- **Tailwind CSS** for the DOM layer; brand tokens in `tailwind.config.ts`
- **GSAP + ScrollTrigger** for DOM scroll animation
- **Lenis** inertia scrolling (native-scroll based)
- **Framer Motion** for menu/UI micro-interactions
- Self-hosted fonts via Fontsource (Archivo also ships as WOFF for
  troika's WebGL text)

## How the experience is built

- **Camera on a curve** (`components/webgl/ScrollRig.tsx`): two
  CatmullRom splines (eye + look target) with a keyframe per chapter
  station; page scroll is remapped so each station's keyframe lands
  exactly when its DOM section is centered (`lib/journey.ts` keeps the
  registry). Exponential damping and a perpetual micro-drift keep the
  camera heavy and alive.
- **Stations** (`components/webgl/World.tsx`): hero/finale bottle,
  instanced bond/lattice assembly (per-instance thresholds scrub the
  crystal together), applicator pad laying a champagne film, droplet
  field on the finished panel, dust atmosphere.
- **WebGL headlines** (`components/webgl/StationText.tsx`): drei/troika
  text — champagne stroke leads, fill solidifies with station focus,
  the outline→fill signature living inside the scene.
- **Adaptive quality** (`components/webgl/Experience.tsx`): DPR clamped
  1–1.75 desktop / 1–1.25 coarse pointer; drei `PerformanceMonitor`
  steps a 3-tier budget (particle counts, transmission materials,
  reflections, postprocessing) down under load and back up with
  headroom. Software rasterizers are detected up front
  (`lib/glCapability.ts`) and locked to the floor tier at 0.7×
  resolution — the documented exception to the DPR clamp, taken only
  where no real GPU exists.
- **Fallback** (`components/SiteExperience.tsx`): prefers-reduced-motion
  or no WebGL2 serves the static experience — the same sections over
  Higgsfield stills, fully visible without animation. The bottle GLB
  falls back to a procedural body if it ever fails to load.
- **Preview override**: append `?motion=force` to the URL to run the
  full WebGL experience (and all scroll animation) even where the OS
  requests reduced motion — for client review only; it can't help
  browsers without WebGL2.
- **Copy** (`lib/copy.ts`): claims marked *verbatim* are the client's
  approved datasheet wording — do not paraphrase them into stronger
  claims.

## Accessibility & performance

- `prefers-reduced-motion`: Lenis is never created, no hidden initial
  states are applied (the no-JS default is fully visible), videos render
  as stills.
- Coarse-pointer devices (phones/tablets) receive optimized posters
  instead of video layers.
- First-load JS ≈ 190 kB; media ≈ 6 MB total across five 1080p loops
  and four WebP stills, lazily gated by viewport and stage state.

## Develop

```sh
npm install
npm run dev        # localhost:3000
npm run build      # static export → out/
npm run qa         # Playwright suite against the production build
```

The QA suite drives the full journey on desktop, mobile and
reduced-motion profiles (`qa/site.spec.ts`) and collects raw WebGL
evidence (`qa/webgl.spec.ts`): WebGL2 context + renderer string, camera
positions at 0/25/50/75/100 % scroll, rAF fps over 5 s of continuous
scroll, tier/DPR adaptation under 4× CPU throttle, console cleanliness.
`node scripts/capture-journey.mjs` records a 20 s screencast and runs
the frame-diff freeze analysis (`scripts/freeze-analysis.py`) on it.
Screenshots land in `qa/__screenshots__/`.

## Asset pipeline

The build container has restricted egress, so the `asset-bridge`
GitHub Action moves bytes between Higgsfield storage and the repo
(`downloads` input → committed to the branch; `uploads` input → PUT to
presigned URLs). Curated masters live in `bridge/review/`;

```sh
node scripts/optimize-media.mjs   # masters → public/media (WebP + H.264)
```

To regenerate or iterate any shot, start from
`docs/higgsfield-prompts.md`.

## Deploy

`deploy-pages.yml` is a manual GitHub Pages workflow (Actions →
deploy-pages → Run workflow). `base_path` feeds Next's `basePath`:
leave empty for a custom domain, use `/ceraqo-website` for project
pages. Any static host serving `out/` works just as well. When a real
domain exists, set `metadataBase` in `app/layout.tsx` so social cards
resolve absolutely, and wire the Shop/Retailer/Contact links in
`lib/copy.ts`.
