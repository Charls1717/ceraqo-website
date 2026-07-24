"use client";

import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { asset } from "@/lib/media";
import { rangeOf, scrollProgress } from "@/lib/journey";

/**
 * The hero-grade Q-ARMOR bottle (Part A) and "The Opening" choreography
 * (Part B), self-contained: the animated instance reads the `opening`
 * station's scroll progress every frame and drives cap, droplet, film
 * and nanolayer purely as functions of that progress — fully reversible
 * on scroll-up by construction.
 *
 * Material identity note (deliberate): the real product is a matte
 * black aluminium bottle, and that identity is preserved. The brief's
 * "amber glass + visible liquid" lives where physics allows it — the
 * LIQUID is amber transmission material, revealed inside the neck when
 * the cap lifts and embodied by the falling droplet.
 *
 * Part A details for extreme close-up: geometric cap knurling (real
 * displaced ridges, not a texture), helical neck thread, champagne
 * collar, embossed batch ring, photo-sourced label decal.
 */

const H = 1.5;
const BODY_R = 0.235 * H;
const CAP_R = 0.128 * H;
const NECK_R = 0.115 * H;

const BODY_BLACK = "#101114";
const CAP_GUNMETAL = "#43443F";
const COLLAR_CHAMPAGNE = "#C9A67A";
const LIQUID_AMBER = "#B9803C";

declare global {
  interface Window {
    __CERAQO_OPENING__?: {
      progress: () => number;
      capLift: () => number;
      phase: () => string;
    };
  }
}

/** Progress 0..1 within the `opening` station (0 before, 1 after). */
function openingProgress(): number {
  const r = rangeOf("opening");
  if (!r) return 0;
  const t = scrollProgress();
  return THREE.MathUtils.clamp((t - r.start) / Math.max(1e-5, r.end - r.start), 0, 1);
}

const smooth = (a: number, b: number, x: number) =>
  THREE.MathUtils.smoothstep(THREE.MathUtils.clamp((x - a) / (b - a), 0, 1), 0, 1);

/* ------------------------------------------------------------------ */
/*  Geometry helpers (Part A)                                          */
/* ------------------------------------------------------------------ */

/** Knurled cap: real radial ridges displaced into the cylinder wall. */
function useKnurledCap() {
  return useMemo(() => {
    const height = 0.145 * H;
    const geo = new THREE.CylinderGeometry(CAP_R, CAP_R * 0.985, height, 144, 1, false);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const radial = Math.hypot(v.x, v.z);
      // Side wall only — never the end-cap rims, which shredding ruins.
      if (radial > CAP_R * 0.9 && Math.abs(v.y) < height * 0.49) {
        const theta = Math.atan2(v.z, v.x);
        const k = 1 + Math.sin(theta * 72) * 0.006; // fine machined ridges
        pos.setXYZ(i, v.x * k, v.y, v.z * k);
      }
    }
    geo.computeVertexNormals();
    return geo;
  }, []);
}

/** Helical neck thread — a tube swept along 2.6 turns. */
function useThreadGeometry() {
  return useMemo(() => {
    const turns = 2.6;
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 80; i++) {
      const u = i / 80;
      const a = u * turns * Math.PI * 2;
      points.push(
        new THREE.Vector3(
          Math.cos(a) * NECK_R * 1.01,
          0.008 + u * 0.052 * H,
          Math.sin(a) * NECK_R * 1.01,
        ),
      );
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 120, 0.0045 * H, 6, false);
  }, []);
}

