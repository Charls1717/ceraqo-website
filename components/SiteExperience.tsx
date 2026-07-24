"use client";

import { useEffect, useState } from "react";
import WebglPage from "@/components/WebglPage";
import Hero from "@/components/sections/Hero";
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
    setMode(!reduced && probeGl().webgl2 ? "webgl" : "static");
  }, [reduced]);

  if (mode === "webgl") return <WebglPage />;
  return <StaticSite />;
}
