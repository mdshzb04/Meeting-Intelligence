"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "border-[#333] text-[#888] bg-transparent" },
  in_progress: { label: "In Progress", className: "border-blue-500/30 text-blue-400 bg-blue-500/5" },
  completed: { label: "Completed", className: "border-emerald-500/30 text-emerald-400 bg-emerald-500/5" },
  implemented: { label: "Implemented", className: "border-emerald-500/30 text-emerald-400 bg-emerald-500/5" },
  processing: { label: "Processing", className: "border-amber-500/30 text-amber-400 bg-amber-500/5" },
  failed: { label: "Failed", className: "border-red-500/30 text-red-400 bg-red-500/5" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || {
    label: status,
    className: "border-[#333] text-[#888] bg-transparent",
  };

  return (
    <Badge variant="outline" className={cn("text-[11px] font-medium px-2 py-0 h-5", config.className)}>
      {config.label}
    </Badge>
  );
}

const priorityConfig: Record<string, { label: string; className: string }> = {
  high: { label: "High", className: "border-red-500/30 text-red-400 bg-red-500/5" },
  medium: { label: "Medium", className: "border-[#333] text-[#888] bg-transparent" },
  low: { label: "Low", className: "border-[#222] text-[#555] bg-transparent" },
};

export function PriorityBadge({ priority }: { priority: string }) {
  const config = priorityConfig[priority] || {
    label: priority,
    className: "border-[#333] text-[#888] bg-transparent",
  };

  return (
    <Badge variant="outline" className={cn("text-[11px] font-medium px-2 py-0 h-5", config.className)}>
      {config.label}
    </Badge>
  );
}
