"use client";

import { Check, Circle, Clock } from "lucide-react";
import { PriorityBadge } from "@/components/shared/status-badge";
import { useTasks, useUpdateTask } from "@/hooks/use-tasks";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  WORKFLOW_GROUPS,
  StatusGroupColumn,
} from "@/components/meeting/status-groups";
import { cn } from "@/lib/utils";

const nextStatus: Record<string, string> = {
  pending: "in_progress",
  in_progress: "completed",
  completed: "pending",
};

export function ActionItemsBoard({ meetingId }: { meetingId: string }) {
  const { data, isLoading } = useTasks(meetingId);
  const updateTask = useUpdateTask(meetingId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full animate-shimmer" />
        ))}
      </div>
    );
  }

  if (!data || data.tasks.length === 0) {
    return (
      <p className="text-[13px] text-muted-foreground text-center py-8 border border-border rounded-lg">
        No action items yet
      </p>
    );
  }

  const byStatus = (status: string) =>
    data.tasks.filter((t) => t.status === status);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {WORKFLOW_GROUPS.map((group) => {
        const items = byStatus(group.key);
        return (
          <StatusGroupColumn
            key={group.key}
            label={group.label}
            count={items.length}
            dotClass={group.dotClass}
          >
            {items.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => {
                    const newStatus = nextStatus[task.status] || "pending";
                    updateTask.mutate(
                      {
                        taskId: task.id,
                        updates: {
                          status: newStatus as
                            | "pending"
                            | "in_progress"
                            | "completed",
                        },
                      },
                      { onSuccess: () => toast.success("Task updated") }
                    );
                  }}
                  className="shrink-0 mt-0.5 hover:scale-110 transition-transform"
                  aria-label="Cycle status"
                >
                  {task.status === "completed" ? (
                    <div className="h-3.5 w-3.5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-2 w-2 text-primary-foreground" />
                    </div>
                  ) : task.status === "in_progress" ? (
                    <Clock className="h-3.5 w-3.5 text-blue-400" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-[12px] leading-snug",
                      task.status === "completed"
                        ? "line-through text-muted-foreground"
                        : "text-foreground"
                    )}
                  >
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                      {task.description}
                    </p>
                  )}
                  <div className="mt-1">
                    <PriorityBadge priority={task.priority} />
                  </div>
                </div>
              </div>
            ))}
          </StatusGroupColumn>
        );
      })}
    </div>
  );
}