function LabelDecal() {
  const map = useTexture(asset("/textures/label-decal.png"));
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  return (
    <mesh position={[0, H * 0.42, 0]} rotation={[0, Math.PI * 1.84, 0]}>
      <cylinderGeometry args={[BODY_R * 1.012, BODY_R * 1.012, H * 0.42, 48, 1, true, 0, 1.25]} />
      <meshStandardMaterial
        map={map}
        transparent
        roughness={0.5}
        metalness={0.35}
        polygonOffset
        polygonOffsetFactor={-2}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/*  The bottle                                                         */
/* ------------------------------------------------------------------ */

interface Props {
  /** Only the hero instance runs the Opening choreography. */
  animated?: boolean;
  /** Nanolayer speck budget from the quality tier. */
  speckCount?: number;
  /**
   * Quality tier. Transmission materials (liquid, droplet) force an
   * extra full-scene render pass per frame — measured at 5× frame cost
   * under software rasterization — so they exist only at tier 3;
   * lower tiers get glossy opaque amber that reads the same at speed.
   */
  tier?: 1 | 2 | 3;
}

export default function HeroBottle({ animated = false, speckCount = 500, tier = 2 }: Props) {
  const lux = tier === 3;
  const capRef = useRef<THREE.Group>(null);
  const dropRef = useRef<THREE.Mesh>(null);
  const filmRef = useRef<THREE.Mesh>(null);
  const filmRimRef = useRef<THREE.Mesh>(null);
  const specksRef = useRef<THREE.InstancedMesh>(null);
  const sweepRef = useRef<THREE.Mesh>(null);
  const phaseRef = useRef("closed");
  const liftRef = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const capGeo = useKnurledCap();
  const threadGeo = useThreadGeometry();

  const bodyProfile = useMemo(() => {
    const pts: [number, number][] = [
      [0.0, 0.0], [0.21, 0.0], [0.235, 0.02], [0.235, 0.62],
      [0.225, 0.7], [0.19, 0.76], [0.135, 0.8], [0.115, 0.82], [0.115, 0.84],
    ];
    return pts.map(([r, y]) => new THREE.Vector2(r * H, y * H));
  }, []);

  /** Speck field: polar targets inside the film disc + scattered starts. */
  const specks = useMemo(() => {
    const FILM = { x: 0.62, z: 0.66, r: 0.52 };
    return Array.from({ length: speckCount }, (_, i) => {
      const g = (i * 2.399963) % (Math.PI * 2); // golden-angle spiral → even fill
      const rr = FILM.r * Math.sqrt((i + 0.5) / speckCount);
      return {
        tx: FILM.x + Math.cos(g) * rr,
        tz: FILM.z + Math.sin(g) * rr,
        sx: FILM.x + (Math.random() - 0.5) * 1.6,
        sz: FILM.z + (Math.random() - 0.5) * 1.6,
        sy: 0.05 + Math.random() * 0.35,
        seed: Math.random(),
      };
    });
  }, [speckCount]);

  useFrame(({ clock }) => {
    if (!animated) return;
    const p = openingProgress();
    const time = clock.elapsedTime;

    /* Phase map note: the camera rig dwells at this station around the
       section's CENTER, so the whole story completes by ~p 0.75 — the
       final sweep rides the camera's natural departure toward Science,
       which passes directly over the test panel. */

    /* — cap: unthread (spin), lift, drift aside — */
    const unthread = smooth(0.06, 0.3, p);
    const drift = smooth(0.3, 0.42, p);
    if (capRef.current) {
      capRef.current.rotation.y = unthread * Math.PI * 4.2;
      // Stays seated while unthreading, then lifts clear as it drifts.
      capRef.current.position.y = unthread * 0.1 + drift * 0.52;
      capRef.current.position.x = drift * 0.55;
      capRef.current.rotation.z = drift * 0.4;
    }
    liftRef.current = unthread;

    /* — droplet: form at neck lip → fall → vanish on impact — */
    const form = smooth(0.4, 0.5, p);
    const fall = smooth(0.5, 0.6, p);
    if (dropRef.current) {
      const NECK_Y = H * 0.86;
      const FLOOR_Y = 0.035;
      const y = THREE.MathUtils.lerp(NECK_Y, FLOOR_Y, fall);
      // Path bows outward so the drop lands beside the bottle.
      const x = THREE.MathUtils.lerp(NECK_R * 0.9, 0.62, fall * fall);
      const z = THREE.MathUtils.lerp(0.02, 0.66, fall * fall);
      dropRef.current.position.set(x, y, z);
      // Deforming metaball feel: stretch while falling, squash near impact.
      const stretch = 1 + fall * 0.45 - smooth(0.9, 1, fall) * 0.7;
      const s = 0.052 * form * (1 - smooth(0.97, 1, fall));
      dropRef.current.scale.set(s / Math.sqrt(stretch), s * stretch, s / Math.sqrt(stretch));
      dropRef.current.visible = form > 0.01 && fall < 0.995;
    }

    /* — film: spread from impact point — */
    const spread = smooth(0.58, 0.72, p);
    const sweep = smooth(0.7, 0.85, p);
    const filmScale = Math.max(0.001, spread * 1.0 + sweep * 1.5);
    if (filmRef.current) {
      filmRef.current.scale.setScalar(filmScale);
      (filmRef.current.material as THREE.MeshPhysicalMaterial).opacity = 0.28 * spread;
      filmRef.current.visible = spread > 0.01;
    }
    if (filmRimRef.current) {
      filmRimRef.current.scale.setScalar(filmScale);
      (filmRimRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.5 * spread * (1 - sweep * 0.6);
      filmRimRef.current.visible = spread > 0.01;
    }

    /* — nanolayer specks: self-arrange inside the film, never loose — */
    const mesh = specksRef.current;
    if (mesh) {
      const arrange = smooth(0.62, 0.8, p);
      mesh.visible = arrange > 0.005;
      if (mesh.visible) {
        for (let i = 0; i < specks.length; i++) {
          const sp = specks[i];
          // Each speck locks in at its own moment — a wave of assembly.
          const local = smooth(sp.seed * 0.55, sp.seed * 0.55 + 0.45, arrange);
          dummy.position.set(
            THREE.MathUtils.lerp(sp.sx, sp.tx, local),
            THREE.MathUtils.lerp(sp.sy, 0.012, local),
            THREE.MathUtils.lerp(sp.sz, sp.tz, local),
          );
          const shimmer = 1 + Math.sin(time * 2.2 + sp.seed * 12) * 0.25 * local;
          dummy.scale.setScalar(0.0075 * local * shimmer);
          dummy.rotation.set(sp.seed * 3, time * 0.15 + sp.seed, 0);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
      }
    }

    /* — the layer sweeps onward across the adjacent panel — */
    if (sweepRef.current) {
      // A sheen, not a sheet: low opacity, and the plane stays on the
      // panel it is coating instead of drifting over the floor edge.
      (sweepRef.current.material as THREE.MeshStandardMaterial).opacity = 0.15 * sweep;
      sweepRef.current.position.x = -0.4 - sweep * 0.8;
      sweepRef.current.visible = sweep > 0.01;
    }

    phaseRef.current =
      p <= 0.02 ? "closed"
      : p < 0.3 ? "unthreading"
      : p < 0.5 ? "drop-forming"
      : p < 0.6 ? "drop-falling"
      : p < 0.72 ? "film-spreading"
      : "layer-sweeping";
  });

  // Raw evidence for the demo QA (hero instance only).
  useMemo(() => {
    if (!animated || typeof window === "undefined") return;
    window.__CERAQO_OPENING__ = {
      progress: () => +openingProgress().toFixed(3),
      capLift: () => +liftRef.current.toFixed(3),
      phase: () => phaseRef.current,
    };
  }, [animated]);

  return (
    <group>
      {/* body — matte black anodized aluminium (true to the product) */}
      <mesh>
        <latheGeometry args={[bodyProfile, 96]} />
        <meshPhysicalMaterial
          color={BODY_BLACK}
          roughness={0.4}
          metalness={0.42}
          clearcoat={0.25}
          clearcoatRoughness={0.5}
        />
      </mesh>
      <LabelDecal />

      {/* embossed batch ring — reads at extreme close-up */}
      <mesh position={[0, H * 0.185, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[BODY_R * 1.003, 0.0035 * H, 8, 96]} />
        <meshStandardMaterial color="#191B18" roughness={0.55} metalness={0.4} />
      </mesh>

      {/* champagne collar */}
      <mesh position={[0, H * 0.855, 0]}>
        <cylinderGeometry args={[0.12 * H, 0.12 * H, 0.035 * H, 64]} />
        <meshPhysicalMaterial color={COLLAR_CHAMPAGNE} roughness={0.24} metalness={0.95} />
      </mesh>

      {/* neck: outer wall, helical thread, inner void, amber liquid level */}
      <group position={[0, H * 0.84, 0]}>
        <mesh position={[0, 0.03 * H, 0]}>
          <cylinderGeometry args={[NECK_R, NECK_R, 0.06 * H, 48, 1, true]} />
          <meshStandardMaterial color="#15171A" roughness={0.4} metalness={0.6} side={THREE.DoubleSide} />
        </mesh>
        <mesh geometry={threadGeo}>
          <meshStandardMaterial color="#1D1F22" roughness={0.35} metalness={0.7} />
        </mesh>
        {/* liquid surface with meniscus rim — amber, light passes through
            (true transmission at tier 3; glossy amber below) */}
        <mesh position={[0, 0.028 * H, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[NECK_R * 0.92, 40]} />
          {lux ? (
            <meshPhysicalMaterial
              color={LIQUID_AMBER}
              roughness={0.05}
              transmission={0.85}
              thickness={0.5}
              ior={1.42}
              side={THREE.DoubleSide}
            />
          ) : (
            <meshStandardMaterial
              color={LIQUID_AMBER}
              roughness={0.06}
              metalness={0.15}
              transparent
              opacity={0.94}
              side={THREE.DoubleSide}
            />
          )}
        </mesh>
        <mesh position={[0, 0.032 * H, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[NECK_R * 0.9, 0.0025 * H, 6, 40]} />
          <meshStandardMaterial color="#D9A863" roughness={0.15} metalness={0.3} />
        </mesh>
      </group>

      {/* cap — separable group so The Opening can unthread it */}
      <group ref={capRef} position={[0, 0, 0]}>
        <mesh geometry={capGeo} position={[0, H * 0.945, 0]}>
          <meshPhysicalMaterial
            color="#3A3B37"
            roughness={0.42}
            metalness={0.92}
            anisotropy={0.55}
            envMapIntensity={0.7}
          />
        </mesh>
        {/* worn matte top */}
        <mesh position={[0, H * 1.018, 0]}>
          <cylinderGeometry args={[CAP_R * 0.985, CAP_R * 0.985, 0.004 * H, 64]} />
          <meshStandardMaterial color="#3A3B37" roughness={0.7} metalness={0.5} />
        </mesh>
      </group>

      {/* soft contact shadow (near-black stays as a local accent) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <circleGeometry args={[BODY_R * 2.1, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.4} depthWrite={false} />
      </mesh>

      {animated && (
        <>
          {/* the amber droplet (procedural deforming sphere) */}
          <mesh ref={dropRef} visible={false}>
            <sphereGeometry args={[1, 24, 20]} />
            {lux ? (
              <meshPhysicalMaterial
                color={LIQUID_AMBER}
                roughness={0.04}
                transmission={0.9}
                thickness={0.4}
                ior={1.42}
              />
            ) : (
              <meshStandardMaterial
                color={LIQUID_AMBER}
                roughness={0.05}
                metalness={0.2}
                transparent
                opacity={0.96}
              />
            )}
          </mesh>

          {/* the spreading film + champagne rim */}
          <mesh ref={filmRef} visible={false} position={[0.62, 0.008, 0.66]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.52, 48]} />
            <meshPhysicalMaterial
              color="#E8DFC9"
              roughness={0.06}
              metalness={0.1}
              transparent
              opacity={0}
              clearcoat={1}
              clearcoatRoughness={0.08}
              depthWrite={false}
            />
          </mesh>
          <mesh ref={filmRimRef} visible={false} position={[0.62, 0.01, 0.66]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.5, 0.52, 48]} />
            <meshBasicMaterial color={COLLAR_CHAMPAGNE} transparent opacity={0} depthWrite={false} />
          </mesh>

          {/* the nanolayer — dense micro-specks anchored to the film */}
          <instancedMesh ref={specksRef} args={[undefined, undefined, specks.length]} visible={false} frustumCulled={false}>
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color={COLLAR_CHAMPAGNE}
              emissive={COLLAR_CHAMPAGNE}
              emissiveIntensity={0.5}
              roughness={0.3}
              metalness={0.7}
            />
          </instancedMesh>

          {/* the layer sweeping across the adjacent test panel */}
          <mesh ref={sweepRef} visible={false} position={[-0.4, 0.015, -1.9]} rotation={[-Math.PI / 2, 0, 0.18]}>
            <planeGeometry args={[2.6, 2.2]} />
            <meshStandardMaterial
              color="#D8CBAE"
              roughness={0.08}
              metalness={0.3}
              transparent
              opacity={0}
              depthWrite={false}
            />
          </mesh>
        </>
      )}
    </group>
  );
}
