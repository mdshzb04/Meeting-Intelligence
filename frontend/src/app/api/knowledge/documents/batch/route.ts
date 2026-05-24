import { NextRequest, NextResponse } from "next/server";
import { backendFetch } from "@/lib/backend-fetch";

export const maxDuration = 120; // allow long multi-file uploads

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const res = await backendFetch(request, "/api/knowledge/documents/batch", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Backend service unavailable" }, { status: 503 });
  }
}
