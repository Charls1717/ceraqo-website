# CERAQO™ — Q-ARMOR™

A cinematic, scroll-driven launch site for **Q-ARMOR**, CERAQO's
next-generation vehicle surface protection. One page, three chapters:

> HERO → 01 THE SCIENCE → 02 THE APPLICATION → 03 THE RESULT → conversion

Dark materials-lab aesthetic: near-black graphite and gunmetal carry the
site; champagne/rose-gold — matching the bottle lettering — is the only
expressive accent. Every visual except the supplied product photograph
(`public/images/bottle-hero.png`) was generated with Higgsfield for this
build; `docs/higgsfield-prompts.md` is the full record of models,
prompts, picks and rejects.

## Stack

- **Next.js 14** (App Router, TypeScript, static export)
- **Tailwind CSS** for layout; brand tokens in `tailwind.config.ts`
- **GSAP + ScrollTrigger** for every scroll-driven animation
- **Lenis** inertia scrolling (native-scroll based, so `position:
  sticky` and accessibility keep working)
- **Framer Motion** for menu/UI micro-interactions
- Self-hosted variable fonts via Fontsource (Archivo, Inter,
  Space Grotesk) — no runtime font CDN

## How the experience is built

- **Chapter stage** (`components/chapters/Chapter.tsx`): each chapter
  pins a full-viewport scene stack; entering a subsection scrubs an
  opacity/scale crossfade to its scene. Stage edges dissolve into page
  ink via CSS masks, which is what makes consecutive chapters blend.
- **Seamless loops** (`components/ui/AmbientVideo.tsx`): two buffers
  play the same clip and crossfade near the tail, hiding the loop cut.
  Off-stage and off-screen videos are paused; only one video decodes at
  a time.
- **Outline→fill headlines** (`components/ui/RevealHeadline.tsx`):
  each line exists as a champagne-stroke ghost and a clip-path-masked
  fill, scrubbed by scroll position.
- **Circular CTAs / chapter rail**: SVG rings whose stroke offset is
  written directly from ScrollTrigger progress — no React re-renders in
  the scroll path.
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

The QA suite (`qa/site.spec.ts`) drives the full journey on desktop,
mobile and reduced-motion profiles, checks the menu, newsletter
validation and console cleanliness, and drops screenshots in
`qa/__screenshots__/`.

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
