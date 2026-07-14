# CERAQO — Q-ARMOR

A cinematic "3D scroll" launch site for **Q-ARMOR**, CERAQO's silane-based quartz
ceramic coating. Scrolling down *is* zooming in: one unbroken dive from the
bottle on the table (1×) into the quartz lattice of the cured coating
(1,000,000×), rendered as a scroll-scrubbed canvas frame sequence.

## The dive

Five zones, five generated clips (Seedance 2.0), joined frame-to-frame into a
single continuous shot:

| Zone | Magnification | Story |
| --- | --- | --- |
| 01 OBJECT | 1× | A light sweeps the bottle; the cap lifts; one drop rises. |
| 02 DROP | ~10× | The drop falls toward flawless black paint. |
| 03 SPREAD | ~1,000× | Impact — the liquid levels into a thin transparent wave. |
| 04 BOND | ~100,000× | Inside the coating: covalent chains anchor into the surface. |
| 05 LATTICE | 1,000,000× | The quartz lattice locks; pull back to the finished panel. |

## Stack

- Vite + React + TypeScript
- GSAP ScrollTrigger (scrub) + Lenis (smooth scroll)
- Canvas frame sequence (WebP), preloaded by a branded loader
- Space Grotesk (self-hosted via Fontsource)

No template, no site builder. Every visual asset was generated for this build:
a verified hero image of the bottle seeds clip 1; each subsequent clip starts
from the exact final frame of the previous one (Seedance `start_image`), so the
five clips scrub as one continuous dive.

## Develop

```sh
npm install
npm run dev        # localhost:5173
npm run build      # production build
npm run preview
```

## Asset pipeline

Source clips live in `bridge/out/clip1..5.mp4` (fetched by the
`asset-bridge` GitHub Action, which moves media between Higgsfield storage and
this repo — the build container has restricted egress).

```sh
scripts/last-frame.sh bridge/out/clipN.mp4 out.png   # chain frame for clip N+1
scripts/extract-frames.sh                            # rebuild public/frames/* + manifest
```

`scripts/extract-frames.sh` writes:

- `public/frames/desktop/fNNNN.webp` — every 2nd frame, 1600px wide
- `public/frames/mobile/fNNNN.webp` — same frames, 960px wide (phones load these)
- `public/frames/stills/zN.webp` — curated stills for the
  `prefers-reduced-motion` fallback
- `src/data/frame-manifest.json` — frame counts + zone ranges that drive the
  HUD and copy timing

## Accessibility & performance

- `prefers-reduced-motion`: no scrub, no smooth scroll — curated stills with
  the same facts.
- Canvas draws only when the frame index changes and only while in view.
- HUD counters write straight to the DOM from the scroll callback; no React
  re-renders inside the dive.

## QA

`qa/` holds Playwright proof screenshots of the scrub at 0 / 25 / 50 / 75 /
100 % scroll, regenerated with `npx playwright test` (see `qa/scrub.spec.ts`).
