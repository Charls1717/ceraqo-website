import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { assetUrl } from '../lib/assetUrl';
import {
  IconAbrasion,
  IconChemical,
  IconClean,
  IconCorrosion,
  IconCrystal,
  IconDIY,
  IconFallout,
  IconFilm,
  IconGloss,
  IconHydro,
  IconLayers,
  IconOleo,
  IconPro,
  IconRain,
  IconSalt,
  IconShieldChem,
  IconUV,
  IconUVShield,
} from './icons';

gsap.registerPlugin(ScrollTrigger);

/* The client's approved marketing copy — kept lines stay verbatim. */

const THREATS: { label: string; icon: ReactNode }[] = [
  { label: 'Road salt', icon: <IconSalt /> },
  { label: 'UV radiation', icon: <IconUV /> },
  { label: 'Rain', icon: <IconRain /> },
  { label: 'Traffic film', icon: <IconFilm /> },
  { label: 'Industrial fallout', icon: <IconFallout /> },
  { label: 'Chemical contamination', icon: <IconChemical /> },
  { label: 'Daily abrasion', icon: <IconAbrasion /> },
];

const SPEC_CARDS: { label: string; icon: ReactNode }[] = [
  { label: 'Deep Glass-Like Gloss', icon: <IconGloss /> },
  { label: 'Hydrophobic Performance', icon: <IconHydro /> },
  { label: 'Oleophobic Protection', icon: <IconOleo /> },
  { label: 'High Chemical Resistance', icon: <IconShieldChem /> },
  { label: 'Corrosion Resistance', icon: <IconCorrosion /> },
  { label: 'UV Protection', icon: <IconUVShield /> },
  { label: 'High Abrasion Resistance', icon: <IconLayers /> },
  { label: 'Easy-to-Clean Effect', icon: <IconClean /> },
  { label: 'Crystal Clear Finish', icon: <IconCrystal /> },
  { label: 'Professional-Grade Performance', icon: <IconPro /> },
  { label: 'Simple DIY Application', icon: <IconDIY /> },
];

const MAINTENANCE = [
  'Easier washing',
  'Faster drying',
  'Reduced maintenance effort',
  'A cleaner-looking vehicle between washes',
];

const FACTORS = [
  'Surface preparation',
  'Application quality',
  'Environmental conditions',
  'Vehicle usage',
  'Washing methods',
  'Maintenance routine',
];

