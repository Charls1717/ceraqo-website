import Shell from "@/components/Shell";
import SiteExperience from "@/components/SiteExperience";

/**
 * The single-page cinematic journey:
 * HERO → 01 SCIENCE → 02 APPLICATION → 03 RESULT → pre-order.
 *
 * SiteExperience gates between the live WebGL world (capable devices)
 * and the static Higgsfield-still experience (reduced motion, no
 * WebGL2, crawlers).
 */
export default function Page() {
  return (
    <Shell>
      <SiteExperience />
    </Shell>
  );
}
