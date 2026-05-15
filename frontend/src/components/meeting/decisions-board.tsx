"use client";

import { Circle, Clock, Check } from "lucide-react";
import { useDecisions, useUpdateDecision } from "@/hooks/use-decisions";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  DECISION_GROUPS,
  StatusGroupColumn,
} from "@/components/meeting/status-groups";
import { cn } from "@/lib/utils";

const nextDecisionStatus: Record<string, string> = {
  pending: "in_progress",
  in_progress: "implemented",
  implemented: "pending",
};

export function DecisionsBoard({ meetingId }: { meetingId: string }) {
  const { data, isLoading } = useDecisions(meetingId);
  const updateDecision = useUpdateDecision(meetingId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full animate-shimmer" />
        ))}
      </div>
    );
  }

  if (!data || data.decisions.length === 0) {
    return (
      <p className="text-[13px] text-muted-foreground text-center py-8 border border-border rounded-lg">
        No decisions recorded yet
      </p>
    );
  }

  const byStatus = (status: string) =>
    data.decisions.filter((d) => d.implementation_status === status);

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
            {items.map((decision) => (
              <button
                key={decision.id}
                type="button"
                onClick={() => {
                  const newStatus =
                    nextDecisionStatus[decision.implementation_status] ||
                    "pending";
                  updateDecision.mutate(
                    {
                      decisionId: decision.id,
                      updates: {
                        implementation_status: newStatus as
                          | "pending"
                          | "in_progress"
                          | "implemented",
                      },
                    },
                    { onSuccess: () => toast.success("Decision updated") }
                  );
                }}
                className="w-full text-left flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors"
              >
                <span className="shrink-0 mt-0.5">
                  {decision.implementation_status === "implemented" ? (
                    <div className="h-3.5 w-3.5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-2 w-2 text-primary-foreground" />
                    </div>
                  ) : decision.implementation_status === "in_progress" ? (
                    <Clock className="h-3.5 w-3.5 text-blue-400" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </span>
                <span className="min-w-0">
                  <p
                    className={cn(
                      "text-[12px] leading-snug",
                      decision.implementation_status === "implemented"
                        ? "text-muted-foreground"
                        : "text-foreground"
                    )}
                  >
                    {decision.decision_text}
                  </p>
                  {decision.notes && (
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                      {decision.notes}
                    </p>
                  )}
                </span>
              </button>
            ))}
          </StatusGroupColumn>
        );
      })}
    </div>
  );
}
