import { assetUrl } from '../lib/assetUrl';

interface HeroProps {
  /** true once the preloader is done — the background still is cached */
  on: boolean;
}

/**
 * Full-viewport opening: the product still (the first frame of the
 * dive film) under the brand block. The dive re-enters on this exact
 * frame with the instruments on — the film is a round trip.
 */
export default function Hero({ on }: HeroProps) {
  return (
    <header className="hero" aria-label="CERAQO Q-ARMOR — Advanced Surface Protection">
      {on && <img className="hero__bg" src={assetUrl('/poster.webp')} alt="" aria-hidden="true" />}
      <div className="hero__scrim" aria-hidden="true" />
      <div className="hero__inner">
        <div className="hero__brand wordmark">
          CERAQO<sup className="hero__tm">™</sup> <span className="hero__sep">/</span> Q-ARMOR
        </div>
        <div className="hero__kicker micro micro--cyan">Advanced Surface Protection</div>
        <h1 className="hero__title">The Future of Vehicle Protection Starts Here.</h1>
      </div>
      <div className="hero__hint" aria-hidden="true">
        <span className="micro">Scroll</span>
        <span className="hero__hint-line" />
      </div>
    </header>
  );
}
