import { ZONES } from '../data/zones';
import PostDive from './PostDive';

/**
 * prefers-reduced-motion experience: the five zones as curated stills
 * with the same datasheet facts — no scrubbing, no pinning, no smooth
 * scroll.
 */
export default function StillsFallback() {
  return (
    <div className="stills">
      <header className="stills-hero">
        <div className="overlay__kicker micro">CERAQO — surface protection</div>
        <h1 className="overlay__title">How close will you look?</h1>
        <p className="micro">Q-ARMOR — the dive, in five stills</p>
      </header>

      {ZONES.map((zone, i) => (
        <section key={zone.id} className="still" aria-label={zone.label}>
          <img
            className="still__img"
            src={`/frames/stills/z${i + 1}.webp`}
            alt={`${zone.kicker} — zone ${i + 1} of the Q-ARMOR dive`}
            loading={i === 0 ? 'eager' : 'lazy'}
          />
          <div className="still__scrim" />
          <div className="still__copy">
            <div className="overlay__kicker">
              Zone 0{i + 1} — {zone.kicker}
            </div>
            <p className="overlay__fact">{zone.fact}</p>
          </div>
        </section>
      ))}

      <PostDive animate={false} />
    </div>
  );
}
