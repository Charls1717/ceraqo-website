import { useEffect, useRef, useState, type FormEvent } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const SPECS = [
  {
    title: '9H heat-cured / 8H ambient-cured',
    body: 'Quartz ceramic hardness at the top of the pencil scale — cured by heat or simply by air.',
  },
  {
    title: 'Hydrophobic, oleophobic & stain-resistant',
    body: 'Water, oil and grime lose their grip on the finished surface.',
  },
  {
    title: 'Seals out water and oxygen',
    body: 'A closed quartz layer acts as a corrosion barrier for the substrate beneath.',
  },
  {
    title: 'Built for hard sectors',
    body: 'Developed for the auto, aviation, marine, military and transport sectors.',
  },
  {
    title: 'Beyond paint',
    body: 'Also for rims, headlights, glass, plastics, powder-coated and anodized surfaces.',
  },
  {
    title: 'One unbroken layer',
    body: 'Covalently bonded silane chemistry — the coating becomes part of the surface itself.',
  },
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
      {/* Spec callouts */}
      <section className="section" aria-labelledby="specs-title">
        <div className="section__kicker micro micro--cyan reveal">Q-ARMOR — specifications</div>
        <h2 id="specs-title" className="section__title reveal">
          A quartz ceramic shield, engineered molecule by molecule.
        </h2>
        <div className="specs">
          {SPECS.map((s, i) => (
            <article key={s.title} className="spec reveal">
              <div className="spec__num">SPEC {String(i + 1).padStart(2, '0')}</div>
              <h3 className="spec__title">{s.title}</h3>
              <p className="spec__body">{s.body}</p>
            </article>
          ))}
        </div>
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

      {/* Waitlist */}
      <section className="waitlist section" aria-labelledby="waitlist-title">
        <div className="section__kicker micro micro--cyan reveal">Priority access</div>
        <h2 id="waitlist-title" className="section__title reveal" style={{ marginInline: 'auto' }}>
          Be first on the surface.
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
          CERAQO <span>/</span> Q-ARMOR
        </div>
        <div className="footer__meta">
          <span className="micro">Silane-based quartz ceramic coating</span>
          <span className="micro">© 2026 CERAQO</span>
        </div>
      </footer>
    </div>
  );
}
