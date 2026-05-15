"use client";

import { motion } from "framer-motion";
import { Check, Circle, Clock } from "lucide-react";
import { PriorityBadge } from "@/components/shared/status-badge";
import { useTasks, useUpdateTask } from "@/hooks/use-tasks";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

const nextStatus: Record<string, string> = {
  pending: "in_progress",
  in_progress: "completed",
  completed: "pending",
};

export function ActionItems({ meetingId }: { meetingId: string }) {
  const { data, isLoading } = useTasks(meetingId);
  const updateTask = useUpdateTask(meetingId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full animate-shimmer" />
        ))}
      </div>
    );
  }

  if (!data || data.tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[13px] text-[#555]">No action items found</p>
      </div>
    );
  }

  const progress = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1 rounded-full bg-[#1f1f1f] overflow-hidden">
          <div
            className="h-full rounded-full bg-white transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[11px] text-[#555] shrink-0">
          {data.completed}/{data.total}
        </span>
      </div>

      {/* Task list */}
      <div className="border border-[#1f1f1f] rounded-lg overflow-hidden divide-y divide-[#1f1f1f]">
        {data.tasks.map((task, i) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.02 }}
            className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#0a0a0a] transition-colors"
          >
            <button
              onClick={() => {
                const newStatus = nextStatus[task.status] || "pending";
                updateTask.mutate(
                  { taskId: task.id, updates: { status: newStatus as "pending" | "in_progress" | "completed" } },
                  { onSuccess: () => toast.success(`Task updated`) }
                );
              }}
              className="shrink-0 hover:scale-110 transition-transform"
            >
              {task.status === "completed" ? (
                <div className="h-4 w-4 rounded-full bg-white flex items-center justify-center">
                  <Check className="h-2.5 w-2.5 text-black" />
                </div>
              ) : task.status === "in_progress" ? (
                <Clock className="h-4 w-4 text-blue-400" />
              ) : (
                <Circle className="h-4 w-4 text-[#333]" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <span
                className={`text-[13px] block truncate ${
                  task.status === "completed" ? "line-through text-[#555]" : "text-[#ededed]"
                }`}
              >
                {task.title}
              </span>
              {task.description && (
                <span className="text-[11px] text-[#444] block truncate">{task.description}</span>
              )}
            </div>

            <PriorityBadge priority={task.priority} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
