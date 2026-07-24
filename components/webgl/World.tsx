"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import Bottle from "@/components/webgl/Bottle";
import StationText from "@/components/webgl/StationText";
import { stationFocus, scrollProgress } from "@/lib/journey";
import { HERO, SCIENCE, APPLICATION, RESULT } from "@/lib/copy";
import type { Tier } from "@/components/webgl/Experience";

const CHAMPAGNE = new THREE.Color("#C9A67A");
const CHAMPAGNE_BRIGHT = new THREE.Color("#E6C99C");
const INK = new THREE.Color("#0A0B0C");

/**
 * The continuous world. Stations sit along −Z in DOM section order;
 * the ScrollRig carries the camera between them. Every effect keys its
 * intensity off stationFocus(id) so the world "performs" exactly when
 * its chapter is on screen.
 *
 * `tier` is the adaptive quality level from PerformanceMonitor:
 *   3 = full particle counts + transmission materials
 *   2 = reduced counts, standard materials
 *   1 = minimum counts, cheapest materials
 */
export default function World({ tier }: { tier: Tier }) {
  return (
    <>
      <Lights tier={tier} />
      <Floor tier={tier} />
      <Dust tier={tier} />

      {/* CH0 — hero bottle */}
      <group position={[0, 0, 0]}>
        <Bottle />
      </group>
      <StationText
        station="top"
        lines={HERO.headline}
        position={[-3.7, 2.3, 1.1]}
        rotation={[0, 0.24, 0]}
        size={0.6}
        anchorX="left"
      />

      {/* CH1 — science: the bond/lattice assembles */}
      <LatticeField tier={tier} />
      <GlassLayer tier={tier} />
      <StationText
        station="science"
        lines={SCIENCE.shield.headline}
        position={[-6.4, 1.7, -7.8]}
        rotation={[0, 0.35, 0]}
        size={0.46}
        anchorX="left"
      />

      {/* CH2 — application: the pad lays the film */}
      <ApplicationStation tier={tier} />
      <StationText
        station="application"
        lines={APPLICATION.process.headline}
        position={[6.6, 1.85, -14.6]}
        rotation={[0, -0.35, 0]}
        size={0.44}
        anchorX="right"
      />

      {/* CH3 — result: droplets bead on the finished panel */}
      <DropletField tier={tier} />
      <StationText
        station="result"
        lines={RESULT.gloss.headline}
        position={[-6.2, 1.75, -21.8]}
        rotation={[0, 0.32, 0]}
        size={0.44}
        anchorX="left"
      />

      {/* finale — the bottle again, waiting at the pre-order threshold */}
      <group position={[0, 0, -30]} rotation={[0, Math.PI * 0.12, 0]}>
        <Bottle />
      </group>
    </>
  );
}

/* ------------------------------------------------------------------ */

function Lights({ tier }: { tier: Tier }) {
  const key = useRef<THREE.SpotLight>(null);
  useFrame(({ clock }) => {
    // The champagne key light breathes almost imperceptibly.
    if (key.current) key.current.intensity = 170 + Math.sin(clock.elapsedTime * 0.4) * 14;
  });
  return (
    <>
      <ambientLight intensity={tier === 1 ? 0.42 : 0.22} color="#8A939F" />
      {/* warm champagne key — the brand's light */}
      <spotLight
        ref={key}
        position={[6, 7, 4]}
        angle={0.55}
        penumbra={0.9}
        intensity={170}
        color="#E6C99C"
        distance={60}
      />
      {/* cool-neutral fill, never blue-saturated */}
      <directionalLight position={[-6, 4, -2]} intensity={0.5} color="#B9BEC6" />
      {/* the hero bottle's own accent — distance-limited, all tiers,
          so the product reads even at the software floor */}
      <pointLight position={[1.5, 1.4, 2.0]} intensity={16} color="#E6C99C" distance={9} />
      {/* low champagne bounce — dropped at the floor tier (every light
          multiplies per-pixel shading cost on software rasterizers) */}
      {tier > 1 && (
        <pointLight position={[0, 0.4, -14]} intensity={22} color="#C9A67A" distance={26} />
      )}
    </>
  );
}

/** One long dark-lacquer floor under the whole journey. */
function Floor({ tier }: { tier: Tier }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, -12]}>
      <planeGeometry args={[70, 90]} />
      {/* The floor covers more pixels than anything else — at the floor
          tier it trades PBR for Lambert, the single biggest software
          fill-rate saving in the scene. */}
      {tier === 1 ? (
        <meshLambertMaterial color="#14161A" />
      ) : (
        <meshStandardMaterial color="#101215" roughness={0.16} metalness={0.72} />
      )}
    </mesh>
  );
}

