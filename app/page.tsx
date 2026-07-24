import Shell from "@/components/Shell";
import Hero from "@/components/sections/Hero";
import Science from "@/components/sections/Science";
import Application from "@/components/sections/Application";
import Result from "@/components/sections/Result";
import FooterConversion from "@/components/sections/FooterConversion";

/**
 * The single-page cinematic journey:
 * HERO → 01 SCIENCE → 02 APPLICATION → 03 RESULT → conversion.
 */
export default function Page() {
  return (
    <Shell>
      <Hero />
      <Science />
      <Application />
      <Result />
      <FooterConversion />
    </Shell>
  );
}
