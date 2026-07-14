import { DIVE_ZONES, formatMag } from "./manifest";

/**
 * Reduced-motion dive: the five zones as curated stills with plain fades —
 * no pinning, no scrubbing, the same facts and magnification story.
 */
export function DiveStills() {
  return (
    <section id="product" className="relative" style={{ background: "#F6F0F2" }}>
      {DIVE_ZONES.map((z, i) => {
        const dark = i >= 2;
        return (
          <figure
            key={z.key}
            className="relative m-0 flex min-h-[92vh] flex-col justify-center px-6 py-16 sm:px-12"
            style={{
              background: ["#F6F0F2", "#EBD9C4", "#241D18", "#0B0A0C", "#060507"][i],
              color: dark ? "#F2EEF0" : "#141414",
            }}
          >
            <div className="mx-auto w-full max-w-5xl">
              <div className="mb-6 flex items-end justify-between text-[10px] uppercase tracking-[0.3em] opacity-70">
                <span className="text-gold">
                  {String(z.index + 1).padStart(2, "0")} · {z.title}
                </span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>
                  {formatMag(z.mag[0])} → {formatMag(z.mag[1])}
                </span>
              </div>
              <div className="overflow-hidden rounded-3xl hairline">
                <img
                  src={z.still}
                  alt={`${z.title} — dive zone ${z.index + 1} of 5`}
                  loading={i === 0 ? "eager" : "lazy"}
                  className="aspect-video h-auto w-full object-cover transition-opacity duration-700"
                />
              </div>
              <figcaption className="mt-8 max-w-2xl text-2xl font-[300] leading-snug tracking-[-0.01em] sm:text-3xl">
                {z.fact}
              </figcaption>
            </div>
          </figure>
        );
      })}
    </section>
  );
}
