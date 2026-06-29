import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-fetch";

export async function GET(request: NextRequest) {
  try {
    const res = await backendFetch(request, "/api/knowledge/documents", {
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Backend service unavailable" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const res = await backendFetch(request, "/api/knowledge/documents", {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(180_000),
    });
    const data = await res.json().catch(() => ({
      error: res.ok ? "Invalid response" : `Backend error (${res.status})`,
    }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Backend service unavailable" }, { status: 503 });
  }
}
