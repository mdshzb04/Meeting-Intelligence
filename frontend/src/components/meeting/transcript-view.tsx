"use client";

import { useTranscript } from "@/hooks/use-meetings";
import { Skeleton } from "@/components/ui/skeleton";

export function TranscriptView({ meetingId }: { meetingId: string }) {
  const { data, isLoading } = useTranscript(meetingId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full animate-shimmer" />
        ))}
      </div>
    );
  }

  if (!data?.full_text) {
    return (
      <div className="text-center py-12">
        <p className="text-[13px] text-[#555]">No transcript available</p>
      </div>
    );
  }

  return (
    <div className="border border-[#1f1f1f] rounded-lg overflow-hidden">
      <div className="max-h-[480px] overflow-y-auto p-5">
        {data.full_text.split("\n").map((paragraph, i) => (
          <p key={i} className="text-[13px] text-[#aaa] leading-relaxed mb-2.5 font-mono">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}
