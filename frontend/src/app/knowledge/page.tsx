"use client";

import { Loader2 } from "lucide-react";
import { KnowledgeUpload } from "@/components/knowledge/knowledge-upload";
import { KnowledgeDocumentList } from "@/components/knowledge/knowledge-document-list";
import { KnowledgeChatPanel } from "@/components/knowledge/knowledge-chat-panel";
import { useKnowledgeDocuments } from "@/hooks/use-knowledge";

export default function KnowledgePage() {
  const { data, isLoading } = useKnowledgeDocuments();
  const hasReadyDocs = (data?.documents ?? []).some((d) => d.status === "ready");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="heading-lg">Knowledge Base</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Upload documents and chat with AI over your org knowledge — separate from meeting memory.
        </p>
      </div>

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
