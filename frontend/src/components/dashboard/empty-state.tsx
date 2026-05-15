"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import Link from "next/link";
import { MeetingMindLogo } from "@/components/icons/meetingmind-logo";

export function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <MeetingMindLogo size="lg" className="mb-6" />

      <h3 className="text-[15px] font-medium text-[#ededed] mb-1.5">
        No meetings yet
      </h3>
      <p className="text-[13px] text-[#555] max-w-sm mb-6 leading-relaxed">
        Upload a meeting recording or paste a transcript to get AI-powered
        summaries, action items, and intelligent chat.
      </p>

      <Link href="/new">
        <button className="inline-flex items-center gap-2 rounded-md bg-white text-black text-[13px] font-medium px-4 py-2 hover:bg-[#e0e0e0] transition-colors">
          <Plus className="h-3.5 w-3.5" />
          New Meeting
        </button>
      </Link>
    </motion.div>
  );
}
