import raw from "./frame-manifest.json";

export type ZoneKey = "SURFACE" | "DROP" | "SPREAD" | "BOND" | "LATTICE";

export interface FrameSet {
  basePath: string;
  count: number;
  ext: string;
  width: number;
}

interface RawManifest {
  fps: number;
  desktop: FrameSet;
  mobile: FrameSet;
  zones: { key: ZoneKey; p0: number; p1: number }[];
}

export const MANIFEST = raw as RawManifest;

/** Editorial content per dive zone. Facts are verbatim from the Q-ARMOR datasheet. */
export interface ZoneContent {
  key: ZoneKey;
  index: number;
  title: string;
  /** magnification range across the zone (log-interpolated) */
  mag: [number, number];
  fact: string;
  still: string;
}

export const DIVE_ZONES: ZoneContent[] = [
  {
    key: "SURFACE",
    index: 0,
    title: "The Surface",
    mag: [1, 8],
    fact: "35–50 ml protects an entire car. One bottle. One car.",
    still: "/frames/stills/z1.webp",
  },
  {
    key: "DROP",
    index: 1,
    title: "The Drop",
    mag: [8, 120],
    fact: "A clear, colourless liquid based on silanes.",
    still: "/frames/stills/z2.webp",
  },
  {
    key: "SPREAD",
    index: 2,
    title: "The Spread",
    mag: [120, 5000],
    fact: "Wipe on. Buff to an ultra-shine. Cures at ambient temperature.",
    still: "/frames/stills/z3.webp",
  },
  {
    key: "BOND",
    index: 3,
    title: "The Bond",
    mag: [5000, 420000],
    fact: "A covalent bond with the paint. It cannot flake off or be washed off.",
    still: "/frames/stills/z4.webp",
  },
  {
    key: "LATTICE",
    index: 4,
    title: "The Lattice",
    mag: [420000, 1000000],
    fact: "Hardness up to 9H. Effective for up to 72 months.",
    still: "/frames/stills/z5.webp",
  },
];

/** Scroll fraction boundaries for a zone, from the generated manifest. */
export function zoneBounds(key: ZoneKey): [number, number] {
  const z = MANIFEST.zones.find((z) => z.key === key);
  return z ? [z.p0, z.p1] : [0, 1];
}

/** Which zone a dive progress value belongs to. */
export function zoneAt(p: number): ZoneContent {
  for (const z of DIVE_ZONES) {
    const [, p1] = zoneBounds(z.key);
    if (p <= p1) return z;
  }
  return DIVE_ZONES[DIVE_ZONES.length - 1];
}

/** Log-interpolated magnification for a dive progress value: 1× → 1,000,000×. */
export function magnificationAt(p: number): number {
  const z = zoneAt(p);
  const [p0, p1] = zoneBounds(z.key);
  const t = p1 > p0 ? Math.min(1, Math.max(0, (p - p0) / (p1 - p0))) : 1;
  const [m0, m1] = z.mag;
  return Math.exp(Math.log(m0) + (Math.log(m1) - Math.log(m0)) * t);
}

/** HUD formatting: 3.6× below ten, grouped integers above. */
export function formatMag(m: number): string {
  if (m < 10) {
    const v = Math.round(m * 10) / 10;
    return `${v.toFixed(v % 1 === 0 ? 0 : 1)}×`;
  }
  return `${Math.round(m).toLocaleString("en-US")}×`;
}
