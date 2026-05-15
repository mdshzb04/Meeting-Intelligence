import type { NextRequest } from "next/server";

export const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export function backendHeaders(request: NextRequest): HeadersInit {
  const auth = request.headers.get("authorization");
  return auth ? { Authorization: auth } : {};
}

export function backendFetch(
  request: NextRequest,
  path: string,
  init?: RequestInit
) {
  return fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      ...backendHeaders(request),
      ...(init?.headers as Record<string, string>),
    },
  });
}
