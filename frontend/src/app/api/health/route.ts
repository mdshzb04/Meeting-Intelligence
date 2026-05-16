import { NextResponse } from "next/server";
import { backendApiUrl } from "@/lib/server-backend-url";

export async function GET() {
  try {
    const res = await fetch(backendApiUrl("/api/health"), { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Health proxy failed:", err);
    return NextResponse.json({ error: "Backend unavailable" }, { status: 503 });
  }
}
