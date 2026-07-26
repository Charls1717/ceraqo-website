/**
 * Commerce configuration.
 *
 * PREORDER_URL is the single switch between the "pre-orders open
 * shortly" state and a live checkout. Every "Pre-order — €169"
 * control on the site reads this one value:
 *
 *   - '' (empty — the current state): buttons render the disabled
 *     "opens shortly" state.
 *   - Set to a product/checkout URL and every pre-order control
 *     becomes a direct link to it. That is the entire migration.
 *
 * Three ways to set it, in ascending precedence:
 *   1. Edit the fallback below in source.
 *   2. Build-time env var:  VITE_PREORDER_URL=https://... npm run build
 *   3. Runtime global — FOR SHOPIFY: set it in the page template
 *      BEFORE the app's <script> tag loads, e.g.
 *        <script>window.QARMOR_PREORDER_URL = '/products/q-armor';</script>
 *      No rebuild needed; a relative /products/... URL resolves to
 *      the shop's own product page.
 */
declare global {
  interface Window {
    QARMOR_PREORDER_URL?: string;
  }
}

export const PREORDER_URL: string =
  (typeof window !== 'undefined' ? window.QARMOR_PREORDER_URL : undefined) ??
  (import.meta.env.VITE_PREORDER_URL as string | undefined) ??
  '';
