"use client";

import { cn } from "@/lib/utils";

export const WORKFLOW_GROUPS = [
  { key: "pending", label: "Todo", dotClass: "bg-muted-foreground" },
  { key: "in_progress", label: "In progress", dotClass: "bg-blue-400" },
  { key: "completed", label: "Done", dotClass: "bg-emerald-400" },
] as const;

export const DECISION_GROUPS = [
  { key: "pending", label: "Todo", dotClass: "bg-muted-foreground" },
  { key: "in_progress", label: "In progress", dotClass: "bg-blue-400" },
  { key: "implemented", label: "Done", dotClass: "bg-emerald-400" },
] as const;

function StatusGroupHeader({
  label,
  count,
  dotClass,
}: {
  label: string;
  count: number;
  dotClass: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-2 px-1">
      <span className={cn("h-1.5 w-1.5 rounded-full", dotClass)} />
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-[10px] text-muted-foreground/70">{count}</span>
    </div>
  );
}

export function StatusGroupColumn({
  label,
  count,
  dotClass,
  children,
  emptyText = "None",
}: {
  label: string;
  count: number;
  dotClass: string;
  children: React.ReactNode;
  emptyText?: string;
}) {
  return (
    <div className="flex flex-col min-h-[4rem] rounded-lg border border-border bg-card/30 p-2">
      <StatusGroupHeader label={label} count={count} dotClass={dotClass} />
      {count === 0 ? (
        <p className="text-[11px] text-muted-foreground/60 px-1 py-2">{emptyText}</p>
      ) : (
        <div className="space-y-1">{children}</div>
      )}
    </div>
  );
}
