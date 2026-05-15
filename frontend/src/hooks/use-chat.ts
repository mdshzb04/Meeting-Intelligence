"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useChatHistory(meetingId: string) {
  return useQuery({
    queryKey: ["chat", meetingId],
    queryFn: () => api.getChatHistory(meetingId),
    enabled: !!meetingId,
  });
}

export function useSendMessage(meetingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => api.sendChatMessage(meetingId, content),
    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey: ["chat", meetingId] });
      const previous = queryClient.getQueryData<{ messages: import("@/lib/api").ChatMessage[] }>([
        "chat",
        meetingId,
      ]);
      const optimisticUser: import("@/lib/api").ChatMessage = {
        id: `temp-${Date.now()}`,
        meeting_id: meetingId,
        role: "user",
        content,
        citations: [],
        created_at: new Date().toISOString(),
      };
      queryClient.setQueryData(["chat", meetingId], {
        meeting_id: meetingId,
        messages: [...(previous?.messages ?? []), optimisticUser],
      });
      return { previous };
    },
    onError: (_err, _content, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["chat", meetingId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", meetingId] });
    },
  });
}
