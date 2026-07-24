"use client";

import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import { stationFocus, scrollProgress } from "@/lib/journey";
import { asset } from "@/lib/media";

interface Props {
  station: string;
  lines: readonly string[];
  position: [number, number, number];
  rotation?: [number, number, number];
  size?: number;
  anchorX?: "left" | "right" | "center";
}

const FONT = asset("/fonts/archivo-latin-800-normal.woff");

/**
 * WebGL-rendered display headlines (drei Text → troika SDF). The
 * signature outline-to-fill survives the move into the scene: troika's
 * stroke renders first (thin champagne wireframe letters) and the fill
 * solidifies as the station takes focus — driven per-frame, no React
 * state in the loop.
 */
export default function StationText({
  station,
  lines,
  position,
  rotation = [0, 0, 0],
  size = 0.5,
  anchorX = "left",
}: Props) {
  const refs = useRef<Array<{ fillOpacity: number; strokeOpacity: number; sync?: () => void } | null>>([]);

  useFrame(() => {
    const f = stationFocus(station, scrollProgress());
    // Stroke leads (visible from half focus), fill lands late and full.
    const stroke = Math.min(1, f * 2.2) * 0.85;
    const fill = Math.max(0, (f - 0.35) / 0.65);
    for (const t of refs.current) {
      if (!t) continue;
      t.strokeOpacity = stroke * (1 - fill * 0.85);
      t.fillOpacity = fill;
    }
  });

  return (
    <group position={position} rotation={rotation as unknown as THREE.Euler}>
      {lines.map((line, i) => (
        <Text
          key={line}
          ref={(el) => {
            refs.current[i] = el as unknown as (typeof refs.current)[number];
          }}
          font={FONT}
          fontSize={size}
          letterSpacing={0.01}
          anchorX={anchorX}
          anchorY="top"
          position={[0, -i * size * 1.06, 0]}
          color="#F2EFE9"
          fillOpacity={0}
          strokeWidth={"1.2%"}
          strokeColor="#C9A67A"
          strokeOpacity={0}
        >
          {line}
        </Text>
      ))}
    </group>
  );
}