const KIT = [
  '50 ml Q-ARMOR',
  'Premium Applicator Pad',
  'Premium Microfiber Cloth',
  'Professional Application Guide',
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

const STEPS = ['Prepare the surface', 'Apply', 'Buff', 'Allow the coating to cure'];

/** Instrument-style arc meter, animated on reveal. */
function Gauge({
  frac,
  value,
  unit,
  label,
}: {
  frac: number;
  value: string;
  unit: string;
  label: string;
}) {
  const R = 52;
  const C = 2 * Math.PI * R;
  return (
    <article className="scard scard--gauge reveal">
      <svg className="gauge" viewBox="0 0 120 120" aria-hidden="true">
        <circle className="gauge__track" cx="60" cy="60" r={R} />
        <circle
          className="gauge__arc"
          cx="60"
          cy="60"
          r={R}
          strokeDasharray={C}
          strokeDashoffset={C}
          data-offset={C * (1 - frac)}
        />
      </svg>
      <div className="gauge__read">
        <span className="gauge__num" data-to={value}>
          {value}
        </span>
        <span className="gauge__unit">{unit}</span>
      </div>
      <h3 className="scard__label">{label}</h3>
    </article>
  );
}

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
          scrollTrigger: { trigger: el, start: 'top 86%' },
        });
      });
      // Card grids come in staggered, item by item
      gsap.utils.toArray<HTMLElement>('.stagger').forEach((group) => {
        gsap.to(group.children, {
          opacity: 1,
          y: 0,
          duration: 0.85,
          ease: 'power3.out',
          stagger: 0.055,
          scrollTrigger: { trigger: group, start: 'top 84%' },
        });
      });
      // Arc meters sweep and count on entry
      gsap.utils.toArray<SVGCircleElement>('.gauge__arc').forEach((arc) => {
        gsap.to(arc, {
          strokeDashoffset: Number(arc.dataset.offset ?? 0),
          duration: 1.6,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: arc, start: 'top 82%' },
        });
      });
      gsap.utils.toArray<HTMLElement>('.gauge__num').forEach((num) => {
        const to = num.dataset.to ?? '';
        const numeric = Number(to);
        if (!Number.isFinite(numeric)) return;
        const obj = { v: 0 };
        gsap.to(obj, {
          v: numeric,
          duration: 1.6,
          ease: 'power2.out',
          scrollTrigger: { trigger: num, start: 'top 82%' },
          onUpdate: () => {
            num.textContent = String(Math.round(obj.v));
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
      {/* 01 — More Than Protection: copy + a frame from the dive */}
      <section id="s-protection" className="section section--rule section--glow-a" aria-labelledby="mtp-title">
        <div className="section__kickrow reveal">
          <span className="section__kicker micro micro--cyan">01 / Surface engineering</span>
        </div>
        <div className="split">
          <div className="split__copy">
            <h2 id="mtp-title" className="section__title section__title--xl reveal">
              More Than Protection. A New Generation of Surface Engineering.
            </h2>
            <p className="prose reveal">
              Q-ARMOR is not designed to temporarily cover your vehicle. It is designed to
              become part of it.
            </p>
            <p className="prose prose--turn reveal">
              This is not another wax. This is not another sealant. This is the next evolution
              of vehicle protection.
            </p>
          </div>
          <figure className="split__media reveal">
            <img src={assetUrl('/frames/stills/z3.webp')} alt="A drop of Q-ARMOR settling on a paint panel" loading="lazy" />
            <span className="finder finder--media" aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </span>
            <figcaption className="micro">Surface dive — zone 03 / spread</figcaption>
          </figure>
        </div>
      </section>

      {/* 02 — Why Q-Armor: the threats as an instrument grid */}
      <section id="s-threats" className="section section--rule section--dots" aria-labelledby="why-title">
        <div className="section__kickrow reveal">
          <span className="section__kicker micro micro--cyan">02 / The threats</span>
        </div>
        <h2 id="why-title" className="section__title section__title--xl reveal">
          Why Q-Armor?
        </h2>
        <p className="prose reveal">
          Because your vehicle deserves more than temporary protection. Every drive exposes
          your paint to invisible damage.
        </p>
        <ul className="tgrid stagger">
          {THREATS.map((t, i) => (
            <li key={t.label} className="tcard sitem">
              <span className="tcard__icon">{t.icon}</span>
              <span className="tcard__num micro">{String(i + 1).padStart(2, '0')}</span>
              <span className="tcard__label">{t.label}</span>
            </li>
          ))}
          <li className="tcard tcard--turn sitem">
            <span className="tcard__turn">
              Q-ARMOR is engineered to help preserve what matters.
            </span>
          </li>
        </ul>
      </section>

      {/* 03 — Specifications: data gauges + icon cards + the legal footnote */}
      <section id="s-specs" className="section section--rule section--glow-b" aria-labelledby="specs-title">
        <div className="section__kickrow reveal">
          <span className="section__kicker micro micro--cyan">03 / Specifications</span>
        </div>
        <h2 id="specs-title" className="section__title section__title--xl reveal">
          Q-ARMOR at a glance.
        </h2>
        <div className="specs2">
          <div className="specs2__data stagger">
            <Gauge frac={1} value="72" unit="months" label="Up to 72 Months Protection*" />
            <Gauge frac={0.9} value="9H" unit="pencil scale" label="Up to 9H Pencil Hardness" />
          </div>
          <div className="specs2__grid stagger">
            {SPEC_CARDS.map((s) => (
              <article key={s.label} className="scard sitem">
                <span className="scard__icon">{s.icon}</span>
                <h3 className="scard__label">{s.label}</h3>
              </article>
            ))}
            <article className="scard scard--mark sitem" aria-hidden="true">
              <span className="finder finder--media" >
                <i />
                <i />
                <i />
                <i />
              </span>
              <span className="scard__wordmark wordmark">
                CERAQO<span>™</span>
              </span>
            </article>
          </div>
        </div>

        <div className="duo">
          <div className="duo__cell duo__cell--card reveal">
            <span className="scard__icon">
              <IconGloss />
            </span>
            <h3 className="duo__title">Deep Gloss. Crystal Clear Finish.</h3>
            <p className="prose">
              Unlike products that leave heavy residues or artificial shine, Q-ARMOR enhances
              the natural depth of your vehicle’s finish. The result is a rich, reflective
              gloss that looks clean, sharp and refined.
            </p>
          </div>
          <div className="duo__cell duo__cell--card reveal">
            <span className="scard__icon">
              <IconClean />
            </span>
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

        <div className="footnote reveal">
          <p className="footnote__line">
            Under suitable conditions, Q-ARMOR is designed to provide protection for up to 72
            months.<sup className="asterisk">*</sup>
          </p>
          <div className="factors__label micro">* Dependent factors</div>
          <ul className="chips chips--micro">
            {FACTORS.map((f) => (
              <li key={f} className="chip">
                {f}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 04 — Professional Results */}
      <section id="s-apply" className="section section--rule" aria-labelledby="pro-title">
        <div className="section__kickrow reveal">
          <span className="section__kicker micro micro--cyan">04 / Application</span>
        </div>
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

      {/* 05 — Experience the Difference */}
      <section id="s-difference" className="section section--rule" aria-labelledby="exp-title">
        <div className="section__kickrow reveal">
          <span className="section__kicker micro micro--cyan">05 / The difference</span>
        </div>
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

      {/* 06 — Engineered for Extreme Environments */}
      <section id="s-environments" className="section section--rule" aria-labelledby="env-title">
        <div className="section__kickrow reveal">
          <span className="section__kicker micro micro--cyan">06 / Proven conditions</span>
        </div>
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

      {/* 07 — Built to Last */}
      <section id="s-built" className="section section--rule" aria-labelledby="btl-title">
        <div className="section__kickrow reveal">
          <span className="section__kicker micro micro--cyan">07 / Permanence</span>
        </div>
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

      {/* 08 — Kit contents */}
      <section id="s-kit" className="section section--rule" aria-labelledby="kit-title">
        <div className="section__kickrow reveal">
          <span className="section__kicker micro micro--cyan">08 / In the box</span>
        </div>
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

      {/* 09 — Compatibility */}
      <section id="s-fit" className="section section--rule" aria-labelledby="fit-title">
        <div className="section__kickrow reveal">
          <span className="section__kicker micro micro--cyan">09 / Compatibility</span>
        </div>
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

      {/* 10 — The Science */}
      <section id="s-science" className="section section--rule" aria-labelledby="sci-title">
        <div className="section__kickrow reveal">
          <span className="section__kicker micro micro--cyan">10 / The science</span>
        </div>
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

      {/* 11 — Philosophy */}
      <section id="s-philosophy" className="section philosophy" aria-labelledby="phi-title">
        <div className="section__kickrow reveal">
          <span className="section__kicker micro micro--cyan">11 / Philosophy</span>
        </div>
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
      <section id="s-access" className="waitlist section" aria-labelledby="waitlist-title">
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
