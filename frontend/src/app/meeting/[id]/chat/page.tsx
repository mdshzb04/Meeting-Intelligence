"use client";

import { use } from "react";
import { Loader2 } from "lucide-react";
import { useMeetingReady } from "@/components/meeting/meeting-header";
import { MeetingProcessingState } from "@/components/meeting/meeting-processing-state";
import { ChatPanel } from "@/components/meeting/chat-panel";

export default function MeetingChatPage({
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

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-[15px] font-medium text-foreground">Memory chat</h2>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          Ask about {meeting?.title ?? "this meeting"} or any past meeting.
        </p>
      </div>
      <ChatPanel meetingId={id} />
    </section>
  );
}
