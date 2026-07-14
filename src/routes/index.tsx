import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/site/Nav";
import { Hero } from "@/components/site/Hero";
import { ScrollStory } from "@/components/site/ScrollStory";
import { DarkExperience } from "@/components/site/DarkExperience";
import { Benefits } from "@/components/site/Benefits";
import { HowItWorks } from "@/components/site/HowItWorks";
import { LookCloser } from "@/components/site/LookCloser";
import { Results } from "@/components/site/Results";
import { Testimonials } from "@/components/site/Testimonials";
import { FAQ } from "@/components/site/FAQ";
import { Reserve } from "@/components/site/Reserve";
import { Footer } from "@/components/site/Footer";
import { useLenis } from "@/lib/useLenis";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  useLenis();
  return (
    <div className="min-h-screen w-full p-[14px] sm:p-[18px]" style={{ background: "linear-gradient(135deg, var(--bg-a), var(--bg-b))" }}>
      <main className="relative overflow-hidden rounded-[28px] hairline bg-[color:var(--frame)] text-[color:var(--ink)]">
        <Nav />
        <Hero />
        <ScrollStory />
        <DarkExperience />
        <Benefits />
        <HowItWorks />
        <LookCloser />
        <Results />
        <Testimonials />
        <FAQ />
        <Reserve />
        <Footer />
      </main>
    </div>
  );
}
