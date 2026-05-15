import type { NextRequest } from "next/server";

export function proxyAuthHeaders(request: NextRequest): HeadersInit {
  const auth = request.headers.get("authorization");
  return auth ? { Authorization: auth } : {};
}
