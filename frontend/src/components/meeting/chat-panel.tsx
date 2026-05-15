"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { useChatHistory, useSendMessage } from "@/hooks/use-chat";
import { Skeleton } from "@/components/ui/skeleton";
import { ChatCitations } from "@/components/meeting/chat-citations";

export function ChatPanel({ meetingId }: { meetingId: string }) {
  const { data, isLoading } = useChatHistory(meetingId);
  const sendMessage = useSendMessage(meetingId);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [data?.messages, sendMessage.isPending]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || sendMessage.isPending) return;
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

  const messages = data?.messages || [];

  return (
    <div className="flex flex-col h-[480px] border border-[#1f1f1f] rounded-lg overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
        {messages.length === 0 && !sendMessage.isPending && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#1f1f1f] bg-[#0a0a0a] mb-3">
              <Bot className="h-4 w-4 text-[#555]" />
            </div>
            <p className="text-[13px] text-[#888] mb-0.5">Chat with meeting memory</p>
            <p className="text-[11px] text-[#444] max-w-xs">
              Ask about this meeting or any past meeting. Answers include cited sources.
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
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#1f1f1f] bg-[#0a0a0a] mt-0.5">
                    <Bot className="h-3 w-3 text-[#888]" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-[13px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-white text-black"
                      : "bg-[#0a0a0a] border border-[#1f1f1f] text-[#ccc]"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.role === "assistant" &&
                    msg.citations &&
                    msg.citations.length > 0 && (
                      <ChatCitations citations={msg.citations} />
                    )}
                </div>
                {msg.role === "user" && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white mt-0.5">
                    <User className="h-3 w-3 text-black" />
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
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#1f1f1f] bg-[#0a0a0a] mt-0.5">
                <Bot className="h-3 w-3 text-[#888]" />
              </div>
              <div className="bg-[#0a0a0a] border border-[#1f1f1f] rounded-lg px-3 py-2 flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin text-[#555]" />
                <span className="text-[12px] text-[#555]">Thinking...</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {sendMessage.isError && (
        <div className="px-4 py-2 border-t border-destructive/30 bg-destructive/10">
          <p className="text-[12px] text-destructive">
            {(sendMessage.error as Error)?.message ||
              "Chat failed. Is the backend running on port 8000?"}
          </p>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-[#1f1f1f] p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about any meeting, actions, or decisions..."
            disabled={sendMessage.isPending}
            className="flex-1 px-3 py-1.5 text-[13px] bg-[#0a0a0a] border border-[#1f1f1f] rounded-md text-[#ededed] placeholder:text-[#333] focus:outline-none focus:border-[#333] transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || sendMessage.isPending}
            className="px-3 py-1.5 rounded-md bg-white text-black hover:bg-[#e0e0e0] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
