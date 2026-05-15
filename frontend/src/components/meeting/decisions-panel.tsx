"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { useDecisions, useUpdateDecision } from "@/hooks/use-decisions";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const nextDecisionStatus: Record<string, string> = {
  pending: "in_progress",
  in_progress: "implemented",
  implemented: "pending",
};

export function DecisionsPanel({ meetingId }: { meetingId: string }) {
  const { data, isLoading } = useDecisions(meetingId);
  const updateDecision = useUpdateDecision(meetingId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full animate-shimmer" />
        ))}
      </div>
    );
  }

  if (!data || data.decisions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[13px] text-[#555]">No decisions recorded</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex gap-4 text-[11px] text-[#555]">
        <span>{data.total} total</span>
        <span>{data.implemented} implemented</span>
        <span>{data.in_progress} in progress</span>
        <span>{data.pending} pending</span>
      </div>

      {/* Decision list */}
      <div className="border border-[#1f1f1f] rounded-lg overflow-hidden divide-y divide-[#1f1f1f]">
        {data.decisions.map((decision, i) => (
          <motion.div
            key={decision.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.02 }}
            className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-[#0a0a0a] transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-[#ededed] truncate">{decision.decision_text}</p>
              {decision.notes && (
                <p className="text-[11px] text-[#444] mt-0.5 truncate">{decision.notes}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={decision.implementation_status} />
              <button
                onClick={() => {
                  const newStatus = nextDecisionStatus[decision.implementation_status] || "pending";
                  updateDecision.mutate(
                    {
                      decisionId: decision.id,
                      updates: { implementation_status: newStatus as "pending" | "in_progress" | "implemented" },
                    },
                    { onSuccess: () => toast.success("Decision updated") }
                  );
                }}
                className="p-1 rounded hover:bg-[#1a1a1a] transition-colors text-[#555] hover:text-[#888]"
              >
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
