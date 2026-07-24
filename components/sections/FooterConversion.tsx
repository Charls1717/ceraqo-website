"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import AmbientVideo from "@/components/ui/AmbientVideo";
import RevealHeadline from "@/components/ui/RevealHeadline";
import Fade from "@/components/ui/Fade";
import Icon from "@/components/ui/Icons";
import { FOOTER, MENU, RESULT } from "@/lib/copy";
import { MEDIA } from "@/lib/media";

/**
 * End-of-scroll conversion: primary shop CTA, newsletter capture, legal
 * fine print and socials over the ambient Higgsfield loop. The email
 * capture keeps the previous site's localStorage waitlist contract
 * ("ceraqo-waitlist") so nothing collected before the redesign is lost.
 */
export default function FooterConversion() {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
    if (!ok) {
      setError(FOOTER.newsletter.error);
      return;
    }
    setError(null);
    try {
      const list = JSON.parse(localStorage.getItem("ceraqo-waitlist") ?? "[]") as string[];
      list.push(email.trim());
      localStorage.setItem("ceraqo-waitlist", JSON.stringify(list));
    } catch {
      /* storage unavailable — the confirmation still stands */
    }
    setJoined(true);
  };

  return (
    <footer id="shop" className="relative overflow-hidden">
      <AmbientVideo video={MEDIA.ambientMenu} className="absolute inset-0" dim={0.45} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink via-transparent to-ink" aria-hidden />

      <div className="relative z-10 px-6 pb-10 pt-36 md:px-14 lg:px-20">
        <div className="mx-auto max-w-6xl">
          <Fade className="micro mb-6 text-champagne">{FOOTER.kicker}</Fade>
          <RevealHeadline
            lines={FOOTER.headline}
            className="text-[13vw] md:text-[7.5vw] lg:text-[6.5vw]"
          />
          <Fade className="prose-block mt-8">{FOOTER.body}</Fade>

          <div className="mt-14 grid gap-14 md:grid-cols-2 md:gap-10">
            {/* primary CTA — wire to the live shop when it exists */}
            <Fade as="div">
              <motion.a
                href="#shop"
                onClick={(e) => e.preventDefault()}
                aria-describedby="shop-note"
                className="display inline-block bg-champagne px-12 py-6 text-xl text-ink transition-colors duration-500 hover:bg-champagne-bright"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "tween", ease: [0.19, 1, 0.22, 1], duration: 0.5 }}
              >
                Shop Q-ARMOR™ Now
              </motion.a>
              <p id="shop-note" className="micro mt-4 text-steel">
                Launching 2026 — join the list for priority access
              </p>
            </Fade>

            {/* newsletter capture */}
            <Fade as="div" index={1}>
              <h3 className="font-body text-lg font-medium text-bone/90">
                {FOOTER.newsletter.title}
              </h3>
              <p className="mt-1 text-sm text-steel">{FOOTER.newsletter.note}</p>

              {joined ? (
                <p role="status" className="mt-6 border border-champagne/40 bg-champagne/10 px-5 py-4 text-champagne-bright">
                  {FOOTER.newsletter.success}
                </p>
              ) : (
                <form onSubmit={submit} className="mt-6" noValidate>
                  <div className="flex border-b border-bone/25 transition-colors duration-500 focus-within:border-champagne">
                    <label htmlFor="newsletter-email" className="sr-only">
                      {FOOTER.newsletter.placeholder}
                    </label>
                    <input
                      id="newsletter-email"
                      type="email"
                      autoComplete="email"
                      placeholder={FOOTER.newsletter.placeholder}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent py-4 text-bone placeholder:text-steel/60 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="micro shrink-0 px-4 text-champagne transition-colors duration-300 hover:text-champagne-bright"
                    >
                      {FOOTER.newsletter.action} →
                    </button>
                  </div>
                  {error && (
                    <p role="alert" className="mt-3 text-sm text-champagne-bright">
                      {error}
                    </p>
                  )}
                </form>
              )}
            </Fade>
          </div>

          {/* legal */}
          <div id="legal" className="mt-24 border-t hairline pt-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="max-w-2xl space-y-3">
                <p className="text-[0.8125rem] leading-relaxed text-steel/80">
                  {FOOTER.legal.copyright}
                </p>
                <p className="text-[0.8125rem] leading-relaxed text-steel/60">{RESULT.footnote}</p>
              </div>
              <div className="flex items-center gap-6">
                {MENU.socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.label}
                    className="text-steel transition-colors duration-400 hover:text-champagne"
                  >
                    <Icon name={s.icon} className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>
            <p className="micro mt-8 text-steel/50">{FOOTER.legal.made}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
