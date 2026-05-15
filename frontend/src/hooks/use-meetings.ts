"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Meeting } from "@/lib/api";

const POLL_MS = 4000;

function isProcessingStatus(status?: string) {
  return status === "processing";
}

export function useMeetings(search?: string) {
  return useQuery({
    queryKey: ["meetings", search],
    queryFn: () => api.listMeetings(search),
    refetchInterval: (query) => {
      const meetings = query.state.data?.meetings ?? [];
      return meetings.some((m) => isProcessingStatus(m.status)) ? POLL_MS : false;
    },
  });
}

export function useMeeting(id: string) {
  return useQuery({
    queryKey: ["meeting", id],
    queryFn: () => api.getMeeting(id),
    enabled: !!id,
    refetchInterval: (query) =>
      isProcessingStatus(query.state.data?.status) ? POLL_MS : false,
  });
}

export function useTranscript(meetingId: string) {
  return useQuery({
    queryKey: ["transcript", meetingId],
    queryFn: () => api.getTranscript(meetingId),
    enabled: !!meetingId,
  });
}

export function useCreateMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ title, transcript_text }: { title: string; transcript_text: string }) =>
      api.createMeeting(title, transcript_text),
    onSuccess: (meeting) => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      queryClient.setQueryData(["meeting", meeting.id], meeting);
    },
  });
}

export function useUploadMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, title }: { file: File; title?: string }) =>
      api.uploadMeeting(file, title),
    onSuccess: (meeting) => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
      queryClient.setQueryData(["meeting", meeting.id], meeting);
    },
  });
}

export function useRetryMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.retryMeeting(id),
    onSuccess: (meeting) => {
      queryClient.setQueryData(["meeting", meeting.id], meeting);
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  });
}

export function useDeleteMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteMeeting(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  });
}

export type { Meeting };
