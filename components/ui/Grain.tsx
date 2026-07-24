/**
 * Fine animated film grain over the whole experience — the cheapest
 * ingredient of the "shot on film, not rendered" feel. Pure CSS
 * (see .grain in globals.css); the shift animation pauses itself under
 * prefers-reduced-motion via media query.
 */
export default function Grain() {
  return <div className="grain" aria-hidden />;
}
