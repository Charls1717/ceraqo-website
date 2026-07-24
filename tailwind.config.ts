import type { Config } from "tailwindcss";

/**
 * CERAQO brand tokens.
 *
 * Palette discipline (owner directive): near-black graphite and gunmetal
 * carry the site; champagne/rose-gold — matching the bottle lettering — is
 * the only expressive accent. No saturated cyan/teal anywhere.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0A0B0C", // page ground
        graphite: "#101215",
        gunmetal: "#181B20",
        smoke: "#23272E",
        seam: "#2E333B", // hairline borders
        steel: "#8A939F", // desaturated secondary text
        bone: "#F2EFE9", // warm off-white headline fill
        champagne: {
          DEFAULT: "#C9A67A",
          bright: "#E6C99C",
          deep: "#9C7B52",
        },
      },
      fontFamily: {
        display: ["'Archivo Variable'", "system-ui", "sans-serif"],
        body: ["'Inter Variable'", "system-ui", "sans-serif"],
        tech: ["'Space Grotesk Variable'", "monospace", "sans-serif"],
      },
      letterSpacing: {
        micro: "0.22em",
        wide2: "0.08em",
      },
      transitionTimingFunction: {
        // The one easing voice of the site: slow attack, expensive settle.
        lux: "cubic-bezier(0.19, 1, 0.22, 1)",
      },
      zIndex: {
        nav: "60",
        menu: "70",
      },
    },
  },
  plugins: [],
};

export default config;
