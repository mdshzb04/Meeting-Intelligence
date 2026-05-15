"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useCompletedMeetings } from "@/hooks/use-workspace";
import { ChatPanel } from "@/components/meeting/chat-panel";

export default function WorkspaceChatPage() {
  const router = useRouter();
  const { data: meetings, isLoading } = useCompletedMeetings();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (meetings?.length && !selectedId) {
      setSelectedId(meetings[0].id);
    }
  }, [meetings, selectedId]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!meetings?.length) {
    return (
      <div className="text-center py-16 border border-border rounded-lg">
        <p className="text-[14px] text-foreground mb-2">No meetings yet</p>
        <p className="text-[13px] text-muted-foreground mb-4">
          Create a meeting to use memory chat.
        </p>
        <Link
          href="/new"
          className="inline-flex rounded-md bg-primary text-primary-foreground text-[13px] px-4 py-2 hover:opacity-90"
        >
          New Meeting
        </Link>
      </div>
    );
  }

  const selected = meetings.find((m) => m.id === selectedId) ?? meetings[0];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="heading-lg">Memory chat</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Chat with memory across all your meetings.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12px] text-muted-foreground">Meeting:</span>
        <select
          value={selected.id}
          onChange={(e) => setSelectedId(e.target.value)}
          className="text-[13px] bg-card border border-border rounded-md px-3 py-1.5 text-foreground focus:outline-none focus:border-ring"
        >
          {meetings.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => router.push(`/meeting/${selected.id}/chat`)}
          className="text-[12px] text-muted-foreground hover:text-foreground underline"
        >
          Open full meeting view
        </button>
      </div>

      <ChatPanel meetingId={selected.id} />
    </div>
  );
}
