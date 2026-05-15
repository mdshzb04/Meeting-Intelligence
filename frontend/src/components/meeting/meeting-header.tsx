"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Trash2, Calendar, FileAudio } from "lucide-react";
import { useMeeting, useDeleteMeeting } from "@/hooks/use-meetings";
import { StatusBadge } from "@/components/shared/status-badge";
import { MeetingDetailSkeleton } from "@/components/shared/loading-skeleton";
import { toast } from "sonner";

function formatFullDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MeetingHeader({ meetingId }: { meetingId: string }) {
  const router = useRouter();
  const { data: meeting, isLoading, error } = useMeeting(meetingId);
  const deleteMeeting = useDeleteMeeting();

  if (isLoading) return <MeetingDetailSkeleton />;

  if (error || !meeting) {
    return (
      <div className="text-center py-24">
        <p className="text-[13px] text-destructive mb-3">Meeting not found</p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-[13px] text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this meeting?")) {
      deleteMeeting.mutate(meetingId, {
        onSuccess: () => {
          toast.success("Meeting deleted");
          router.push("/");
        },
        onError: () => toast.error("Failed to delete meeting"),
      });
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="shrink-0 p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-[18px] font-medium text-foreground tracking-tight truncate">
              {meeting.title}
            </h1>
            <StatusBadge status={meeting.status} />
          </div>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatFullDate(meeting.created_at)}
            </span>
            {meeting.audio_filename && (
              <span className="flex items-center gap-1">
                <FileAudio className="h-3 w-3" />
                {meeting.audio_filename}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          className="shrink-0 p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

export function useMeetingReady(meetingId: string) {
  const { data: meeting, isLoading, error } = useMeeting(meetingId);
  const status = meeting?.status;
  return {
    meeting,
    isLoading,
    error,
    isCompleted: status === "completed",
    isProcessing: status === "processing",
    isFailed: status === "failed",
  };
}
