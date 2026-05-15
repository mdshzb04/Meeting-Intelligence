"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Decision } from "@/lib/api";

export function useDecisions(meetingId: string) {
  return useQuery({
    queryKey: ["decisions", meetingId],
    queryFn: () => api.getMeetingDecisions(meetingId),
    enabled: !!meetingId,
  });
}

export function useUpdateDecision(meetingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      decisionId,
      updates,
    }: {
      decisionId: string;
      updates: Partial<Pick<Decision, "implementation_status" | "notes">>;
    }) => api.updateDecision(decisionId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decisions", meetingId] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  });
}
