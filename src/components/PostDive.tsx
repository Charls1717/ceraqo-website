import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { assetUrl } from '../lib/assetUrl';
import { PREORDER_URL } from '../config';
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

const COMPARE_ROWS: { label: string; q: string; pro: string }[] = [
  {
    label: 'Application',
    q: 'Self-applied — wipe on, buff, cures at ambient temperature',
    pro: 'Trained installer, multi-stage preparation',
  },
  {
    label: 'Hardness',
    q: 'Up to 9H pencil hardness',
    pro: 'Varies by product and tier',
  },
  {
    label: 'Protection window',
    q: 'Up to 72 months*',
    pro: 'Commonly 24–60 months, tier dependent',
  },
  {
    label: 'Time & place',
    q: 'Your driveway, about an hour',
    pro: 'Booked shop time, often over multiple days',
  },
];

/**
 * Every answer is assembled from claims already on the page — the
 * FAQ introduces no new product facts. The charge-timing answer
 * follows the PREORDER_URL switch so it never promises a checkout
 * that isn't live yet.
 */
const FAQ: { q: string; a: string }[] = [
  {
    q: 'What exactly is Q-ARMOR?',
    a: 'A newly developed silane chemistry — not a wax, not another ceramic coating. It bonds with your paint and outperforms premium ceramic coatings in hardness and durability.',
  },
  {
    q: 'Can I really apply it myself?',
    a: 'Yes. Wipe on, buff, let it cure — about an hour in your driveway. No installer, no equipment, no experience.',
  },
  {
    q: 'How long does the protection last?',
    a: 'Up to 72 months, depending on preparation, environment and washing routine.',
  },
  {
    q: 'How hard is the cured layer?',
    a: 'Up to 9H pencil hardness — engineered to outperform today’s premium ceramic coatings.',
  },
  {
    q: 'How far does one kit go?',
    a: '35–50 ml protects an entire car. One kit covers up to two large vehicles.',
  },
  {
    q: 'How does the batch model work?',
    a: '20,000 numbered bottles per batch. A new batch every two months. When one sells out, pre-orders open for the next — a production schedule, not artificial scarcity.',
  },
  {
    q: 'When am I charged?',
    a: PREORDER_URL
      ? 'At checkout, the moment you place your pre-order. Your order secures your spot in Batch 001.'
      : 'At checkout, once pre-orders open. Until then, your email holds your place in Batch 001.',
  },
];

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
      {/* 01 — the category claim */}
      <section id="s-protection" className="section section--rule section--glow-a" aria-labelledby="mtp-title">
        <div className="section__kickrow reveal">
          <span className="section__kicker micro micro--cyan">01 / A new category</span>
        </div>
        <div className="split">
          <div className="split__copy">
            <h2 id="mtp-title" className="section__title section__title--xl reveal">
              A new category of surface protection.
            </h2>
            <p className="prose reveal">
              Not a reformulated wax. Not another ceramic coating. Q-ARMOR is a newly
              developed silane chemistry that becomes part of your paint — engineered to
              outperform premium ceramic coatings in hardness and durability.
            </p>
            <p className="prose prose--turn reveal">
              Applied by you, in your driveway. No installer. No equipment. €169.
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
          </figure>
        </div>
      </section>

      {/* 02 — the threats */}
      <section id="s-threats" className="section section--rule section--dots" aria-labelledby="why-title">
        <div className="section__kickrow reveal">
          <span className="section__kicker micro micro--cyan">02 / The threats</span>
        </div>
        <h2 id="why-title" className="section__title section__title--xl reveal">
          Why Q-Armor?
        </h2>
        <p className="prose reveal">
          Every drive attacks your paint. Invisibly. Constantly.
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
            <span className="tcard__turn">One coating against all of it.</span>
          </li>
        </ul>
      </section>

      {/* 03 — specifications */}
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
            <Gauge frac={1} value="9H" unit="hardness" label="Up to 9H Pencil Hardness" />
          </div>
          <div className="specs2__grid stagger">
            {SPEC_CARDS.map((s) => (
              <article key={s.label} className="scard sitem">
                <span className="scard__icon">{s.icon}</span>
                <h3 className="scard__label">{s.label}</h3>
              </article>
            ))}
            <article className="scard scard--mark sitem">
              <span className="finder finder--media" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
              </span>
              <span className="scard__wordmark wordmark">
                CERAQO<span>™</span>
              </span>
              <p className="scard__closing">
                Not a wax. Not another ceramic coating. A new category.
              </p>
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
              No heavy residues. No artificial shine. Just deeper, sharper, more reflective
              gloss.
            </p>
          </div>
          <div className="duo__cell duo__cell--card reveal">
            <span className="scard__icon">
              <IconClean />
            </span>
            <h3 className="duo__title">Easy Maintenance. Less Cleaning. More Driving.</h3>
            <p className="prose">Water, dirt and oil struggle to stick.</p>
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

      {/* 04 — price & performance */}
      <section id="s-value" className="section section--rule section--glow-a" aria-labelledby="value-title">
        <div className="section__kickrow reveal">
          <span className="section__kicker micro micro--cyan">04 / Price &amp; performance</span>
        </div>
        <h2 id="value-title" className="section__title section__title--xl reveal">
          Professional-grade results. A fraction of the price.
        </h2>
        <div className="compare stagger">
          <article className="compare__col compare__col--q sitem">
            <header className="compare__head">
              <span className="micro micro--cyan">Q-ARMOR</span>
              <strong className="compare__price">€169</strong>
              <span className="micro compare__per">per kit — protects up to two large vehicles</span>
            </header>
            <dl className="compare__rows">
              {COMPARE_ROWS.map((r) => (
                <div key={r.label} className="compare__row">
                  <dt className="micro">{r.label}</dt>
                  <dd>{r.q}</dd>
                </div>
              ))}
            </dl>
          </article>
          <article className="compare__col sitem">
            <header className="compare__head">
              <span className="micro">Professional ceramic coating</span>
              <strong className="compare__price compare__price--dim">€700–€2,500+</strong>
              <span className="micro compare__per">per vehicle at premium detailing shops</span>
            </header>
            <dl className="compare__rows">
              {COMPARE_ROWS.map((r) => (
                <div key={r.label} className="compare__row">
                  <dt className="micro">{r.label}</dt>
                  <dd>{r.pro}</dd>
                </div>
              ))}
            </dl>
          </article>
        </div>
        <p className="compare__note micro reveal">
          Professional pricing varies by market, vehicle size, preparation and coating tier.
        </p>
      </section>

      {/* 05 — application */}
      <section id="s-apply" className="section section--rule" aria-labelledby="pro-title">
        <div className="section__kickrow reveal">
          <span className="section__kicker micro micro--cyan">05 / Application</span>
        </div>
        <h2 id="pro-title" className="section__title reveal">
          Professional Results. Made for Everyone.
        </h2>
        <p className="prose reveal">
          Four steps. About an hour. No experience needed.
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

      {/* 06 — kit contents */}
      <section id="s-kit" className="section section--rule" aria-labelledby="kit-title">
        <div className="section__kickrow reveal">
          <span className="section__kicker micro micro--cyan">06 / In the box</span>
        </div>
        <h2 id="kit-title" className="section__title reveal">
          One Kit. Everything Included.
        </h2>
        <p className="prose reveal">Everything required. Nothing extra.</p>
        <ul className="kit">
          {KIT.map((k, i) => (
            <li key={k} className="kit__item reveal">
              <span className="kit__num">{String(i + 1).padStart(2, '0')}</span>
              {k}
            </li>
          ))}
        </ul>
        <p className="prose prose--dim reveal">
          One kit protects up to two large vehicles.
        </p>
      </section>

      {/* 07 — compatibility */}
      <section id="s-fit" className="section section--rule" aria-labelledby="fit-title">
        <div className="section__kickrow reveal">
          <span className="section__kicker micro micro--cyan">07 / Compatibility</span>
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

      {/* 08 — the science */}
      <section id="s-science" className="section section--rule" aria-labelledby="sci-title">
        <div className="section__kickrow reveal">
          <span className="section__kicker micro micro--cyan">08 / The science</span>
        </div>
        <h2 id="sci-title" className="section__title reveal">
          The Science Behind Q-Armor
        </h2>
        <p className="prose reveal">
          Q-ARMOR doesn’t rest on your paint — it bonds with it. Covalently. It cannot
          flake off or be washed off. And it stays perfectly transparent: nothing but
          depth, gloss and protection.
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

      {/* 09 — philosophy */}
      <section id="s-philosophy" className="section philosophy" aria-labelledby="phi-title">
        <div className="section__kickrow reveal">
          <span className="section__kicker micro micro--cyan">09 / Philosophy</span>
        </div>
        <h2 id="phi-title" className="section__title reveal">
          Designed Around One Philosophy
        </h2>
        <p className="philosophy__word reveal">Confidence.</p>
        <div className="lines">
          <p className="lines__line reveal">Confidence every time you wash your vehicle.</p>
          <p className="lines__line reveal">Confidence every time it rains.</p>
          <p className="lines__line reveal">Confidence every time you park and look back.</p>
        </div>
        <p className="prose prose--turn reveal">
          Because it’s never just about paint. It’s about pride of ownership.
        </p>
      </section>

      {/* 10 — questions, answered before the ask */}
      <section id="s-faq" className="section section--rule section--dots" aria-labelledby="faq-title">
        <div className="section__kickrow reveal">
          <span className="section__kicker micro micro--cyan">10 / Questions</span>
        </div>
        <h2 id="faq-title" className="section__title reveal">
          Before You Pre-order
        </h2>
        <div className="faq">
          {FAQ.map((f) => (
            <details key={f.q} className="faq__item reveal">
              <summary className="faq__q">{f.q}</summary>
              <p className="faq__a prose">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Pre-order */}
      <section id="s-access" className="waitlist section" aria-labelledby="waitlist-title">
        <div className="waitlist__ghost" aria-hidden="true">
          <img src={assetUrl('/poster.webp')} alt="" loading="lazy" />
        </div>
        <div className="section__kicker micro micro--cyan reveal">Pre-order</div>
        <h2 id="waitlist-title" className="section__title reveal" style={{ marginInline: 'auto' }}>
          Welcome to the Future of Surface Protection.
          <br />
          Welcome to CERAQO<sup className="hero__tm">™</sup>.
        </h2>
        <p className="batchline reveal">
          <span className="batchline__num">Batch 001</span> · 20,000 bottles · a new batch
          every two months
        </p>
        {PREORDER_URL ? (
          // Live checkout mode — flips on automatically once the
          // Shopify URL is set in src/config.ts.
          <>
            <a className="waitlist__btn waitlist__btn--link reveal" href={PREORDER_URL} target="_blank" rel="noopener">
              Pre-order — €169
            </a>
            <p className="waitlist__note reveal">
              Payment is taken at checkout. Your order secures your spot in Batch 001.
            </p>
          </>
        ) : joined ? (
          <div className="waitlist__ok" role="status">
            You’re on the list for Batch 001. We’ll be in touch before it ships.
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
                Pre-order — €169
              </button>
            </form>
            <p className="waitlist__note reveal" role={error ? 'alert' : undefined}>
              {error ??
                'Payment is taken at checkout once pre-orders open — your email secures your place in Batch 001.'}
            </p>
          </>
        )}
        <p className="waitlist__legal reveal">
          Your address is used only to contact you about Batch 001 — never shared, never
          sold. <a className="waitlist__legal-link" href="#privacy">Privacy notice</a>
        </p>
        <div className="batchbox reveal">
          <p>
            Numbered batches of 20,000 bottles. A new batch every two months. When one
            sells out, pre-orders open for the next — a production schedule, not
            artificial scarcity.
          </p>
        </div>
      </section>

      <div id="privacy" className="legal">
        <h3 className="legal__title micro micro--cyan">Privacy notice</h3>
        <p className="legal__text">
          The email address you submit is used solely to contact you about Q-ARMOR
          pre-orders and batch availability. It is never sold or shared with third
          parties, and you can request its removal at any time. Full purchase terms are
          presented at checkout when pre-orders open.
        </p>
      </div>

      <footer className="footer">
        <div className="footer__mark wordmark">
          CERAQO<sup className="hero__tm">™</sup> <span>/</span> Q-ARMOR
        </div>
        <div className="footer__meta">
          <span className="micro">Advanced Surface Protection</span>
          <a className="micro footer__link" href="#privacy">
            Privacy
          </a>
          <span className="micro">© 2026 CERAQO</span>
        </div>
      </footer>
    </div>
  );
}
