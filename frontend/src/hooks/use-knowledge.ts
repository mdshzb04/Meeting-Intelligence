"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

const DOCS_KEY = ["knowledge", "documents"] as const;
const CHAT_KEY = ["knowledge", "chat"] as const;

export function useKnowledgeDocuments() {
  return useQuery({
    queryKey: DOCS_KEY,
    queryFn: () => api.listKnowledgeDocuments(),
    refetchInterval: (query) => {
      const docs = query.state.data?.documents ?? [];
      const hasProcessing = docs.some((d) => d.status === "processing");
      return hasProcessing ? 4000 : false;
    },
  });
}

export function useUploadKnowledgeDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, title }: { file: File; title?: string }) =>
      api.uploadKnowledgeDocument(file, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOCS_KEY });
    },
  });
}

export function useDeleteKnowledgeDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteKnowledgeDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DOCS_KEY });
    },
  });
}

export function useKnowledgeChatHistory() {
  return useQuery({
    queryKey: CHAT_KEY,
    queryFn: () => api.getKnowledgeChatHistory(),
  });
}

export function useSendKnowledgeMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => api.sendKnowledgeChatMessage(content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAT_KEY });
    },
  });
}
