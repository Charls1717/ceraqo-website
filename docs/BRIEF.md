# CANONICAL BRIEF — read this before anything else

**Status: authoritative, confirmed by the client on 2026-07-24.**

## Rendering directive (current)

The site is a **real-time WebGL experience**: three.js via
@react-three/fiber, one continuous world, the **camera traveling a
CatmullRom curve** through chapter stations as the visitor scrolls.
Instanced-particle bond/lattice effects, GLB bottle (hybrid label decal
permitted — see below), WebGL-rendered display text (drei `Text` /
troika), PRE-ORDER conversion. Adaptive quality is mandatory: clamped
DPR (1–1.75 desktop, 1–1.25 mobile), drei `PerformanceMonitor` stepping
particle counts and postprocessing down under load, graceful degradation
on phones rather than shipping something that chugs.

## Superseded directive (do not resurrect)

An earlier revision of the master prompt contained:

> "For the hero and atmosphere visuals, primarily use
> Higgsfield-generated video loops/stills (see ASSETS section)
> composited with GSAP/CSS parallax, rather than building a real-time
> 3D (.glb) model…"

That sentence is **superseded**. Note for future sessions: it was never
a file in this repository — it arrived as the *task description text*
of the 2026-07-24 build session, i.e. it lives in whatever saved
prompt/automation launches these sessions. If you were launched with a
brief containing that sentence, **this document overrides it.** The
owner should also update the saved task text at its source to stop the
ambiguity from recurring.

## What carries over from the video-loop build (client-approved)

- Chapter structure, section content and all copy (`lib/copy.ts` —
  verbatim datasheet claims stay verbatim).
- The Higgsfield-generated stills/loops (`public/media`,
  `docs/higgsfield-prompts.md`) remain in the repo: stills serve the
  reduced-motion / no-WebGL fallback experience and as texture source
  material. They are no longer the primary rendering path.
- Brand palette: near-black graphite, gunmetal/matte charcoal,
  champagne/rose-gold accents. **No cyan.**
- The real product photo `public/images/bottle-hero.png` is the identity
  reference for the bottle and the source of the label decal.

## Bottle asset rule

Start from the workspace scan GLB. If the scanned label is not crisp,
keep the scanned body and overlay the label as a sharp texture decal
(cropped from the real photo) on a slightly offset cylinder. Do not
block on a perfect scan — the hybrid is expected.

**Outcome (2026-07-24):** the original `sam_3_3d` scan's stored URL now
returns 403 (asset retired), so the scan was regenerated with
`image_to_3d` from the real photo (job `850d0852`, 21.5k vertices). Its
baked texture failed the crispness gate decisively — label text
scattered as garbled UV islands — so the shipped bottle is the
prescribed hybrid: scanned geometry (texture stripped, re-skinned matte
black), sharp label decal from the photo
(`scripts/build-label-decal.mjs`), champagne collar ring overlay. A
procedural lathe body remains as the automatic fallback if the GLB ever
fails to load.

## Verification bar

Live URL + raw outputs (not descriptions): WebGL2 context exists,
`camera.position` sampled at 0/25/50/75/100 % scroll showing real
movement, rAF fps over 5 s of scroll, zero site-originated console
errors, working chapter anchors, screencast + frame-diff freeze
analysis (`scripts/freeze-analysis.py`; baseline to beat: 53 freezes /
47 % frozen / 1.24 s max from the original build).

## Known gap

The full original WebGL master prompt (CH0–CH6 chapter list, exact
station wording) is not recoverable from this repo or session — the
2026-07-24 rebuild reconstructs it from the client's confirmed summary
plus the carried-over chapter structure. If the original text resurfaces,
diff against the implementation and true-up.
