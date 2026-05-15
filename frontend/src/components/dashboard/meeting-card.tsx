"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { MeetingListItem } from "@/lib/api";

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);

  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function statusDot(status: string) {
  if (status === "completed") return "bg-emerald-500";
  if (status === "processing") return "bg-amber-500 animate-pulse";
  if (status === "failed") return "bg-red-500";
  return "bg-[#555]";
}

interface MeetingCardProps {
  meeting: MeetingListItem;
  index: number;
}

export function MeetingCard({ meeting, index }: MeetingCardProps) {
  const progress =
    meeting.task_count > 0
      ? Math.round((meeting.completed_task_count / meeting.task_count) * 100)
      : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
    >
      <Link href={`/meeting/${meeting.id}/chat`}>
        <div className="group flex items-center justify-between py-3 px-4 -mx-4 rounded-lg hover:bg-[#0a0a0a] transition-colors duration-100 cursor-pointer">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${statusDot(meeting.status)}`} />
            <div className="min-w-0 flex-1">
              <span className="text-[13px] text-[#ededed] font-medium truncate block">
                {meeting.title}
                {meeting.status === "processing" && (
                  <span className="ml-2 text-[11px] font-normal text-amber-400">
                    Processing…
                  </span>
                )}
                {meeting.status === "failed" && (
                  <span className="ml-2 text-[11px] font-normal text-red-400">
                    Failed
                  </span>
                )}
              </span>
              {meeting.summary && meeting.status === "completed" && (
                <span className="text-[12px] text-[#555] line-clamp-1 block mt-0.5">
                  {meeting.summary}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0 ml-4">
            {meeting.task_count > 0 && (
              <span className="text-[11px] text-[#555]">
                {meeting.completed_task_count}/{meeting.task_count} tasks
              </span>
            )}
            {progress !== null && (
              <div className="w-12 h-1 rounded-full bg-[#1f1f1f] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#ededed] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
            <span className="text-[11px] text-[#444] w-14 text-right">
              {formatDate(meeting.created_at)}
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-[#333] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
