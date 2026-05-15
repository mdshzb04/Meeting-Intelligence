"use client";

import Link from "next/link";
import { FileText, ListChecks, Scale, MessageSquareQuote } from "lucide-react";
import type { ChatCitation } from "@/lib/api";

const typeIcons = {
  transcript: MessageSquareQuote,
  action_item: ListChecks,
  decision: Scale,
  summary: FileText,
} as const;

export function ChatCitations({ citations }: { citations: ChatCitation[] }) {
  if (!citations.length) return null;

  return (
    <div className="mt-2 space-y-1.5 border-t border-border pt-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        Sources
      </p>
      <ul className="space-y-1">
        {citations.map((c, i) => {
          const Icon = typeIcons[c.source_type as keyof typeof typeIcons] ?? FileText;
          return (
            <li key={`${c.meeting_id}-${c.ref ?? i}`}>
              <Link
                href={`/meeting/${c.meeting_id}`}
                className="group flex gap-2 rounded-md px-2 py-1.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Icon className="h-3 w-3 shrink-0 mt-0.5 opacity-60 group-hover:opacity-100" />
                <span className="min-w-0">
                  <span className="font-medium text-foreground/80 group-hover:text-foreground">
                    {c.ref ? `[${c.ref}] ` : ""}
                    {c.label}
                  </span>
                  <span className="block truncate text-[10px] opacity-70 mt-0.5">
                    {c.excerpt}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

