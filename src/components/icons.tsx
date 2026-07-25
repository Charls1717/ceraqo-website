/**
 * Thin-line lab iconography — 24x24, 1.3px strokes, currentColor.
 * Geometry stays minimal (circles, arcs, straight runs) so the set
 * reads as instrument markings, matching the HUD chrome.
 */
import type { ReactNode } from 'react';

const I = ({ children, label }: { children: ReactNode; label?: string }) => (
  <svg
    viewBox="0 0 24 24"
    width="26"
    height="26"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.3"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden={label ? undefined : true}
    role={label ? 'img' : undefined}
  >
    {label ? <title>{label}</title> : null}
    {children}
  </svg>
);

/* — threats — */
export const IconSalt = () => (
  <I>
    <path d="M7 20h10M8.5 20l2-9h3l2 9" />
    <circle cx="9" cy="6" r="0.8" />
    <circle cx="13.5" cy="4.5" r="0.8" />
    <circle cx="16" cy="8" r="0.8" />
  </I>
);
export const IconUV = () => (
  <I>
    <circle cx="12" cy="12" r="3.6" />
    <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6L18 18M18 6l-1.4 1.4M7.4 16.6L6 18" />
  </I>
);
export const IconRain = () => (
  <I>
    <path d="M12 4.5s-4.5 5-4.5 8a4.5 4.5 0 0 0 9 0c0-3-4.5-8-4.5-8z" />
    <path d="M9.8 13.2a2.2 2.2 0 0 0 2.2 2.2" />
  </I>
);
export const IconFilm = () => (
  <I>
    <path d="M4 9c3-1.5 5 1.5 8 0s5-1.5 8 0" />
    <path d="M4 13c3-1.5 5 1.5 8 0s5-1.5 8 0" />
    <path d="M4 17c3-1.5 5 1.5 8 0s5-1.5 8 0" />
  </I>
);
export const IconFallout = () => (
  <I>
    <path d="M5 19V9l4 2.5V9l4 2.5V9l4 2.5V19z" />
    <path d="M3.5 19h17" />
    <circle cx="17" cy="5" r="0.8" />
    <circle cx="13" cy="4" r="0.8" />
  </I>
);
export const IconChemical = () => (
  <I>
    <path d="M10 3.5h4M11 3.5v5L6.5 17a2.4 2.4 0 0 0 2.1 3.5h6.8a2.4 2.4 0 0 0 2.1-3.5L13 8.5v-5" />
    <path d="M8.5 14.5h7" />
  </I>
);
export const IconAbrasion = () => (
  <I>
    <path d="M4 16.5h16" />
    <path d="M4 20h16" />
    <path d="M6 12.5l3-6M11 12.5l3-6M16 12.5l3-6" />
  </I>
);

/* — specs — */
export const IconGloss = () => (
  <I>
    <path d="M12 4l1.6 5.4L19 11l-5.4 1.6L12 18l-1.6-5.4L5 11l5.4-1.6z" />
    <circle cx="18.5" cy="5.5" r="0.9" />
  </I>
);
export const IconHydro = () => (
  <I>
    <path d="M12 4.5s-4.5 5-4.5 8a4.5 4.5 0 0 0 9 0c0-3-4.5-8-4.5-8z" />
    <path d="M4.5 20h15" />
  </I>
);
export const IconOleo = () => (
  <I>
    <ellipse cx="12" cy="13.5" rx="4.5" ry="5" />
    <path d="M5 5l14 14" />
  </I>
);
export const IconShieldChem = () => (
  <I>
    <path d="M12 3.5l6.5 2.5v5c0 4.2-2.7 7.3-6.5 9.5-3.8-2.2-6.5-5.3-6.5-9.5v-5z" />
    <path d="M9.5 12h5M12 9.5v5" />
  </I>
);
export const IconCorrosion = () => (
  <I>
    <path d="M12 3.5l6.5 2.5v5c0 4.2-2.7 7.3-6.5 9.5-3.8-2.2-6.5-5.3-6.5-9.5v-5z" />
    <path d="M9 12.2l2 2 4-4" />
  </I>
);
export const IconLayers = () => (
  <I>
    <path d="M12 4.5l8 4-8 4-8-4z" />
    <path d="M4 12.5l8 4 8-4" />
    <path d="M4 16.5l8 4 8-4" />
  </I>
);
export const IconClean = () => (
  <I>
    <path d="M5 14c2-4 6-4 8-2s6 2 6-2" />
    <path d="M8 18.5l1-1M12 19.5l1.4-1.4M16.5 18l1-1" />
  </I>
);
export const IconCrystal = () => (
  <I>
    <path d="M8 4h8l4 5-8 11L4 9z" />
    <path d="M4 9h16M8 4l4 5 4-5M12 9v11" />
  </I>
);
export const IconPro = () => (
  <I>
    <circle cx="12" cy="9" r="4.5" />
    <path d="M9.5 12.8L8 20.5l4-2 4 2-1.5-7.7" />
  </I>
);
export const IconDIY = () => (
  <I>
    <path d="M4 20c0-4 3.5-5.5 6-5.5" />
    <path d="M13.5 4.5a4 4 0 1 0 2 7.6L20 16.5l-2 2-4.4-4.4" />
  </I>
);
export const IconUVShield = () => (
  <I>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M12 5v1.6M12 17.4V19M5 12h1.6M17.4 12H19M7 7l1.1 1.1M15.9 15.9L17 17M17 7l-1.1 1.1M8.1 15.9L7 17" />
  </I>
);
