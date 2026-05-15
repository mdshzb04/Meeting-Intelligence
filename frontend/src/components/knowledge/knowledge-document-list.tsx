"use client";

import { FileText, Loader2, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  useKnowledgeDocuments,
  useDeleteKnowledgeDocument,
} from "@/hooks/use-knowledge";
import { Skeleton } from "@/components/ui/skeleton";
import type { KnowledgeDocument } from "@/lib/api";

function StatusBadge({ doc }: { doc: KnowledgeDocument }) {
  if (doc.status === "processing") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Processing
      </span>
    );
  }
  if (doc.status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-destructive" title={doc.error_message ?? undefined}>
        <AlertCircle className="h-3 w-3" />
        Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
      <CheckCircle2 className="h-3 w-3" />
      Ready · {doc.chunk_count} chunks
    </span>
  );
}

export function KnowledgeDocumentList() {
  const { data, isLoading } = useKnowledgeDocuments();
  const deleteDoc = useDeleteKnowledgeDocument();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  const docs = data?.documents ?? [];

  if (!docs.length) {
    return (
      <p className="text-[13px] text-muted-foreground py-4 text-center border border-border rounded-lg">
        No documents yet. Upload your first file above.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {docs.map((doc) => (
        <li
          key={doc.id}
          className="flex items-start gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
        >
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-foreground truncate">{doc.title}</p>
            <p className="text-[11px] text-muted-foreground truncate">{doc.filename}</p>
            <StatusBadge doc={doc} />
            {doc.status === "failed" && doc.error_message && (
              <p className="text-[11px] text-destructive/90 mt-1 line-clamp-2">{doc.error_message}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => deleteDoc.mutate(doc.id)}
            disabled={deleteDoc.isPending}
            className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
            title="Delete document"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}
