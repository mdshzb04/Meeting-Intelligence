"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2 } from "lucide-react";
import {
  useKnowledgeChatHistory,
  useSendKnowledgeMessage,
} from "@/hooks/use-knowledge";
import { Skeleton } from "@/components/ui/skeleton";
import { KnowledgeCitations } from "@/components/knowledge/knowledge-citations";

export function KnowledgeChatPanel({ hasReadyDocs }: { hasReadyDocs: boolean }) {
  const { data, isLoading } = useKnowledgeChatHistory();
  const sendMessage = useSendKnowledgeMessage();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [data?.messages, sendMessage.isPending]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || sendMessage.isPending || !hasReadyDocs) return;
    setInput("");
    sendMessage.mutate(trimmed);
  };

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full animate-shimmer" />
        ))}
      </div>
    );
  }

  const messages = data?.messages ?? [];

  return (
    <div className="flex flex-col h-[480px] border border-border rounded-lg overflow-hidden bg-card">
      {sendMessage.isError && (
        <div className="px-4 py-2 border-b border-destructive/30 bg-destructive/10">
          <p className="text-[12px] text-destructive">
            {(sendMessage.error as Error)?.message ||
              "Chat failed. Is the backend running on port 8000?"}
          </p>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
        {messages.length === 0 && !sendMessage.isPending && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted mb-3">
              <Bot className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-[13px] text-muted-foreground mb-0.5">
              Chat with your knowledge base
            </p>
            <p className="text-[11px] text-muted-foreground/80 max-w-xs">
              {hasReadyDocs
                ? "Ask questions about your uploaded documents. Answers include cited sources."
                : "Upload and index a document to start chatting."}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role === "assistant" && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-muted mt-0.5">
                    <Bot className="h-3 w-3 text-muted-foreground" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-[13px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted border border-border text-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.role === "assistant" &&
                    msg.citations &&
                    msg.citations.length > 0 && (
                      <KnowledgeCitations citations={msg.citations} />
                    )}
                </div>
                {msg.role === "user" && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary mt-0.5">
                    <User className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {sendMessage.isPending && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-2.5"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-muted">
                <Bot className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="rounded-lg px-3 py-2 bg-muted border border-border">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="border-t border-border p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder={
            hasReadyDocs ? "Ask about your documents..." : "Index a document first..."
          }
          disabled={!hasReadyDocs || sendMessage.isPending}
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!hasReadyDocs || sendMessage.isPending || !input.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity"
        >
          {sendMessage.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
