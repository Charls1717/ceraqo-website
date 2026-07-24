"use client";

import { useCallback, useState } from "react";
import SmoothScroll from "@/components/SmoothScroll";
import SiteNav from "@/components/SiteNav";
import FullscreenMenu from "@/components/FullscreenMenu";
import ChapterRail from "@/components/ui/ChapterRail";
import Grain from "@/components/ui/Grain";

/**
 * Client chrome around the page: smooth scrolling, fixed nav, fullscreen
 * menu state, chapter rail and film grain. Sections render as children
 * inside the Lenis context.
 */
export default function Shell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <SmoothScroll>
      <SiteNav menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((v) => !v)} />
      <FullscreenMenu open={menuOpen} onClose={closeMenu} />
      <ChapterRail />
      <main>{children}</main>
      <Grain />
    </SmoothScroll>
  );
}
