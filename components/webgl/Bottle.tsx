"use client";

import { useGLTF, useTexture } from "@react-three/drei";
import { Component, Suspense, useMemo, type ReactNode } from "react";
import * as THREE from "three";
import { asset } from "@/lib/media";

/**
 * The Q-ARMOR bottle, per the canonical brief's bottle rule:
 *
 *   1. Start from the 3D scan GLB (bridge → public/models/bottle-scan.glb).
 *   2. Label-crispness gate: photogrammetry/diffusion scans cannot hold
 *      1 mm gold lettering, so the label is ALWAYS overlaid as a sharp
 *      decal — a slightly offset cylinder segment textured with the
 *      band cropped from the real product photo (build-label-decal.mjs).
 *   3. If the scan is missing or fails to parse, a procedural body
 *      (lathe profile measured from the photo) stands in — same decal,
 *      same materials, no blocked build.
 *
 * The bottle never moves; the camera does. Materials are tuned to the
 * photo: matte black aluminium, gunmetal cap, champagne collar.
 */

const BODY_BLACK = "#101114";
const CAP_GUNMETAL = "#3A3A3C";
const COLLAR_CHAMPAGNE = "#C9A67A";

/**
 * Flip to true once public/models/bottle-scan.glb is committed and has
 * passed visual inspection (see docs/BRIEF.md → bottle rule). While
 * false the procedural body renders and no scan fetch is attempted, so
 * a missing model can never cost a 404 or a console error.
 */
const SCAN_AVAILABLE = true;

/** Height of the bottle in world units; everything scales from this. */
const H = 1.5;
const BODY_R = 0.235 * H;

function LabelDecal() {
  const map = useTexture(asset("/textures/label-decal.png"));
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  return (
    <mesh position={[0, H * 0.42, 0]} rotation={[0, Math.PI * 1.84, 0]}>
      {/* open cylinder segment hugging the body; polygonOffset keeps it
          winning the depth fight against the scan/lathe surface */}
      <cylinderGeometry
        args={[BODY_R * 1.012, BODY_R * 1.012, H * 0.42, 48, 1, true, 0, 1.25]}
      />
      <meshStandardMaterial
        map={map}
        transparent
        roughness={0.5}
        metalness={0.35}
        polygonOffset
        polygonOffsetFactor={-2}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

/** Procedural stand-in measured from the product photo. */
function ProceduralBody() {
  const profile = useMemo(() => {
    // (r, y) pairs bottom → top, normalized to H.
    const pts: [number, number][] = [
      [0.0, 0.0],
      [0.21, 0.0],
      [0.235, 0.02],
      [0.235, 0.62],
      [0.225, 0.7],
      [0.19, 0.76],
      [0.135, 0.8],
      [0.115, 0.82],
      [0.115, 0.84],
    ];
    return pts.map(([r, y]) => new THREE.Vector2(r * H, y * H));
  }, []);

  return (
    <group>
      <mesh>
        <latheGeometry args={[profile, 64]} />
        <meshStandardMaterial color={BODY_BLACK} roughness={0.42} metalness={0.28} />
      </mesh>
      {/* champagne collar */}
      <mesh position={[0, H * 0.855, 0]}>
        <cylinderGeometry args={[0.12 * H, 0.12 * H, 0.035 * H, 48]} />
        <meshStandardMaterial color={COLLAR_CHAMPAGNE} roughness={0.28} metalness={0.9} />
      </mesh>
      {/* knurled cap (knurl suggested by high-frequency roughness, not geo) */}
      <mesh position={[0, H * 0.94, 0]}>
        <cylinderGeometry args={[0.128 * H, 0.124 * H, 0.14 * H, 64]} />
        <meshStandardMaterial color={CAP_GUNMETAL} roughness={0.35} metalness={0.92} />
      </mesh>
    </group>
  );
}

function ScannedBody() {
  const { scene } = useGLTF(asset("/models/bottle-scan.glb"));
  const normalized = useMemo(() => {
    const clone = scene.clone(true);
    // Normalize: feet on y=0, height H, centered on the y axis.
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const scale = H / Math.max(1e-5, size.y);
    clone.scale.setScalar(scale);
    box.setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    clone.position.set(-center.x, -box.min.y, -center.z);
    // The scan's baked texture failed the label-crispness gate (garbled
    // UV islands) — re-skin the whole mesh in the measured matte black;
    // the decal carries the label, the ring below restores the collar.
    clone.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        (o as THREE.Mesh).material = new THREE.MeshStandardMaterial({
          color: BODY_BLACK,
          roughness: 0.42,
          metalness: 0.28,
        });
      }
    });
    return clone;
  }, [scene]);
  return (
    <group>
      <primitive object={normalized} />
      {/* champagne collar accent — the single-material re-skin loses the
          bottle's gold ring, so it returns as a slim overlay hugging the
          scan at the measured collar height */}
      <mesh position={[0, H * 0.855, 0]}>
        <torusGeometry args={[0.117 * H, 0.016 * H, 12, 48]} />
        <meshStandardMaterial color={COLLAR_CHAMPAGNE} roughness={0.28} metalness={0.9} />
      </mesh>
    </group>
  );
}

class BodyBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export default function Bottle() {
  return (
    <group>
      {SCAN_AVAILABLE ? (
        <BodyBoundary fallback={<ProceduralBody />}>
          <Suspense fallback={<ProceduralBody />}>
            <ScannedBody />
          </Suspense>
        </BodyBoundary>
      ) : (
        <ProceduralBody />
      )}
      <LabelDecal />
      {/* soft contact shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <circleGeometry args={[BODY_R * 2.1, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.55} depthWrite={false} />
      </mesh>
    </group>
  );
}
