"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { api, type Task, type Decision } from "@/lib/api";

export function useCompletedMeetings() {
  return useQuery({
    queryKey: ["meetings", "completed"],
    queryFn: async () => {
      const { meetings } = await api.listMeetings(undefined, 100, 0);
      return meetings.filter((m) => m.status === "completed");
    },
  });
}

export function useAllTasks() {
  const { data: meetings, isLoading: meetingsLoading } = useCompletedMeetings();

  const taskQueries = useQueries({
    queries: (meetings ?? []).map((m) => ({
      queryKey: ["tasks", m.id],
      queryFn: () => api.getMeetingTasks(m.id),
      enabled: !!m.id,
    })),
  });

  const isLoading =
    meetingsLoading || taskQueries.some((q) => q.isLoading);

  const tasks: (Task & { meeting_title: string })[] = [];
  meetings?.forEach((meeting, i) => {
    const result = taskQueries[i]?.data;
    if (!result) return;
    result.tasks.forEach((t) => {
      tasks.push({ ...t, meeting_title: meeting.title });
    });
  });

  return { tasks, isLoading, meetings: meetings ?? [] };
}

export function useAllDecisions() {
  const { data: meetings, isLoading: meetingsLoading } = useCompletedMeetings();

  const decisionQueries = useQueries({
    queries: (meetings ?? []).map((m) => ({
      queryKey: ["decisions", m.id],
      queryFn: () => api.getMeetingDecisions(m.id),
      enabled: !!m.id,
    })),
  });

  const isLoading =
    meetingsLoading || decisionQueries.some((q) => q.isLoading);

  const decisions: (Decision & { meeting_title: string })[] = [];
  meetings?.forEach((meeting, i) => {
    const result = decisionQueries[i]?.data;
    if (!result) return;
    result.decisions.forEach((d) => {
      decisions.push({ ...d, meeting_title: meeting.title });
    });
  });

  return { decisions, isLoading, meetings: meetings ?? [] };
}
