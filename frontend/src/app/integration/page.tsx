"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, ExternalLink, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

const TRACED_AGENTS = [
  { label: "Meeting analyzer", desc: "Summaries, action items, and decisions from transcripts" },
  { label: "Audio transcriber", desc: "Whisper transcription for uploaded or live audio" },
  { label: "Embedding generator", desc: "Vector embeddings for semantic search" },
  { label: "Meeting chat", desc: "RAG chat over meeting memory" },
  { label: "Knowledge chat", desc: "RAG chat over uploaded documents" },
  { label: "Workspace chat", desc: "Unified chat across meetings and knowledge base" },
];

export default function IntegrationPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["integrations", "traceplane"],
    queryFn: () => api.getTraceplaneIntegration(),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const dashboardUrl = data?.dashboard_url ?? "https://traceplane.shazeb.site";

  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <h1 className="heading-lg">Observability</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          AI traces, costs, and latency are sent to Traceplane automatically.
        </p>
      </div>

      <section className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h2 className="text-[14px] font-medium text-foreground">Traceplane</h2>
            </div>
            <p className="text-[12px] text-muted-foreground mt-1">
              Every OpenAI call in MeetingMind is instrumented and visible in your Traceplane
              dashboard.
            </p>
          </div>
          <span
            className={`shrink-0 inline-flex items-center gap-1.5 rounded-full text-[11px] font-medium px-2.5 py-1 border ${
              data?.configured
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                data?.configured ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            {data?.configured ? "Connected" : "Not configured"}
          </span>
        </div>

        {data?.base_url && (
          <p className="text-[12px] text-muted-foreground">
            Endpoint:{" "}
            <span className="text-foreground font-mono text-[11px]">{data.base_url}</span>
          </p>
        )}

        <a
          href={dashboardUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground text-[13px] font-medium px-4 py-2 hover:opacity-90"
        >
          Open Traceplane dashboard
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </section>

      <section className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div>
          <h2 className="text-[14px] font-medium text-foreground">Traced agents</h2>
          <p className="text-[12px] text-muted-foreground mt-1">
            These AI workflows report telemetry on every run.
          </p>
        </div>

        <ul className="space-y-2.5">
          {TRACED_AGENTS.map((agent) => (
            <li key={agent.label} className="flex items-start gap-3">
              <Activity className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-[13px] text-foreground font-medium">{agent.label}</p>
                <p className="text-[12px] text-muted-foreground">{agent.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
