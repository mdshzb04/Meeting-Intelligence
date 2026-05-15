"use client";

import Link from "next/link";
import { Check, Circle, Clock } from "lucide-react";
import { useAllDecisions } from "@/hooks/use-workspace";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { DECISION_GROUPS, StatusGroupColumn } from "@/components/meeting/status-groups";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const nextStatus: Record<string, string> = {
  pending: "in_progress",
  in_progress: "implemented",
  implemented: "pending",
};

export function AllDecisionsBoard() {
  const { decisions, isLoading, meetings } = useAllDecisions();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["meetings", "completed"] });
    meetings.forEach((m) => {
      queryClient.invalidateQueries({ queryKey: ["decisions", m.id] });
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full animate-shimmer" />
        ))}
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <p className="text-[13px] text-muted-foreground text-center py-12 border border-border rounded-lg">
        No completed meetings yet.
      </p>
    );
  }

  if (decisions.length === 0) {
    return (
      <p className="text-[13px] text-muted-foreground text-center py-12 border border-border rounded-lg">
        No decisions across your meetings yet.
      </p>
    );
  }

  const byStatus = (status: string) =>
    decisions.filter((d) => d.implementation_status === status);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {DECISION_GROUPS.map((group) => {
        const items = byStatus(group.key);
        return (
          <StatusGroupColumn
            key={group.key}
            label={group.label}
            count={items.length}
            dotClass={group.dotClass}
          >
            {items.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={async () => {
                  const newStatus = (nextStatus[d.implementation_status] ||
                    "pending") as "pending" | "in_progress" | "implemented";
                  await api.updateDecision(d.id, {
                    implementation_status: newStatus,
                  });
                  invalidate();
                  toast.success("Decision updated");
                }}
                className="w-full text-left rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">
                    {d.implementation_status === "implemented" ? (
                      <div className="h-3.5 w-3.5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-2 w-2 text-primary-foreground" />
                      </div>
                    ) : d.implementation_status === "in_progress" ? (
                      <Clock className="h-3.5 w-3.5 text-blue-400" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <p
                      className={cn(
                        "text-[12px] leading-snug text-foreground",
                        d.implementation_status === "implemented" &&
                          "text-muted-foreground"
                      )}
                    >
                      {d.decision_text}
                    </p>
                    <Link
                      href={`/meeting/${d.meeting_id}/decisions`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-[10px] text-muted-foreground hover:text-foreground"
                    >
                      {d.meeting_title}
                    </Link>
                  </span>
                </div>
              </button>
            ))}
          </StatusGroupColumn>
        );
      })}
    </div>
  );
}
