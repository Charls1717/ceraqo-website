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
        /* "Dimly lit high-end showroom at dusk" (owner directive):
           the ground is a graphite-green charcoal in the #1c1f1e–#232622
           band, never pitch black — near-black survives only as small
           local accents (droplets, tire shadows, deep reflections). */
        ink: "#1E211F", // page ground
        graphite: "#262A27",
        gunmetal: "#2E332F",
        smoke: "#3A403B",
        seam: "#474D48", // hairline borders
        steel: "#99A29B", // desaturated secondary text
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
