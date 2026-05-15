"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { useRetryMeeting } from "@/hooks/use-meetings";
import { toast } from "sonner";

interface MeetingProcessingStateProps {
  meetingId: string;
  status: "processing" | "failed";
  title?: string;
}

export function MeetingProcessingState({
  meetingId,
  status,
  title,
}: MeetingProcessingStateProps) {
  const retryMeeting = useRetryMeeting();

  if (status === "processing") {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card">
          <Loader2 className="h-5 w-5 animate-spin text-foreground" />
        </div>
        <h3 className="text-[14px] font-medium text-foreground mb-1">
          Processing{title ? `: ${title}` : " meeting"}
        </h3>
        <p className="text-[12px] text-muted-foreground max-w-sm">
          AI is analyzing the transcript, extracting action items, and building memory.
          You can leave this page — we&apos;ll update automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-[14px] font-medium text-destructive mb-1">Processing failed</p>
      <p className="text-[12px] text-muted-foreground mb-4 max-w-sm">
        Something went wrong during analysis. Retry if a transcript was saved, or create a
        new meeting.
      </p>
      <button
        type="button"
        disabled={retryMeeting.isPending}
        onClick={() => {
          retryMeeting.mutate(meetingId, {
            onSuccess: () => toast.success("Retry started"),
            onError: (err) =>
              toast.error(err.message || "Could not retry processing"),
          });
        }}
        className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground text-[13px] px-4 py-2 hover:opacity-90 disabled:opacity-50"
      >
        {retryMeeting.isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <RefreshCw className="h-3.5 w-3.5" />
        )}
        Retry processing
      </button>
    </div>
  );
}
