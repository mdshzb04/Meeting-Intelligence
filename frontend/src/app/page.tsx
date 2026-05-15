"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus } from "lucide-react";
import Link from "next/link";
import { useMeetings } from "@/hooks/use-meetings";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { MeetingCard } from "@/components/dashboard/meeting-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DashboardSkeleton } from "@/components/shared/loading-skeleton";

export default function DashboardPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, error } = useMeetings(search || undefined);

  if (isLoading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="text-center py-24">
        <p className="text-[13px] text-red-400 mb-1">Failed to load meetings</p>
        <p className="text-[12px] text-[#555]">{error.message}</p>
      </div>
    );
  }

  const meetings = data?.meetings || [];
  const isEmpty = meetings.length === 0 && !search;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="heading-lg">Dashboard</h1>
          <p className="text-[13px] text-[#555] mt-1">Your meetings at a glance</p>
        </div>
        <Link href="/new">
          <button className="inline-flex items-center gap-2 rounded-md bg-white text-black text-[13px] font-medium px-3.5 py-1.5 hover:bg-[#e0e0e0] transition-colors">
            <Plus className="h-3.5 w-3.5" />
            New Meeting
          </button>
        </Link>
      </motion.div>

      {isEmpty ? (
        <EmptyState />
      ) : (
        <>
          {/* Stats */}
          <StatsCards meetings={meetings} />

          {/* Search */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="relative"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#555]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search meetings..."
              className="w-full pl-9 pr-4 py-2 text-[13px] bg-[#0a0a0a] border border-[#1f1f1f] rounded-md text-[#ededed] placeholder:text-[#444] focus:outline-none focus:border-[#333] transition-colors"
            />
          </motion.div>

          {/* Meeting list */}
          <div className="border-t border-[#1f1f1f]">
            <div className="flex items-center justify-between px-4 py-2 text-[11px] uppercase tracking-wider text-[#444]">
              <span>Meeting</span>
              <span>Date</span>
            </div>
            <div className="divide-y divide-[#0f0f0f]">
              {meetings.map((meeting, i) => (
                <MeetingCard key={meeting.id} meeting={meeting} index={i} />
              ))}
            </div>
          </div>

          {meetings.length === 0 && search && (
            <div className="text-center py-12">
              <p className="text-[13px] text-[#555]">
                No meetings found for &ldquo;{search}&rdquo;
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
