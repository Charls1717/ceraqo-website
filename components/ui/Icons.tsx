/**
 * Hand-drawn 24×24 hairline icon set (stroke 1.5, currentColor) — one
 * visual voice for pillars, personas and socials. Paths are plain
 * strokes so IconReveal can draw them on with dash tweens.
 */
interface IconProps {
  name: string;
  className?: string;
}

const PATHS: Record<string, React.ReactNode> = {
  /* — technology pillars — */
  hydro: (
    <>
      <path d="M12 3.5c3.2 3.9 5.5 7 5.5 10a5.5 5.5 0 1 1-11 0c0-3 2.3-6.1 5.5-10Z" />
      <path d="M9.5 14.2a2.6 2.6 0 0 0 2.4 2.5" />
    </>
  ),
  oleo: (
    <>
      <path d="M8 4.5h8l2.5 5.5-6.5 9.5-6.5-9.5L8 4.5Z" />
      <path d="M5.5 10h13" />
    </>
  ),
  uv: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6" />
    </>
  ),
  chem: (
    <>
      <path d="M10 3.5h4M11 3.5v5L6.2 17a2.6 2.6 0 0 0 2.3 3.8h7a2.6 2.6 0 0 0 2.3-3.8L13 8.5v-5" />
      <path d="M8.2 14.5h7.6" />
    </>
  ),
  corr: (
    <>
      <path d="M12 3.5 19 6v6c0 4.6-3 7.5-7 9-4-1.5-7-4.4-7-9V6l7-2.5Z" />
      <path d="m9 12 2.2 2.2L15.5 9.7" />
    </>
  ),
  abr: (
    <>
      <path d="M4 8.5 12 5l8 3.5M4 12.25 12 8.75l8 3.5M4 16 12 12.5l8 3.5" />
    </>
  ),
  /* — owner personas — */
  daily: (
    <>
      <path d="M4.5 13.5 6 9a2 2 0 0 1 1.9-1.4h8.2A2 2 0 0 1 18 9l1.5 4.5" />
      <path d="M4 13.5h16v4h-2.2M4 17.5h2.2M8.5 17.5h7" />
      <circle cx="7.3" cy="17.4" r="1.4" />
      <circle cx="16.7" cy="17.4" r="1.4" />
    </>
  ),
  enthusiast: (
    <>
      <path d="M3.5 14.5c1-2.2 3-3.5 5.5-3.8l2.5-2.4c.8-.7 1.8-1 2.9-.8l5.1.9c.7 2 .7 3.9 0 5.6" />
      <path d="M3.5 14.5h16M6.8 14.5v2.4M13.6 14.5v2.4" />
      <circle cx="8.4" cy="16.9" r="1.5" />
      <circle cx="15.2" cy="16.9" r="1.5" />
    </>
  ),
  ev: (
    <>
      <path d="M9 3.5 5.5 12h4L8 20.5 16.5 9.8h-4.4L15 3.5H9Z" />
    </>
  ),
  classic: (
    <>
      <path d="M3.5 14c2-.6 3.4-3.5 5-5 1-1 2.3-1.5 3.8-1.5h2.4c2.2 0 4.1 1.4 4.9 3.4l.9 2.1" />
      <path d="M2.5 14h19v3.2h-2.7M2.5 17.2h3M9 17.2h6.6" />
      <circle cx="7" cy="17" r="1.6" />
      <circle cx="17.5" cy="17" r="1.6" />
    </>
  ),
  fleet: (
    <>
      <rect x="3.5" y="5" width="7.5" height="6" rx="1" />
      <rect x="13" y="5" width="7.5" height="6" rx="1" />
      <rect x="3.5" y="13.5" width="7.5" height="6" rx="1" />
      <rect x="13" y="13.5" width="7.5" height="6" rx="1" />
    </>
  ),
  /* — socials — */
  instagram: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4.5" />
      <circle cx="12" cy="12" r="3.6" />
      <path d="M16.8 7.2h.01" />
    </>
  ),
  tiktok: (
    <>
      <path d="M14.5 4v9.8a3.9 3.9 0 1 1-3.4-3.9" />
      <path d="M14.5 5.5c.6 1.9 2 3.1 4 3.4" />
    </>
  ),
  youtube: (
    <>
      <rect x="3" y="6.5" width="18" height="11" rx="3" />
      <path d="m10.5 10 4 2-4 2v-4Z" />
    </>
  ),
};

export default function Icon({ name, className = "" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {PATHS[name]}
    </svg>
  );
}
