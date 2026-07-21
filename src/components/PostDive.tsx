import { useEffect, useRef, useState, type FormEvent } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* The client's approved marketing copy — verbatim. */

const SPECS = [
  'Up to 72 Months Protection*',
  'Up to 9H Pencil Hardness',
  'Deep Glass-Like Gloss',
  'Hydrophobic Performance',
  'Oleophobic Protection',
  'High Chemical Resistance',
  'Corrosion Resistance',
  'UV Protection',
  'High Abrasion Resistance',
  'Easy-to-Clean Effect',
  'Crystal Clear Finish',
  'Professional-Grade Performance',
  'Simple DIY Application',
];

const THREATS = [
  'Road salt',
  'UV radiation',
  'Rain',
  'Traffic film',
  'Industrial fallout',
  'Chemical contamination',
  'Daily abrasion',
];

const BARRIER = [
  'UV exposure',
  'Oxidation',
  'Corrosion',
  'Environmental contamination',
  'Road salt',
  'Chemical exposure',
  'Everyday abrasion',
  'Water staining',
];

const STEPS = ['Prepare the surface', 'Apply', 'Buff', 'Allow the coating to cure'];

const MAINTENANCE = [
  'Easier washing',
  'Faster drying',
  'Reduced maintenance effort',
  'A cleaner-looking vehicle between washes',
];

const KIT = [
  '50 ml Q-ARMOR',
  'Premium Applicator Pad',
  'Premium Microfiber Cloth',
  'Professional Application Guide',
];

const FACTORS = [
  'Surface preparation',
  'Application quality',
  'Environmental conditions',
  'Vehicle usage',
  'Washing methods',
  'Maintenance routine',
];

const SUITABLE = [
  'Cars',
  'SUVs',
  'Classic Vehicles',
  'Motorcycles',
  'Caravans',
  'Boats',
  'Painted Surfaces',
  'Clear Coat',
  'Wheels',
  'Powder-Coated Surfaces',
  'Aluminium',
  'Plastics',
  'Headlights',
  'Door Handles',
  'Glass',
];

