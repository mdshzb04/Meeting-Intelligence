/**
 * Server-side backend base URL for Next.js API route proxies.
 * Set BACKEND_URL on Vercel (preferred). NEXT_PUBLIC_API_URL is supported as a fallback.
 * Base must NOT include a trailing slash or a trailing /api (paths already start with /api/...).
 */
export function getServerBackendUrl(): string {
  const raw =
    process.env.BACKEND_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    "http://localhost:8000";

  let base = raw.replace(/\/+$/, "");
  if (base.endsWith("/api")) {
    base = base.slice(0, -4);
  }
  return base;
}

export function backendApiUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getServerBackendUrl()}${normalized}`;
}
