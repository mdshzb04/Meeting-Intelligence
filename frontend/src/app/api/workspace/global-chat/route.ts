import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-fetch";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await backendFetch(request, "/api/workspace/global-chat", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(120_000),
    });
    const data = await res.json().catch(() => ({
      error: res.ok ? "Invalid response" : `Backend error (${res.status})`,
    }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Backend service unavailable" }, { status: 503 });
  }
}
