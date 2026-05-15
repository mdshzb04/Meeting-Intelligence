"use client";

import { motion } from "framer-motion";
import { FileText, CheckCircle2, Vote, TrendingUp } from "lucide-react";
import type { MeetingListItem } from "@/lib/api";

interface StatsCardsProps {
  meetings: MeetingListItem[];
}

export function StatsCards({ meetings }: StatsCardsProps) {
  const totalMeetings = meetings.length;
  const totalTasks = meetings.reduce((sum, m) => sum + m.task_count, 0);
  const completedTasks = meetings.reduce((sum, m) => sum + m.completed_task_count, 0);
  const totalDecisions = meetings.reduce((sum, m) => sum + m.decision_count, 0);

  const stats = [
    { label: "Meetings", value: totalMeetings, icon: FileText },
    { label: "Action Items", value: totalTasks, icon: CheckCircle2 },
    { label: "Completed", value: completedTasks, icon: TrendingUp },
    { label: "Decisions", value: totalDecisions, icon: Vote },
  ];

  return (
    <div className="grid grid-cols-4 gap-px bg-[#1f1f1f] rounded-lg border border-[#1f1f1f] overflow-hidden">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
          className="bg-[#0a0a0a] p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <stat.icon className="h-3.5 w-3.5 text-[#555]" />
            <span className="text-[11px] uppercase tracking-wider text-[#555] font-medium">
              {stat.label}
            </span>
          </div>
          <p className="text-2xl font-light tracking-tight text-white">{stat.value}</p>
        </motion.div>
      ))}
    </div>
  );
}
