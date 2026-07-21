import type { DiveAssets } from '../hooks/useDivePreload';

interface HeroProps {
  assets: DiveAssets;
  /** true once the preloader is done — the background still is ready */
  on: boolean;
}

/**
 * Full-viewport opening: the product still (the same OBJECT rest frame
 * the dive begins on) under the brand block. The dive re-enters on this
 * exact frame with the instruments on — the film is a round trip.
 */
export default function Hero({ assets, on }: HeroProps) {
  return (
    <header className="hero" aria-label="CERAQO Q-ARMOR — Advanced Surface Protection">
      {on && <img className="hero__bg" src={assets.restSrc(0)} alt="" aria-hidden="true" />}
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
