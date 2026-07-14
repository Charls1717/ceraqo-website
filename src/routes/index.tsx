import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/site/Nav";
import { DiveExperience } from "@/components/site/dive/DiveExperience";
import { SpecGrid } from "@/components/site/SpecGrid";
import { SeriesOne } from "@/components/site/SeriesOne";
import { FAQ } from "@/components/site/FAQ";
import { Reserve } from "@/components/site/Reserve";
import { Footer } from "@/components/site/Footer";
import { useLenis } from "@/lib/useLenis";

export const Route = createFileRoute("/")({
  component: Index,
});

/**
 * The page IS the dive: Nav floats above the pinned zoom from the studio
 * bottle down to the quartz lattice, then the datasheet, the edition and
 * the reserve CTA pick up on the black the dive ends on.
 */
function Index() {
  useLenis();
  return (
    <div className="min-h-screen w-full p-[14px] sm:p-[18px]" style={{ background: "linear-gradient(135deg, var(--bg-a), var(--bg-b))" }}>
      <main className="relative overflow-hidden rounded-[28px] hairline bg-[color:var(--frame)] text-[color:var(--ink)]">
        <Nav />
        <DiveExperience />
        <SpecGrid />
        <SeriesOne />
        <Reserve />
        <FAQ />
        <Footer />
      </main>
    </div>
  );
}
