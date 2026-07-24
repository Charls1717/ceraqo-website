# Higgsfield asset record — CERAQO™ Q-ARMOR™

Every visual on the site (except the one real photograph) was generated
with Higgsfield for this build, on 2026-07-24. This file is the complete
record: model, prompt, and where each output ships, so any asset can be
regenerated or art-directed further without archaeology.

## Ground rules this set was generated under

The owner rejected the first generation era of this repo (cold cyan
"AI sci-fi" look). Every prompt below therefore enforces:

- **Palette**: near-black graphite, gunmetal/matte charcoal, warm
  champagne/rose-gold accents matching the bottle lettering. Explicit
  negatives: `no blue tones, no neon`.
- **Anti-AI-look**: photographic vocabulary (lens, aperture, studio
  lighting rig), `fine film grain`, `physically accurate` motion,
  explicit negatives for glow/flare/particle-swarm clichés.
- **Identity**: anything showing the bottle references the real product
  photo (`public/images/bottle-hero.png`, uploaded as media
  `bbfa07bc-2209-4806-b4c5-55a888509f45`) — never a previous generation.

Byte transport between Higgsfield storage and this repo runs through the
`asset-bridge` GitHub Action (the build container has restricted
egress). Curated masters land in `bridge/review/`;
`node scripts/optimize-media.mjs` produces the shipped files in
`public/media/`.

---

## 1 · HERO

### 1a. Hero still (seed frame + poster + social card)

- **Model**: `nano_banana_pro` (served as nano_banana_2), 2K, 16:9, 2 variants, reference: real bottle photo
- **Job (picked)**: `dd71bb5b-400b-45c6-82d9-fdd5e3f9ed7b` → `bridge/review/hero-b.png`
- **Job (rejected)**: `f8cbbfe9-…` — rendered a chrome cap; the real cap is dark gunmetal with a champagne collar
- **Ships as**: `media/hero-poster.webp`, `public/og.jpg`, and start frame of the hero loop

> Cinematic luxury product photograph, hero shot: the exact matte black
> aluminium 30 ml bottle from the reference image — champagne-gold
> CERAQO lettering with thin underline, Q-ARMOR label, silver knurled
> screw cap — standing on a dark polished graphite surface that carries
> a soft mirror reflection of the bottle. Near-black studio environment
> with very subtle atmospheric haze, one warm champagne-gold rim light
> grazing the bottle's right edge, a broad soft neutral key light from
> upper left, deep gunmetal-to-black falloff, generous negative space on
> the left half of the frame for typography, slight low camera angle,
> 85mm lens look, shallow depth of field, fine film grain, no blue
> tones, no neon, no added text, no watermark, restrained
> Bugatti-meets-Bang-&-Olufsen commercial aesthetic

### 1b. Hero loop (video)

- **Model**: `seedance_2_0` std 1080p, 8 s, silent, `start_image` = hero still above
- **Job**: `3ccf65e6-20b2-4cf3-b684-81fc85501cc3`
- **Ships as**: `media/hero-loop.mp4` (AmbientVideo dual-buffer crossfade
  makes the loop seamless in the browser)

> Cinematic luxury product film, continuous single shot: the matte black
> CERAQO Q-ARMOR bottle stands perfectly still on a dark polished
> graphite surface exactly as in the start frame. The camera pushes in
> extremely slowly toward the bottle while a warm champagne-gold studio
> light sweeps gently across the label from left to right, making the
> gold lettering catch and release the light; fine atmospheric haze
> drifts almost imperceptibly in the near-black background; the bottle's
> mirror reflection shimmers softly on the tabletop. The bottle itself
> never moves, label text stays perfectly sharp and unchanged, no
> morphing, constant slow motion, no cuts, deep blacks, gunmetal
> falloff, fine film grain, no blue tones, no neon, silent, restrained
> ultra-premium commercial

---

## 2 · CHAPTER 01 — SCIENCE

### 2a. Crystalline layer forming (video, scene 1)

- **Model**: `seedance_2_0` std 1080p, 6 s, silent, text-to-video
- **Job**: `1a9fcd89-9adb-4af5-990f-6410ba8e17f0`
- **Ships as**: `media/science-crystal.mp4`

> Photorealistic extreme macro cinematography, 100mm macro lens, shallow
> depth of field: across a deep black lacquered surface, an ultra-thin
> transparent liquid glass layer slowly levels and cures, delicate
> crystalline micro-facets locking into place one after another inside
> the clear layer, each facet edge catching a warm champagne-gold studio
> light as it sets, background falling away into near-black graphite and
> gunmetal charcoal, extremely slow deliberate motion, physically
> accurate refraction, fine film grain, restrained
> materials-laboratory mood, no blue tones, no neon, no fantasy glow, no
> particles swarm, no text, silent, premium and understated

### 2b. Coating cross-section (still, scene 2)

- **Model**: `nano_banana_pro`, 2K, 16:9, 2 variants, text-to-image
- **Job (picked)**: `54465895-4045-4b8c-8214-23736afe6f27` → `bridge/review/science-a.png`
- **Job (rejected)**: `cd22df0b-…` — chipped edge read as damage
- **Ships as**: `media/science-layer.webp`

> Photorealistic extreme macro photograph, shot on a 100mm macro lens at
> f/4: an ultra-thin transparent ceramic coating layer seen in
> cross-section on deep black automotive lacquer, the glass-like layer
> rendered as a precise luminous edge with subtle crystalline
> micro-facets inside, warm champagne-gold studio edge light tracing the
> layer boundary, surroundings falling into near-black graphite and
> gunmetal charcoal tones, restrained laboratory aesthetic, fine film
> grain, deep soft shadows, no blue tones, no neon, no glow effects, no
> text, understated and premium

