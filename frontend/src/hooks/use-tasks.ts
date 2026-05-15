"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Task } from "@/lib/api";

export function useTasks(meetingId: string) {
  return useQuery({
    queryKey: ["tasks", meetingId],
    queryFn: () => api.getMeetingTasks(meetingId),
    enabled: !!meetingId,
  });
}

export function useUpdateTask(meetingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      updates,
    }: {
      taskId: string;
      updates: Partial<Pick<Task, "status" | "title" | "description" | "priority">>;
    }) => api.updateTask(taskId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", meetingId] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  });
}
