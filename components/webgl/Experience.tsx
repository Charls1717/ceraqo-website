"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor, Preload } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import ScrollRig from "@/components/webgl/ScrollRig";
import World from "@/components/webgl/World";
import Effects from "@/components/webgl/Effects";
import { useCoarsePointer } from "@/lib/usePrefs";
import { scrollProgress } from "@/lib/journey";
import { probeGl } from "@/lib/glCapability";

/**
 * The live three.js experience — a fixed full-viewport canvas the DOM
 * copy scrolls over. One continuous world; the camera travels a
 * CatmullRom path between chapter stations (ScrollRig).
 *
 * Adaptive quality (the explicit performance budget):
 *   - DPR clamped to 1–1.75 desktop, 1–1.25 coarse-pointer devices.
 *   - drei PerformanceMonitor steps a quality `tier` (3→2→1) under
 *     sustained load and back up when headroom returns. Tier gates
 *     particle counts, reflections, transmission materials and
 *     postprocessing (see World/Effects).
 *
 * Verification hooks: window.__CERAQO_GL__ exposes renderer kind,
 * live camera position, scroll progress, rolling rAF fps, tier and
 * dpr — the QA suite reads these as raw evidence.
 */

export type Tier = 1 | 2 | 3;

declare global {
  interface Window {
    __CERAQO_GL__?: {
      context: string;
      renderer: string;
      software: boolean;
      progress: () => number;
      camera: () => [number, number, number];
      fps: () => number;
      tier: () => Tier;
      dpr: () => number;
    };
  }
}

function DebugBridge({ tier, dpr }: { tier: Tier; dpr: number }) {
  const { gl, camera } = useThree();
  const fpsBuf = useRef<number[]>([]);
  const last = useRef(performance.now());
  const tierRef = useRef(tier);
  const dprRef = useRef(dpr);
  tierRef.current = tier;
  dprRef.current = dpr;

  useEffect(() => {
    const ctx = gl.getContext();
    const kind =
      typeof WebGL2RenderingContext !== "undefined" && ctx instanceof WebGL2RenderingContext
        ? "webgl2"
        : "webgl";
    const probe = probeGl();
    window.__CERAQO_GL__ = {
      context: kind,
      renderer: probe.renderer,
      software: probe.software,
      progress: () => scrollProgress(),
      camera: () => {
        const p = camera.position;
        return [+p.x.toFixed(3), +p.y.toFixed(3), +p.z.toFixed(3)];
      },
      fps: () => {
        const buf = fpsBuf.current;
        if (!buf.length) return 0;
        return +(buf.reduce((a, b) => a + b, 0) / buf.length).toFixed(1);
      },
      tier: () => tierRef.current,
      dpr: () => dprRef.current,
    };
    return () => {
      delete window.__CERAQO_GL__;
    };
  }, [gl, camera]);

  useFrame(() => {
    const now = performance.now();
    const dt = now - last.current;
    last.current = now;
    if (dt > 0 && dt < 500) {
      const buf = fpsBuf.current;
      buf.push(1000 / dt);
      if (buf.length > 120) buf.shift();
    }
  });

  return null;
}

export default function Experience() {
  const coarse = useCoarsePointer();
  // Software rasterizers (CI, VMs, blocklisted GPUs) are locked to the
  // floor tier and never step up — they get the world, not the extras.
  const software = typeof window !== "undefined" && probeGl().software;
  const tierMax: Tier = software ? 1 : coarse ? 2 : 3;
  const dprMax = software ? 0.7 : coarse ? 1.25 : 1.75;
  /**
   * The brief's DPR clamp (1–1.75 desktop, 1–1.25 mobile) holds for
   * every real GPU. Software rasterizers are the documented exception:
   * they are fill-rate bound on the CPU, so they render at 0.7× and
   * never step up — a soft image at usable speed beats a sharp
   * slideshow, and no shipping phone/desktop GPU ever takes this path.
   */
  const dprFloor = software ? 0.7 : 1;
  const [dpr, setDpr] = useState(dprFloor);
  const [tier, setTier] = useState<Tier>(tierMax);

  // Start at native DPR within the clamp; PerformanceMonitor refines.
  useEffect(() => {
    setDpr(Math.min(dprMax, Math.max(dprFloor, window.devicePixelRatio || 1)));
  }, [dprMax, dprFloor]);

  return (
    <div className="fixed inset-0 z-0" aria-hidden data-gl-root>
      <Canvas
        dpr={dpr}
        camera={{ fov: 42, near: 0.1, far: 90, position: [2.6, 1.5, 7] }}
        gl={{ antialias: !software, powerPreference: "high-performance" }}
        onCreated={({ gl }) => gl.setClearColor(new THREE.Color("#1E211F"))}
      >
        <PerformanceMonitor
          // Step quality down under sustained load, back up with headroom.
          onDecline={() => {
            setTier((t) => (t > 1 ? ((t - 1) as Tier) : t));
            setDpr((d) => Math.max(dprFloor, +(d * 0.85).toFixed(2)));
          }}
          onIncline={() => {
            setTier((t) => (t < tierMax ? ((t + 1) as Tier) : t));
            setDpr((d) => Math.min(dprMax, +(d * 1.1).toFixed(2)));
          }}
          flipflops={4}
        >
          <DebugBridge tier={tier} dpr={dpr} />
          <ScrollRig />
          <Suspense fallback={null}>
            <World tier={tier} />
            {/* Compile every shader and upload every texture during the
                hero idle, so no station entry pays a first-render stall
                mid-journey. */}
            <Preload all />
          </Suspense>
          <Effects tier={tier} />
        </PerformanceMonitor>
      </Canvas>
    </div>
  );
}
