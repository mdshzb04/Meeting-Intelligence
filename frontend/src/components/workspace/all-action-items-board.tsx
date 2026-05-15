"use client";

import Link from "next/link";
import { Check, Circle, Clock } from "lucide-react";
import { useAllTasks } from "@/hooks/use-workspace";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { WORKFLOW_GROUPS, StatusGroupColumn } from "@/components/meeting/status-groups";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const nextStatus: Record<string, string> = {
  pending: "in_progress",
  in_progress: "completed",
  completed: "pending",
};

export function AllActionItemsBoard() {
  const { tasks, isLoading, meetings } = useAllTasks();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["meetings", "completed"] });
    meetings.forEach((m) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", m.id] });
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full animate-shimmer" />
        ))}
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <p className="text-[13px] text-muted-foreground text-center py-12 border border-border rounded-lg">
        No completed meetings yet. Create a meeting to see action items.
      </p>
    );
  }

  if (tasks.length === 0) {
    return (
      <p className="text-[13px] text-muted-foreground text-center py-12 border border-border rounded-lg">
        No action items across your meetings yet.
      </p>
    );
  }

  const byStatus = (status: string) => tasks.filter((t) => t.status === status);

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
                className="rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const newStatus = (nextStatus[task.status] ||
                        "pending") as "pending" | "in_progress" | "completed";
                      await api.updateTask(task.id, { status: newStatus });
                      invalidate();
                      toast.success("Task updated");
                    }}
                    className="shrink-0 mt-0.5"
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
                  <div className="min-w-0 flex-1">
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
                    <Link
                      href={`/meeting/${task.meeting_id}/actions`}
                      className="text-[10px] text-muted-foreground hover:text-foreground"
                    >
                      {task.meeting_title}
                    </Link>
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
