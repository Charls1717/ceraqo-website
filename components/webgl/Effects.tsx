"use client";

import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import type { Tier } from "@/components/webgl/Experience";

/**
 * Postprocessing, tier-gated per the performance budget. Fullscreen
 * composer passes are the single most expensive item on weak devices,
 * so they exist only at the top tier — every other tier gets its
 * vignette from a free CSS overlay (see WebglPage) and renders the
 * scene directly to the drawing buffer.
 *
 *   tier 3 — subtle champagne bloom + vignette (EffectComposer)
 *   tier ≤2 — no composer at all
 */
export default function Effects({ tier }: { tier: Tier }) {
  if (tier < 3) return null;
  return (
    <EffectComposer multisampling={0}>
      <Bloom intensity={0.32} luminanceThreshold={0.8} luminanceSmoothing={0.2} mipmapBlur />
      <Vignette eskil={false} offset={0.18} darkness={0.72} />
    </EffectComposer>
  );
}
