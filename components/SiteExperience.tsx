"use client";

import { useEffect, useState } from "react";
import WebglPage from "@/components/WebglPage";
import Hero from "@/components/sections/Hero";
import Opening from "@/components/sections/Opening";
import Science from "@/components/sections/Science";
import Application from "@/components/sections/Application";
import Result from "@/components/sections/Result";
import FooterConversion from "@/components/sections/FooterConversion";
import { useReducedMotion } from "@/lib/usePrefs";

/**
 * Capability gate, per the canonical brief:
 *   - WebGL2 available and motion allowed → the live three.js world
 *     (phones included — they get the lower quality tier, not a lesser
 *     site).
 *   - prefers-reduced-motion or no WebGL2 → the static experience:
 *     the same sections over Higgsfield stills, fully visible without
 *     animation. SSR renders this branch too, so crawlers and no-JS
 *     visitors always get complete content.
 */
import { probeGl } from "@/lib/glCapability";

function StaticSite() {
  return (
    <>
      <Hero />
      <Opening />
      <Science />
      <Application />
      <Result />
      <FooterConversion />
    </>
  );
}

export default function SiteExperience() {
  const reduced = useReducedMotion();
  const [mode, setMode] = useState<"static" | "webgl" | null>(null);

  useEffect(() => {
    // `reduced` is already override-aware: `?motion=force` (see
    // lib/usePrefs.ts) reports false here even when the OS asks for
    // reduced motion, which routes those visitors into the WebGL world.
    const gl = probeGl();
    const next = !reduced && gl.webgl2 ? "webgl" : "static";
    setMode(next);
    // Self-diagnosis for reviewers: one line states which experience was
    // chosen and why, so "the scene didn't play" is answerable from the
    // browser console on any machine.
    const reason = reduced
      ? "prefers-reduced-motion is enabled"
      : !gl.webgl2
        ? "WebGL2 is unavailable in this browser"
        : `renderer: ${gl.renderer}`;
    console.info(
      `[CERAQO] experience: ${next} (${reason})` +
        (next === "static" ? " — append ?motion=force to the URL to view the full WebGL experience" : ""),
    );
  }, [reduced]);

  if (mode === "webgl") return <WebglPage />;
  return <StaticSite />;
}