/** Ambient dust motes — THREE.Points, additive, barely there. */
function Dust({ tier }: { tier: Tier }) {
  const count = tier === 3 ? 700 : tier === 2 ? 380 : 160;
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      a[i * 3] = (Math.random() - 0.5) * 26;
      a[i * 3 + 1] = Math.random() * 5;
      a[i * 3 + 2] = -Math.random() * 34 + 3;
    }
    return a;
  }, [count]);

  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.008;
  });

  return (
    <points ref={ref} key={count}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color={CHAMPAGNE_BRIGHT}
        transparent
        opacity={0.32}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/*  CH1 — instanced bond/lattice                                       */
/* ------------------------------------------------------------------ */

/**
 * The signature particle effect: octahedral "bond" instances scattered
 * through the volume assemble into a crystalline lattice as the
 * science chapter takes focus. CPU instance-matrix update, dirty only
 * while the assembly value is actually moving — thousands of matrix
 * writes happen solely during the chapter transition.
 */
function LatticeField({ tier }: { tier: Tier }) {
  const count = tier === 3 ? 1100 : tier === 2 ? 520 : 240;
  const ref = useRef<THREE.InstancedMesh>(null);
  const lastAssembly = useRef(-1);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const data = useMemo(() => {
    const grid: THREE.Vector3[] = [];
    const side = Math.ceil(Math.cbrt(count));
    const spacing = 0.5;
    let i = 0;
    for (let x = 0; x < side && i < count; x++)
      for (let y = 0; y < side && i < count; y++)
        for (let z = 0; z < side && i < count; z++, i++) {
          grid.push(
            new THREE.Vector3(
              -4.8 + (x - side / 2) * spacing + (Math.random() - 0.5) * 0.06,
              0.4 + y * spacing * 0.62,
              -7.6 + (z - side / 2) * spacing + (Math.random() - 0.5) * 0.06,
            ),
          );
        }
    const scatter = grid.map(
      (p) =>
        new THREE.Vector3(
          p.x + (Math.random() - 0.5) * 9,
          p.y + Math.random() * 5 + 0.5,
          p.z + (Math.random() - 0.5) * 9,
        ),
    );
    const threshold = grid.map(() => Math.random());
    return { grid, scatter, threshold };
  }, [count]);

  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const t = scrollProgress();
    // Assembly follows science focus, held complete once passed.
    const focus = stationFocus("science", t);
    const passed = t > 0.99 ? 1 : 0;
    const assembly = Math.max(focus, passed);
    if (Math.abs(assembly - lastAssembly.current) < 0.002) return;
    lastAssembly.current = assembly;

    for (let i = 0; i < count; i++) {
      // Each instance locks in at its own threshold — staggered growth.
      const local = THREE.MathUtils.clamp((assembly - data.threshold[i] * 0.7) / 0.3, 0, 1);
      const e = local * local * (3 - 2 * local);
      dummy.position.lerpVectors(data.scatter[i], data.grid[i], e);
      const s = 0.028 + e * 0.05;
      dummy.scale.setScalar(s);
      dummy.rotation.set(e * Math.PI * 0.5, data.threshold[i] * Math.PI, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} key={count} frustumCulled={false}>
      <octahedronGeometry args={[1, 0]} />
      {tier === 1 ? (
        <meshLambertMaterial color={CHAMPAGNE} emissive={CHAMPAGNE} emissiveIntensity={0.3} />
      ) : (
        <meshStandardMaterial
          color={CHAMPAGNE}
          emissive={CHAMPAGNE}
          emissiveIntensity={0.28}
          roughness={0.25}
          metalness={0.7}
          flatShading
        />
      )}
    </instancedMesh>
  );
}

/** The ultra-thin transparent layer above the paint at the science station. */
function GlassLayer({ tier }: { tier: Tier }) {
  const mat = useRef<THREE.MeshPhysicalMaterial>(null);
  useFrame(() => {
    if (mat.current) {
      const f = stationFocus("science", scrollProgress());
      mat.current.opacity = 0.08 + f * 0.5;
    }
  });
  return (
    <mesh position={[-4.8, 0.32, -7.6]} rotation={[-Math.PI / 2, 0, 0.2]}>
      <planeGeometry args={[7, 5]} />
      <meshPhysicalMaterial
        ref={mat}
        color="#F2EFE9"
        roughness={0.04}
        metalness={0}
        transparent
        opacity={0.1}
        transmission={tier === 3 ? 0.85 : 0}
        thickness={0.35}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/*  CH2 — the applicator pad laying the film                           */
/* ------------------------------------------------------------------ */

function ApplicationStation({ tier }: { tier: Tier }) {
  const cheap = tier === 1;
  const pad = useRef<THREE.Group>(null);
  const film = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(({ clock }) => {
    const f = stationFocus("application", scrollProgress());
    if (pad.current) {
      // The pad glides left→right and back, only while on stage.
      const s = Math.sin(clock.elapsedTime * 0.45);
      pad.current.position.x = 4.9 + s * 1.6 * Math.min(1, f * 2);
      pad.current.position.y = 0.42 + Math.abs(Math.cos(clock.elapsedTime * 0.45)) * 0.008;
    }
    if (film.current) film.current.opacity = 0.12 + f * 0.4;
  });

  return (
    <group position={[0, 0, -14.4]}>
      {/* satin body panel */}
      <mesh position={[4.9, 0.28, 0]} rotation={[-Math.PI / 2, 0, -0.08]}>
        <planeGeometry args={[8, 5.4]} />
        {cheap ? (
          <meshLambertMaterial color="#181B20" />
        ) : (
          <meshStandardMaterial color="#15171B" roughness={0.34} metalness={0.55} />
        )}
      </mesh>
      {/* the leveling film — a champagne-kissed sheen that trails the pad */}
      <mesh position={[4.9, 0.305, 0]} rotation={[-Math.PI / 2, 0, -0.08]}>
        <planeGeometry args={[7.4, 4.8]} />
        <meshStandardMaterial
          ref={film}
          color="#C9A67A"
          roughness={0.06}
          metalness={0.85}
          transparent
          opacity={0.14}
          depthWrite={false}
        />
      </mesh>
      {/* the applicator puck */}
      <group ref={pad} position={[4.9, 0.42, 0]}>
        <mesh>
          <cylinderGeometry args={[0.55, 0.55, 0.22, 48]} />
          <meshStandardMaterial color="#1B1E23" roughness={0.9} metalness={0.05} />
        </mesh>
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.42, 0.55, 0.06, 48]} />
          <meshStandardMaterial color="#23272E" roughness={0.85} />
        </mesh>
      </group>
      {/* folded cloth in the wings */}
      <mesh position={[7.6, 0.5, -1.6]} rotation={[0, -0.5, 0]}>
        <boxGeometry args={[1.6, 0.34, 1.1]} />
        <meshStandardMaterial color="#181B20" roughness={0.95} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  CH3 — droplet field                                                */
/* ------------------------------------------------------------------ */

function DropletField({ tier }: { tier: Tier }) {
  const count = tier === 3 ? 340 : tier === 2 ? 180 : 90;
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const drops = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: -4.4 + (Math.random() - 0.5) * 7.5,
        z: -22.4 + (Math.random() - 0.5) * 6.5,
        r: 0.03 + Math.random() * 0.085,
        phase: Math.random() * Math.PI * 2,
      })),
    [count],
  );

  useFrame(({ clock }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const time = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const d = drops[i];
      // Droplets tremble microscopically; a few drift as if rolling.
      const wobble = 1 + Math.sin(time * 1.8 + d.phase) * 0.035;
      dummy.position.set(d.x + Math.sin(time * 0.05 + d.phase) * 0.06, d.r * 0.72, d.z);
      dummy.scale.set(d.r * wobble, d.r * 0.78, d.r * wobble);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* the finished, protected panel */}
      <mesh position={[-4.4, 0.0, -22.4]} rotation={[-Math.PI / 2, 0, 0.15]}>
        <planeGeometry args={[10, 7]} />
        <meshStandardMaterial color="#0C0D10" roughness={0.06} metalness={0.85} />
      </mesh>
      <instancedMesh ref={ref} args={[undefined, undefined, count]} key={count} frustumCulled={false}>
        <sphereGeometry args={[1, 20, 16]} />
        {tier === 3 ? (
          <meshPhysicalMaterial
            color={INK}
            roughness={0.02}
            metalness={0}
            transmission={0.9}
            thickness={0.6}
            clearcoat={1}
            clearcoatRoughness={0.04}
          />
        ) : tier === 2 ? (
          <meshStandardMaterial color="#15171B" roughness={0.05} metalness={0.9} />
        ) : (
          <meshLambertMaterial color="#1B1E23" />
        )}
      </instancedMesh>
    </group>
  );
}
