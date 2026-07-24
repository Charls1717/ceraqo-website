"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import Hero from "@/components/sections/Hero";
import Science from "@/components/sections/Science";
import Application from "@/components/sections/Application";
import Result from "@/components/sections/Result";
import FooterConversion from "@/components/sections/FooterConversion";
import { setRanges, type StationRange } from "@/lib/journey";

/** The canvas mounts client-side only — three.js has no SSR story. */
const Experience = dynamic(() => import("@/components/webgl/Experience"), { ssr: false });

const STATION_IDS = ["top", "science", "application", "result", "shop"] as const;

/**
 * WebGL mode composition: the fixed canvas world behind, the DOM copy
 * scrolling over it in `webgl` (bare) mode — chapter sections keep
 * kickers, prose, panels and sub-B headlines but drop their video
 * backgrounds and sub-A display headlines, which now live in-scene as
 * troika text at each camera station.
 *
 * The measurer registers every station's normalized scroll range so
 * the camera curve and the DOM stay in register at any viewport size.
 */
export default function WebglPage() {
  useEffect(() => {
    const measure = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ranges: StationRange[] = [];
      for (const id of STATION_IDS) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.offsetTop;
        const start = Math.max(0, Math.min(1, top / max));
        const end = Math.max(0, Math.min(1, (top + el.offsetHeight - window.innerHeight) / max));
        const center = id === "top" ? 0 : id === "shop" ? 1 : (start + end) / 2;
        ranges.push({ id, start, end, center });
      }
      setRanges(ranges, max);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <>
      <Experience />
      {/* CSS vignette over the canvas — free, so lower tiers can skip
          the postprocessing composer without losing the frame's edge
          falloff (tier 3's Vignette effect simply deepens this). */}
      <div
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(120% 95% at 50% 45%, transparent 55%, rgb(10 11 12 / 0.8) 100%)",
        }}
        aria-hidden
      />
      {/* DOM journey above the canvas */}
      <div className="relative z-10">
        <Hero webgl />
        <Science webgl />
        <Application webgl />
        <Result webgl />
        <FooterConversion />
      </div>
    </>
  );
}
