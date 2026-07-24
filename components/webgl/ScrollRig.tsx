"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { getRanges, rangeOf, scrollProgress } from "@/lib/journey";

/**
 * Camera on a curve. Two CatmullRom splines — one for the eye, one for
 * the look target — pass through a keyframe per chapter station. The
 * page's normalized scroll progress is remapped so the camera sits
 * exactly on a station's keyframe when that section is centered in the
 * viewport, then eased with an exponential damp so travel feels heavy
 * and expensive rather than tied 1:1 to the wheel.
 *
 * Keyframe order must match the DOM section order registered in
 * lib/journey (top → science → application → result → shop).
 */

const EYES: [number, number, number][] = [
  [2.6, 1.5, 7.0], // CH0 hero — wide, bottle right of frame
  [0.95, 1.55, 1.75], // THE OPENING — extreme close on the cap/neck
  [-3.4, 0.75, -3.2], // CH1 science — low glide toward the lattice
  [3.6, 1.35, -10.6], // CH2 application — over the panel
  [-3.0, 0.9, -18.2], // CH3 result — among the droplets
  [0.0, 1.6, -25.5], // finale — rise to the pre-order bottle
];

const LOOKS: [number, number, number][] = [
  [0.0, 0.62, 0.0], // the hero bottle
  [0.05, 1.3, 0.0], // the cap (Opening look tilts down via lookAdjust)
  [-4.8, 0.35, -7.6], // lattice heart
  [4.9, 0.3, -14.4], // the gliding pad
  [-4.4, 0.25, -22.4], // droplet cluster
  [0.0, 0.75, -30.0], // finale bottle
];

export default function ScrollRig() {
  const { camera } = useThree();
  const eyeCurve = useMemo(
    () => new THREE.CatmullRomCurve3(EYES.map((p) => new THREE.Vector3(...p)), false, "centripetal"),
    [],
  );
  const lookCurve = useMemo(
    () => new THREE.CatmullRomCurve3(LOOKS.map((p) => new THREE.Vector3(...p)), false, "centripetal"),
    [],
  );

  const smoothT = useRef(0);
  const eye = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);
  const pointer = useRef({ x: 0, y: 0 });

  // Subtle parallax from the pointer (fine pointers only, tiny range).
  useMemo(() => {
    if (typeof window === "undefined") return;
    window.addEventListener("pointermove", (e) => {
      pointer.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    });
  }, []);

  /**
   * Remap page progress → curve parameter u so that each station's
   * registered center lands exactly on its keyframe index.
   */
  const remap = (t: number): number => {
    const ranges = getRanges();
    const n = EYES.length;
    if (ranges.length < 2) return t;
    const centers = ranges.map((r) => r.center);
    if (t <= centers[0]) return 0;
    if (t >= centers[centers.length - 1]) return 1;
    let i = 0;
    while (i < centers.length - 1 && t > centers[i + 1]) i++;
    const local = (t - centers[i]) / Math.max(1e-5, centers[i + 1] - centers[i]);
    // Ease each leg so the camera dwells at stations and sweeps between.
    const eased = local * local * (3 - 2 * local);
    return (i + eased) / (n - 1);
  };

  useFrame((state, delta) => {
    const target = scrollProgress();
    // Exponential damp — heavy, deliberate settle (~0.3 s time constant).
    const k = 1 - Math.exp(-3.4 * delta);
    smoothT.current += (target - smoothT.current) * k;

    const u = remap(smoothT.current);
    eyeCurve.getPoint(u, eye);
    lookCurve.getPoint(u, look);

    // Inside The Opening the gaze follows the droplet down from the cap
    // to the floor and back up — a per-station adjustment the static
    // keyframe pair can't express.
    const opening = rangeOf("opening");
    if (opening) {
      const po = THREE.MathUtils.clamp(
        (smoothT.current - opening.start) / Math.max(1e-5, opening.end - opening.start),
        0,
        1,
      );
      if (po > 0 && po < 1) {
        // Follow the droplet down through impact/film, then release as
        // the camera's natural departure (which passes over the test
        // panel) carries the sweep finale.
        const follow =
          THREE.MathUtils.smoothstep(po, 0.42, 0.55) *
          (1 - THREE.MathUtils.smoothstep(po, 0.74, 0.9));
        look.y -= follow * 1.15;
        look.x += follow * 0.5;
        look.z += follow * 0.55;
        eye.y -= follow * 0.3;
      }
    }

    // The camera is never dead-still: a slow handheld-crane drift keeps
    // the frame alive at station dwells (and reads as parallax against
    // the world), amplitudes small enough to never fight the path.
    const time = state.clock.elapsedTime;
    const driftX = Math.sin(time * 0.42) * 0.05;
    const driftY = Math.cos(time * 0.31) * 0.032;
    const driftZ = Math.sin(time * 0.21) * 0.055;

    camera.position.set(
      eye.x + driftX + pointer.current.x * 0.14,
      eye.y + driftY + pointer.current.y * -0.08,
      eye.z + driftZ,
    );
    camera.lookAt(look);
  });

  return null;
}
