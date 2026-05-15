"use client";

import { use } from "react";
import { Loader2 } from "lucide-react";
import { useMeetingReady } from "@/components/meeting/meeting-header";
import { MeetingProcessingState } from "@/components/meeting/meeting-processing-state";
import { DecisionsBoard } from "@/components/meeting/decisions-board";

export default function MeetingDecisionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { meeting, isLoading, isCompleted, isProcessing, isFailed } = useMeetingReady(id);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isProcessing || isFailed) {
    return (
      <MeetingProcessingState
        meetingId={id}
        status={isFailed ? "failed" : "processing"}
        title={meeting?.title}
      />
    );
  }

  if (!isCompleted) return null;

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-[15px] font-medium text-foreground">Decisions</h2>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          Todo, In progress, and Done — click a decision to update status.
        </p>
      </div>
      <DecisionsBoard meetingId={id} />
    </section>
  );
}
