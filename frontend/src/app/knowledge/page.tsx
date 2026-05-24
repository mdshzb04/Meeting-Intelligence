"use client";

import { Loader2, FileText, Layers, Database, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { KnowledgeUpload } from "@/components/knowledge/knowledge-upload";
import { KnowledgeDocumentList } from "@/components/knowledge/knowledge-document-list";
import { KnowledgeChatPanel } from "@/components/knowledge/knowledge-chat-panel";
import { useKnowledgeDocuments } from "@/hooks/use-knowledge";
import { api } from "@/lib/api";

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 flex items-start gap-3">
      <div className="text-primary mt-0.5">{icon}</div>
      <div>
        <p className="text-[22px] font-semibold text-foreground leading-none">{value}</p>
        <p className="text-[12px] text-muted-foreground mt-1">{label}</p>
        {sub && <p className="text-[11px] text-muted-foreground/70 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function KnowledgePage() {
  const { data, isLoading } = useKnowledgeDocuments();
  const hasReadyDocs = (data?.documents ?? []).some((d) => d.status === "ready");

  const { data: stats } = useQuery({
    queryKey: ["workspace-stats"],
    queryFn: () => api.getWorkspaceStats(),
    refetchInterval: 15_000,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="heading-lg">Knowledge Base</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Upload documents and chat with AI over your org knowledge — separate from meeting memory.
        </p>
      </div>

      {/* Ingestion Dashboard */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon={<FileText className="h-4 w-4" />}
            label="Documents"
            value={stats.documents.total}
            sub={`${stats.documents.ready} ready · ${stats.documents.processing} processing`}
          />
          <StatCard
            icon={<Layers className="h-4 w-4" />}
            label="KB Chunks"
            value={stats.chunks.knowledge_docs.toLocaleString()}
            sub="indexed text segments"
          />
          <StatCard
            icon={<Database className="h-4 w-4" />}
            label="Vector Namespaces"
            value={stats.vectors.namespaces}
            sub={`~${stats.vectors.estimated_total.toLocaleString()} total vectors`}
          />
          <StatCard
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Meetings Indexed"
            value={stats.meetings.completed}
            sub="with transcript + embeddings"
          />
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,320px)_1fr]">
        <section className="space-y-4">
          <h2 className="text-[14px] font-medium text-foreground">Documents</h2>
          <KnowledgeUpload />
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <KnowledgeDocumentList />
          )}
        </section>

        <section className="space-y-4 min-w-0">
          <h2 className="text-[14px] font-medium text-foreground">Chat</h2>
          <KnowledgeChatPanel hasReadyDocs={hasReadyDocs} />
        </section>
      </div>
    </div>
  );
}
