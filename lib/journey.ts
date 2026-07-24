"use client";

/**
 * The journey registry: maps DOM sections to normalized scroll ranges
 * so the WebGL world and the scrolling copy stay in perfect register.
 *
 * A measurer (in WebglPage) writes section offsets after layout; the
 * ScrollRig and station text read them every frame. Plain module state
 * — no store dependency, no React re-renders in the scroll path.
 */

export interface StationRange {
  id: string;
  /** normalized page-scroll start/end (0..1) */
  start: number;
  end: number;
  /** normalized midpoint — where the camera keyframe is centered */
  center: number;
}

const state = {
  ranges: [] as StationRange[],
  /** total scrollable height in px (doc height − viewport) */
  max: 1,
};

export function setRanges(ranges: StationRange[], max: number) {
  state.ranges = ranges;
  state.max = Math.max(1, max);
}

export function getRanges(): StationRange[] {
  return state.ranges;
}

export function rangeOf(id: string): StationRange | undefined {
  return state.ranges.find((r) => r.id === id);
}

/** Current normalized scroll progress 0..1 (reads live scroll). */
export function scrollProgress(): number {
  if (typeof window === "undefined") return 0;
  return Math.min(1, Math.max(0, window.scrollY / state.max));
}

/**
 * 0..1 proximity of progress `t` to a station's center — 1 at center,
 * 0 outside the station's half-width. Drives text reveals and
 * per-station effect intensity.
 */
export function stationFocus(id: string, t: number): number {
  const r = rangeOf(id);
  if (!r) return 0;
  const half = Math.max(0.001, (r.end - r.start) / 2);
  return Math.max(0, 1 - Math.abs(t - r.center) / half);
}
