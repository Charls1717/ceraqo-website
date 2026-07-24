"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * One registration point so every component shares the same GSAP context.
 * The house easing ("lux") mirrors the CSS cubic-bezier: long, expensive
 * settles — never bouncy.
 */
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: "expo.out", duration: 1.1 });
}

export { gsap, ScrollTrigger };
