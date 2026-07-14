/**
 * Prefixes a public-folder path with Vite's configured base so runtime-built
 * URLs (frame sequences, stills) work when the site is hosted under a
 * subpath (e.g. GitHub Pages project sites) as well as at a domain root.
 */
export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
