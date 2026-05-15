"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMeetingReady } from "@/components/meeting/meeting-header";
import { MeetingProcessingState } from "@/components/meeting/meeting-processing-state";
import { SummaryPanel } from "@/components/meeting/summary-panel";
import { TranscriptView } from "@/components/meeting/transcript-view";

export default function MeetingOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { meeting, isLoading, error, isCompleted, isProcessing, isFailed } =
    useMeetingReady(id);

  useEffect(() => {
    if (isCompleted) {
      router.replace(`/meeting/${id}/chat`);
    }
  }, [isCompleted, id, router]);

  if (isLoading || isCompleted) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !meeting) return null;

  if (isProcessing || isFailed) {
    return (
      <MeetingProcessingState
        meetingId={id}
        status={isFailed ? "failed" : "processing"}
        title={meeting.title}
      />
    );
  }

  return (
    <Tabs defaultValue="summary" className="space-y-5">
      <TabsList className="bg-transparent border border-border rounded-md p-0.5 h-auto">
        <TabsTrigger
          value="summary"
          className="text-[12px] px-3 py-1 rounded-[4px] text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-medium"
        >
          Summary
        </TabsTrigger>
        <TabsTrigger
          value="transcript"
          className="text-[12px] px-3 py-1 rounded-[4px] text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-medium"
        >
          Transcript
        </TabsTrigger>
      </TabsList>
      <TabsContent value="summary">
        <SummaryPanel meeting={meeting} />
      </TabsContent>
      <TabsContent value="transcript">
        <TranscriptView meetingId={id} />
      </TabsContent>
    </Tabs>
  );
}
