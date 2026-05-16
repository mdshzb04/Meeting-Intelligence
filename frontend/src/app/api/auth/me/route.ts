import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-fetch";

export async function GET(request: NextRequest) {
  try {
    const res = await backendFetch(request, "/api/auth/me", { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Auth me proxy failed:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 503 });
  }
}
