/**
 * Runtime asset resolution.
 *
 * Default (GitHub Pages / any static host): public-folder paths are
 * prefixed with Vite's configured base, preserving the nested layout
 * (/frames/desktop/f0001.webp, /poster.webp, ...).
 *
 * Shopify mode: Shopify's Files library is a FLAT namespace — no
 * folders — so the page template sets `window.QARMOR_ASSET_BASE` to
 * the shop's Files CDN prefix and every nested path is flattened to a
 * unique name with the same deterministic rule used when the files
 * were exported:
 *
 *   /frames/desktop/f0001.webp  ->  qa-frames-desktop-f0001.webp
 *   /frames/stills/z3.webp      ->  qa-frames-stills-z3.webp
 *   /poster.webp                ->  qa-poster.webp
 *
 * (scripts/build-shopify-package.sh applies the identical rule when
 * renaming the files for upload, so the two sides can never drift.)
 */

declare global {
  interface Window {
    /** Shopify Files CDN prefix, e.g. https://cdn.shopify.com/s/files/1/…/files/ */
    QARMOR_ASSET_BASE?: string;
  }
}

/** The flat-name rule shared with the Shopify export script. */
export function flatAssetName(path: string): string {
  return `qa-${path.replace(/^\//, '').replace(/\//g, '-')}`;
}

export function assetUrl(path: string): string {
  const cdn = typeof window !== 'undefined' ? window.QARMOR_ASSET_BASE : undefined;
  if (cdn) {
    return `${cdn.replace(/\/$/, '')}/${flatAssetName(path)}`;
  }
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
