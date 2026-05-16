import type { NextRequest } from "next/server";
import { backendApiUrl, getServerBackendUrl } from "@/lib/server-backend-url";

export { getServerBackendUrl };

export function backendHeaders(request: NextRequest): HeadersInit {
  const auth = request.headers.get("authorization");
  return auth ? { Authorization: auth } : {};
}

export function backendFetch(
  request: NextRequest,
  path: string,
  init?: RequestInit
) {
  return fetch(backendApiUrl(path), {
    ...init,
    headers: {
      ...backendHeaders(request),
      ...(init?.headers as Record<string, string>),
    },
  });
}