---

## 3 · CHAPTER 02 — APPLICATION

### 3a. Wipe-on motion (video, scene 1)

- **Model**: `seedance_2_0` std 1080p, 6 s, silent, text-to-video
- **Job**: `9a403670-4aa4-463f-838d-61e1f9ec1d31`
- **Ships as**: `media/application-wipe.mp4`

> Photorealistic macro cinematography, premium automotive commercial: a
> round charcoal-black foam applicator pad glides slowly and perfectly
> straight from left to right across a matte graphite-black car body
> panel, laying down a thin transparent liquid film that briefly shows a
> soft warm champagne-gold sheen before leveling into a flawless satin
> finish behind the pad, single warm studio key light from upper left,
> deep gunmetal shadows, shallow depth of field, smooth constant motion
> with no camera shake, fine film grain, no hands, no blue tones, no
> neon, no text, silent, restrained and expensive-looking

### 3b. Three-piece kit (still, scene 2)

- **Model**: `nano_banana_pro`, 2K, 16:9, 2 variants, reference: real bottle photo
- **Job (picked)**: `0b2408e3-8d65-428f-9ec1-384cd85a8005` → `bridge/review/kit-b.png`
- **Job (rejected)**: `f777fa91-…` — chrome cap again + odd dimpled pad
- **Ships as**: `media/application-kit.webp`

> Luxury product photograph of a three-piece vehicle surface-protection
> kit, arranged with museum precision on a dark brushed graphite table:
> the exact matte black aluminium 30 ml bottle from the reference image
> with champagne-gold CERAQO and Q-ARMOR lettering and silver knurled
> cap standing centre-right, a round charcoal-black foam applicator puck
> lying flat to its left, and a neatly folded dark graphite-grey plush
> microfiber cloth behind them. Near-black studio, one warm
> champagne-gold edge light from the right, soft neutral fill from
> above, deep soft shadows, faint reflections in the tabletop, shallow
> depth of field, fine film grain, no blue tones, no neon, no added
> text, no watermark, premium materials-lab aesthetic

---

## 4 · CHAPTER 03 — RESULT

### 4a. Water beading payoff (video, scene 1)

- **Model**: `seedance_2_0` std 1080p, 6 s, silent, text-to-video
- **Job**: `9c972efa-9956-4933-b900-a1d7a74f520d`
- **Ships as**: `media/result-beading.mp4`

> Photorealistic extreme macro cinematography, 100mm macro lens at
> f/2.8, cinematic slow motion: perfect spherical water droplets bead on
> deep glossy black automotive paint, each droplet acting as a tiny lens
> carrying a warm champagne-gold specular highlight on one edge and
> neutral pewter-grey reflections elsewhere, several droplets tremble,
> merge and roll slowly off the panel leaving the black mirror surface
> flawless, dark graphite studio environment, deep blacks with soft
> gunmetal falloff, physically accurate fluid motion, fine film grain,
> no blue tones, no neon, no artificial glow, no text, silent, luxurious
> payoff shot

### 4b. Gloss reflection (still, scene 2)

- **Model**: `nano_banana_pro`, 2K, 16:9, 2 variants, text-to-image
- **Job (picked)**: `69496ce0-0d93-4776-97fd-63c807149ee4` → `bridge/review/gloss-b.png`
- **Job (rejected)**: `5fb61dec-…` — studio light stand visible in reflection
- **Ships as**: `media/result-gloss.webp`

> Photorealistic macro photograph of flawless deep black automotive
> paint after ceramic protection, shot at a low grazing angle on a 100mm
> macro lens: the panel surface behaves like dark glass, carrying a long
> elegant warm champagne-gold reflection band from a linear studio light
> overhead, gunmetal grey micro-gradient falloff, tiny crisp specular
> highlights, mirror depth, near-black graphite environment, fine film
> grain, no blue tones, no neon, no objects, no text, luxurious and
> restrained, premium automotive commercial photography

---

## 5 · FULLSCREEN MENU / FOOTER

### 5a. Ambient drift loop (video)

- **Model**: `seedance_2_0` std 1080p, 6 s, silent, text-to-video
  (generated literally after declining the suggested "IN THE DARK" preset)
- **Job**: `e5ba25c3-e937-4fc3-b294-3f0f0615dfc0`
- **Ships as**: `media/ambient-menu.mp4`

> Abstract dark ambient background plate, minimal and photographic: a
> near-black graphite void with an extremely subtle slow drift of fine
> warm dust motes catching a faint champagne-gold practical light low in
> the frame, soft gunmetal grey gradient breathing almost imperceptibly
> across the darkness, out of focus, constant gentle motion with no
> start and no end, no camera shake, deep true blacks, fine film grain,
> no blue tones, no neon, no objects, no lens flares, no text, silent,
> meditative luxury-brand atmosphere

---

## Superseded during this build (do not use)

Queued before the palette directive landed, replaced the same day and
never shipped: `a404c096` (wipe), `764d218e` (beading), `0df2fafc`
(ambient) — all had "cold ice-blue rim light" in the prompt.

## Regenerating

1. Re-run the prompt above (tweak wording, keep the palette negatives).
2. `media_upload`/`media_confirm` any new reference through the
   asset-bridge `uploads` input if the reference isn't already on the
   platform.
3. Bridge the result into `bridge/review/<slot>.<ext>` via the
   `downloads` input, `git pull`.
4. Update the pick map in `scripts/optimize-media.mjs` if a filename
   changed, then `node scripts/optimize-media.mjs`.
