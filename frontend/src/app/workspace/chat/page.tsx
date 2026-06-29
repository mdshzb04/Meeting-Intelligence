"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, Globe, FileText, Brain } from "lucide-react";
import Link from "next/link";
import { useCompletedMeetings } from "@/hooks/use-workspace";
import { ChatPanel } from "@/components/meeting/chat-panel";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Mode = "meetings" | "knowledge" | "everything";

const MODES: { value: Mode; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: "meetings", label: "Meetings", icon: <Brain className="h-3.5 w-3.5" />, desc: "Chat across all your meeting transcripts, summaries, and action items" },
  { value: "knowledge", label: "Documents", icon: <FileText className="h-3.5 w-3.5" />, desc: "Chat across your uploaded knowledge base documents" },
  { value: "everything", label: "Everything", icon: <Globe className="h-3.5 w-3.5" />, desc: "Unified search across meetings + documents" },
];

interface GlobalMessage { role: "user" | "assistant"; content: string; citations?: Record<string, unknown>[] }

function GlobalChatPanel({ mode }: { mode: Mode }) {
  const [messages, setMessages] = useState<GlobalMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { setError(null); setMessages([]); }, [mode]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setError(null);
    setMessages((m) => [...m, { role: "user", content: q }]);
    setLoading(true);
    try {
      const res = await api.globalChat(q, mode);
      setMessages((m) => [...m, { role: "assistant", content: res.answer, citations: res.citations }]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Chat request failed";
      setError(msg);
      setMessages((m) => [...m, { role: "assistant", content: `Error: ${msg}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[520px] rounded-lg border border-border bg-card">
      {error && (
        <div className="px-4 py-2 border-b border-destructive/30 bg-destructive/10">
          <p className="text-[12px] text-destructive">{error}</p>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-[13px] text-muted-foreground text-center mt-8">
            Ask anything across your {mode === "everything" ? "meetings and documents" : mode}.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn(
              "max-w-[85%] rounded-lg px-3 py-2 text-[13px]",
              m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
            )}>
              <p className="whitespace-pre-wrap">{m.content}</p>
              {m.citations && m.citations.length > 0 && (
                <p className="text-[11px] mt-1 opacity-60">{m.citations.length} source{m.citations.length !== 1 ? "s" : ""} cited</p>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-border p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask anything…"
          className="flex-1 bg-background border border-border rounded-md px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          className="inline-flex items-center justify-center h-9 w-9 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function WorkspaceChatPage() {
  const router = useRouter();
  const { data: meetings, isLoading } = useCompletedMeetings();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("everything");

  useEffect(() => {
    if (meetings?.length && !selectedId) setSelectedId(meetings[0].id);
  }, [meetings, selectedId]);

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  const selected = meetings?.find((m) => m.id === selectedId) ?? meetings?.[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="heading-lg">Workspace Chat</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Ask questions across your meetings and documents.
        </p>
      </div>

      {/* Mode selector */}
      <div className="flex gap-2 flex-wrap">
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
              mode === m.value
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
            )}
          >
            {m.icon}
            {m.label}
          </button>
        ))}
      </div>
      <p className="text-[12px] text-muted-foreground -mt-3">
        {MODES.find((m) => m.value === mode)?.desc}
      </p>

      {/* Global chat for knowledge/everything; meeting selector for meetings */}
      {mode === "meetings" && !meetings?.length ? (
        <div className="text-center py-16 border border-border rounded-lg">
          <p className="text-[14px] text-foreground mb-2">No meetings yet</p>
          <Link href="/new" className="inline-flex rounded-md bg-primary text-primary-foreground text-[13px] px-4 py-2 hover:opacity-90">
            New Meeting
          </Link>
        </div>
      ) : mode === "meetings" && selected ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] text-muted-foreground">Focus meeting:</span>
            <select
              value={selected.id}
              onChange={(e) => setSelectedId(e.target.value)}
              className="text-[13px] bg-card border border-border rounded-md px-3 py-1.5 text-foreground focus:outline-none focus:border-ring"
            >
              {meetings?.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
            <button onClick={() => router.push(`/meeting/${selected.id}/chat`)} className="text-[12px] text-muted-foreground hover:text-foreground underline">
              Open full view
            </button>
          </div>
          <ChatPanel meetingId={selected.id} />
        </div>
      ) : (
        <GlobalChatPanel mode={mode} />
      )}
    </div>
  );
}
