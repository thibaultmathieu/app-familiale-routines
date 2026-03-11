/** Prefix a public asset path with the Vite base URL so it works on GitHub Pages. */
export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL // '/' in dev, '/app-familiale-routines/' in prod
  // Avoid double slashes
  if (path.startsWith('/')) {
    return base.endsWith('/') ? base + path.slice(1) : base + path
  }
  return base + path
}
