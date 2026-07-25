import type Lenis from 'lenis';
import { PREORDER_URL } from '../config';

/**
 * The persistent pre-order pill: fixed top-right (bottom-right on
 * phones), visible from the first viewport to the footer. The wrapper
 * is pointer-transparent so it can never eat a scroll gesture — only
 * the control itself is clickable — and it sits above the HUD but
 * below the loader.
 *
 * With PREORDER_URL unset it scrolls to the Batch 001 reservation
 * form; once the Shopify URL is configured (see src/config.ts) it
 * becomes a direct checkout link.
 */
export default function PreorderCta({ on }: { on: boolean }) {
  const jump = () => {
    // The consumer pre-order block sits right after the price
    // comparison — the bottom of the page is the partnership form.
    const el = document.getElementById('s-preorder');
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 24;
    const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
    if (lenis) lenis.scrollTo(top, { duration: 1.8 });
    else window.scrollTo(0, top);
  };
  return (
    <div className="cta" data-on={on ? 'true' : 'false'}>
      {PREORDER_URL ? (
        <a
          className="cta__btn"
          href={PREORDER_URL}
          target="_blank"
          rel="noopener"
          aria-label="Pre-order Q-ARMOR, 169 euro"
        >
          Pre-order — <span className="cta__price">€169</span>
        </a>
      ) : (
        <button type="button" className="cta__btn" onClick={jump} aria-label="Pre-order Q-ARMOR, 169 euro">
          Pre-order — <span className="cta__price">€169</span>
        </button>
      )}
      {/* Sublabel doubles as payment microcopy once checkout is live;
          while the fallback form is active it must not promise a
          charge that can't happen yet. */}
      <span className="cta__batch micro" aria-hidden="true">
        {PREORDER_URL ? 'Batch 001 · charged at checkout' : 'Batch 001 · 20,000 bottles'}
      </span>
    </div>
  );
}
