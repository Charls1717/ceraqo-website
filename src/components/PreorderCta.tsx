import type Lenis from 'lenis';

/**
 * The persistent pre-order pill: fixed top-right, visible from the
 * first viewport to the footer. The wrapper is pointer-transparent so
 * it can never eat a scroll gesture — only the button itself is
 * clickable — and it sits above the HUD but below the loader.
 */
export default function PreorderCta({ on }: { on: boolean }) {
  const jump = () => {
    const el = document.getElementById('s-access');
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 8;
    const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
    if (lenis) lenis.scrollTo(top, { duration: 1.8 });
    else window.scrollTo(0, top);
  };
  return (
    <div className="cta" data-on={on ? 'true' : 'false'}>
      <button type="button" className="cta__btn" onClick={jump} aria-label="Pre-order Q-ARMOR, 169 euro">
        Pre-order <span className="cta__price">€169</span>
      </button>
      <span className="cta__batch micro" aria-hidden="true">
        Batch 001 · 20,000 bottles
      </span>
    </div>
  );
}
