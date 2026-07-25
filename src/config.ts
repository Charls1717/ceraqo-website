/**
 * Commerce configuration.
 *
 * PREORDER_URL is the single switch between the email-reservation
 * fallback and a real checkout. Every "Pre-order — €169" control on
 * the site (the floating pill and the button in the Batch section)
 * reads this one value:
 *
 *   - '' (empty — the current state): buttons scroll to / submit the
 *     Batch 001 email-reservation form. No store required.
 *   - Once the Shopify store is ready (product added, domain
 *     connected, payments enabled — set up separately in Shopify),
 *     paste the product or checkout URL below, e.g.
 *       export const PREORDER_URL = 'https://shop.ceraqo.com/products/q-armor';
 *     and every pre-order control becomes a direct link to it.
 *     That is the entire migration — one line, no other code changes.
 *
 * The URL can also be injected at build time without touching source:
 *   VITE_PREORDER_URL=https://... npm run build
 * (An explicit value here wins over the empty default; the env var
 * wins over everything when set.)
 */
export const PREORDER_URL: string =
  (import.meta.env.VITE_PREORDER_URL as string | undefined) ?? '';