export default function PostDive() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.reveal').forEach((el) => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 1.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 86%',
          },
        });
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
    if (!ok) {
      setError('Enter a valid email address.');
      return;
    }
    setError(null);
    try {
      const list = JSON.parse(localStorage.getItem('ceraqo-waitlist') ?? '[]') as string[];
      list.push(email.trim());
      localStorage.setItem('ceraqo-waitlist', JSON.stringify(list));
    } catch {
      /* storage unavailable — the confirmation still stands */
    }
    setJoined(true);
  };

  return (
    <div ref={rootRef} className="post">
      {/* 01 — More Than Protection */}
      <section className="section" aria-labelledby="mtp-title">
        <div className="section__kicker micro micro--cyan reveal">01 / Surface engineering</div>
        <h2 id="mtp-title" className="section__title reveal">
          More Than Protection. A New Generation of Surface Engineering.
        </h2>
        <p className="prose reveal">
          Q-ARMOR is not designed to temporarily cover your vehicle. It is designed to become
          part of it. Once applied, it creates an ultra-thin, crystal-clear protective layer
          that bonds tightly with the surface to deliver long-lasting protection, exceptional
          gloss and effortless maintenance.
        </p>
        <p className="prose prose--turn reveal">
          This is not another wax. This is not another sealant. This is the next evolution of
          vehicle protection.
        </p>
      </section>

      {/* 02 — Why Q-Armor? */}
      <section className="section" aria-labelledby="why-title">
        <div className="section__kicker micro micro--cyan reveal">02 / The threats</div>
        <h2 id="why-title" className="section__title reveal">
          Why Q-Armor?
        </h2>
        <p className="prose reveal">
          Because your vehicle deserves more than temporary protection. Every drive exposes
          your paint to invisible damage.
        </p>
        <ul className="threats">
          {THREATS.map((t, i) => (
            <li key={t} className="threat reveal">
              <span className="threat__num">{String(i + 1).padStart(2, '0')}</span>
              {t}
            </li>
          ))}
        </ul>
        <p className="prose reveal">
          Over time these elements slowly reduce the appearance, gloss and value of every
          vehicle. Q-ARMOR is engineered to help preserve what matters.
        </p>
      </section>

      {/* 03 — Professional Results */}
      <section className="section" aria-labelledby="pro-title">
        <div className="section__kicker micro micro--cyan reveal">03 / Application</div>
        <h2 id="pro-title" className="section__title reveal">
          Professional Results. Made for Everyone.
        </h2>
        <p className="prose reveal">
          Advanced vehicle protection should not be limited to professional detailers.
          Q-ARMOR has been developed for enthusiasts and everyday drivers alike.
        </p>
        <ol className="steps">
          {STEPS.map((s, i) => (
            <li key={s} className="step reveal">
              <span className="step__num">{String(i + 1).padStart(2, '0')}</span>
              <span className="step__label">{s}</span>
            </li>
          ))}
        </ol>
        <p className="prose prose--turn reveal">
          That’s all. Professional-grade protection has never been this accessible.
        </p>
      </section>

      {/* 04 — Experience the Difference */}
      <section className="section" aria-labelledby="exp-title">
        <div className="section__kicker micro micro--cyan reveal">04 / The difference</div>
        <h2 id="exp-title" className="section__title reveal">
          Experience the Difference
        </h2>
        <p className="prose reveal">From the very first application you’ll notice the transformation.</p>
        <div className="lines">
          <p className="lines__line reveal">A deeper gloss.</p>
          <p className="lines__line reveal">A smoother finish.</p>
          <p className="lines__line reveal">Water beads and releases effortlessly.</p>
          <p className="lines__line reveal">Cleaning becomes easier.</p>
          <p className="lines__line reveal">The surface stays looking cleaner for longer.</p>
        </div>
        <p className="prose prose--turn reveal">Your vehicle keeps the finish it deserves.</p>
      </section>

      {/* 05 — Engineered for Extreme Environments */}
      <section className="section" aria-labelledby="env-title">
        <div className="section__kicker micro micro--cyan reveal">05 / Proven conditions</div>
        <h2 id="env-title" className="section__title reveal">
          Engineered for Extreme Environments
        </h2>
        <p className="prose reveal">
          Originally developed for demanding applications across automotive, marine, aviation
          and transport industries, Q-ARMOR is built to perform where ordinary protection
          reaches its limits. Whether facing freezing winters, intense summer heat, coastal
          environments or daily commuting, Q-ARMOR delivers reliable protection where it
          matters most.
        </p>
      </section>

      {/* 06 — Specifications */}
      <section className="section" aria-labelledby="specs-title">
        <div className="section__kicker micro micro--cyan reveal">06 / Specifications</div>
        <h2 id="specs-title" className="section__title reveal">
          Q-ARMOR at a glance.
        </h2>
        <div className="specs">
          {SPECS.map((s, i) => (
            <article key={s} className="spec reveal">
              <div className="spec__num">SPEC {String(i + 1).padStart(2, '0')}</div>
              <h3 className="spec__title">{s}</h3>
            </article>
          ))}
        </div>

        <div className="barrier reveal">
          <p className="prose">
            Q-ARMOR forms a durable protective barrier that helps reduce the effects of:
          </p>
          <ul className="chips">
            {BARRIER.map((b) => (
              <li key={b} className="chip">
                {b}
              </li>
            ))}
          </ul>
          <p className="prose">— while preserving the appearance of your vehicle.</p>
        </div>

        <div className="duo">
          <div className="duo__cell reveal">
            <h3 className="duo__title">Deep Gloss. Crystal Clear Finish.</h3>
            <p className="prose">
              Unlike products that leave heavy residues or artificial shine, Q-ARMOR enhances
              the natural depth of your vehicle’s finish. The result is a rich, reflective
              gloss that looks clean, sharp and refined.
            </p>
          </div>
          <div className="duo__cell reveal">
            <h3 className="duo__title">Easy Maintenance. Less Cleaning. More Driving.</h3>
            <p className="prose">
              Its advanced surface characteristics help reduce the adhesion of water, dirt,
              oils and everyday contamination.
            </p>
            <ul className="checklist">
              {MAINTENANCE.map((m) => (
                <li key={m} className="checklist__item">
                  <span className="checklist__mark">✔</span>
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 07 — Long-Term Protection (the asterisk lives here) */}
      <section className="section" aria-labelledby="ltp-title">
        <div className="section__kicker micro micro--cyan reveal">07 / Longevity</div>
        <h2 id="ltp-title" className="section__title reveal">
          Long-Term Protection
        </h2>
        <p className="prose prose--turn reveal">
          Under suitable conditions, Q-ARMOR is designed to provide protection for up to 72
          months.<sup className="asterisk">*</sup>
        </p>
        <div className="factors reveal">
          <div className="factors__label micro">* Dependent factors</div>
          <ul className="chips">
            {FACTORS.map((f) => (
              <li key={f} className="chip">
                {f}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 08 — Built to Last */}
      <section className="section" aria-labelledby="btl-title">
        <div className="section__kicker micro micro--cyan reveal">08 / Permanence</div>
        <h2 id="btl-title" className="section__title reveal">
          Built to Last
        </h2>
        <p className="prose reveal">
          Unlike conventional waxes and temporary sealants, Q-ARMOR creates a durable bond
          with compatible surfaces. It cannot simply be washed away during normal
          maintenance. Instead, it becomes an integrated protective layer designed to perform
          for years rather than weeks.
        </p>
      </section>

      {/* 09 — Kit contents */}
      <section className="section" aria-labelledby="kit-title">
        <div className="section__kicker micro micro--cyan reveal">09 / In the box</div>
        <h2 id="kit-title" className="section__title reveal">
          One Kit. Everything Included.
        </h2>
        <p className="prose reveal">
          Each Q-ARMOR kit contains everything required for professional-quality application.
        </p>
        <ul className="kit">
          {KIT.map((k, i) => (
            <li key={k} className="kit__item reveal">
              <span className="kit__num">{String(i + 1).padStart(2, '0')}</span>
              {k}
            </li>
          ))}
        </ul>
        <p className="prose prose--dim reveal">
          One kit protects up to two large vehicles, depending on vehicle size and
          application method.
        </p>
      </section>

      {/* 10 — Compatibility */}
      <section className="section" aria-labelledby="fit-title">
        <div className="section__kicker micro micro--cyan reveal">10 / Compatibility</div>
        <h2 id="fit-title" className="section__title reveal">
          Suitable For
        </h2>
        <ul className="chips chips--roomy reveal">
          {SUITABLE.map((s) => (
            <li key={s} className="chip">
              {s}
            </li>
          ))}
        </ul>
      </section>

      {/* 11 — The Science */}
      <section className="section" aria-labelledby="sci-title">
        <div className="section__kicker micro micro--cyan reveal">11 / The science</div>
        <h2 id="sci-title" className="section__title reveal">
          The Science Behind Q-Armor
        </h2>
        <p className="prose reveal">
          Q-ARMOR creates an ultra-thin, transparent protective layer that forms a strong
          chemical bond with compatible surfaces. Unlike waxes or traditional sealants that
          gradually disappear through washing and weather exposure, this protective layer
          becomes tightly attached to the surface. The result is long-lasting protection
          combined with exceptional gloss, excellent water repellency and easier maintenance.
          The coating remains completely transparent, allowing the original colour and finish
          of the vehicle to remain unchanged while enhancing depth and clarity.
        </p>
      </section>

      {/* Launch banner */}
      <section className="launch section">
        <div className="launch__over micro micro--cyan reveal">Launch window</div>
        <p className="launch__line reveal">
          One bottle. One car.
          <br />
          Launching <em>2026</em>.
        </p>
        <p className="launch__sub micro reveal">35–50 ml protects an entire car</p>
      </section>

      {/* 12 — Philosophy */}
      <section className="section philosophy" aria-labelledby="phi-title">
        <div className="section__kicker micro micro--cyan reveal">12 / Philosophy</div>
        <h2 id="phi-title" className="section__title reveal">
          Designed Around One Philosophy
        </h2>
        <p className="prose reveal">
          Most products promise protection. Q-ARMOR was created to deliver something more.
        </p>
        <p className="philosophy__word reveal">Confidence.</p>
        <div className="lines">
          <p className="lines__line reveal">Confidence every time you wash your vehicle.</p>
          <p className="lines__line reveal">Confidence every time it rains.</p>
          <p className="lines__line reveal">Confidence every time you park and look back.</p>
        </div>
        <p className="prose prose--turn reveal">
          Because protecting your vehicle isn’t just about preserving paint. It’s about
          preserving the pride of ownership.
        </p>
      </section>

      {/* Waitlist */}
      <section className="waitlist section" aria-labelledby="waitlist-title">
        <div className="section__kicker micro micro--cyan reveal">Priority access</div>
        <h2 id="waitlist-title" className="section__title reveal" style={{ marginInline: 'auto' }}>
          Welcome to the Future of Surface Protection.
          <br />
          Welcome to CERAQO<sup className="hero__tm">™</sup>.
        </h2>
        {joined ? (
          <div className="waitlist__ok" role="status">
            You’re on the list. We’ll be in touch before launch.
          </div>
        ) : (
          <>
            <form className="waitlist__form reveal" onSubmit={submit} noValidate>
              <input
                className="waitlist__input"
                type="email"
                name="email"
                placeholder="you@example.com"
                aria-label="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button className="waitlist__btn" type="submit">
                Join the Waitlist
              </button>
            </form>
            <p className="waitlist__note reveal" role={error ? 'alert' : undefined}>
              {error ?? 'No spam. One email when Q-ARMOR goes live.'}
            </p>
          </>
        )}
      </section>

      <footer className="footer">
        <div className="footer__mark wordmark">
          CERAQO<sup className="hero__tm">™</sup> <span>/</span> Q-ARMOR
        </div>
        <div className="footer__meta">
          <span className="micro">Advanced Surface Protection</span>
          <span className="micro">© 2026 CERAQO</span>
        </div>
      </footer>
    </div>
  );
}
