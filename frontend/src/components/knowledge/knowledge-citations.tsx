"use client";

import type { KnowledgeCitation } from "@/lib/api";

export function KnowledgeCitations({ citations }: { citations: KnowledgeCitation[] }) {
  if (!citations.length) return null;

  return (
    <div className="mt-2 pt-2 border-t border-border space-y-1.5">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        Sources
      </p>
      {citations.map((c, i) => (
        <div key={`${c.document_id}-${i}`} className="text-[11px] text-muted-foreground">
          <span className="text-foreground font-medium">{c.label}</span>
          {c.excerpt && <p className="mt-0.5 line-clamp-2">{c.excerpt}</p>}
        </div>
      ))}
    </div>
  );
}
