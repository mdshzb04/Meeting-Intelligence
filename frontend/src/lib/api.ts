import { getToken } from "@/lib/auth";

const BACKEND_URL = "";  // Empty = same origin (using Next.js API proxy)

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;

  let url = `${BACKEND_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        searchParams.append(key, value);
      }
    });
    const queryString = searchParams.toString();
    if (queryString) url += `?${queryString}`;
  }

  const token = getToken();
  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      ...(fetchOptions.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...fetchOptions.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
    const message =
      errorData.error ||
      errorData.detail ||
      (typeof errorData.message === "string" ? errorData.message : null) ||
      `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }

  return response.json();
}

// ---- Meeting APIs ----

export interface Meeting {
  id: string;
  title: string;
  status: string;
  summary?: string;
  highlights?: string;
  next_steps?: string;
  audio_filename?: string;
  duration_seconds?: number;
  created_at: string;
  updated_at: string;
}

export interface MeetingListItem {
  id: string;
  title: string;
  status: string;
  summary?: string;
  created_at: string;
  task_count: number;
  completed_task_count: number;
  decision_count: number;
}

export interface MeetingListResult {
  meetings: MeetingListItem[];
  total: number;
}

export interface ChatCitation {
  meeting_id: string;
  meeting_title: string;
  source_type: "transcript" | "action_item" | "decision" | "summary" | string;
  excerpt: string;
  label: string;
  ref?: string | null;
}

export interface ChatMessage {
  id: string;
  meeting_id: string;
  role: "user" | "assistant";
  content: string;
  citations?: ChatCitation[];
  created_at: string;
}

export interface ChatHistory {
  messages: ChatMessage[];
  meeting_id: string;
}

export interface Task {
  id: string;
  meeting_id: string;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  created_at: string;
  completed_at?: string;
}

export interface TaskList {
  tasks: Task[];
  total: number;
  completed: number;
  pending: number;
  in_progress: number;
}

export interface Decision {
  id: string;
  meeting_id: string;
  decision_text: string;
  implementation_status: "pending" | "in_progress" | "implemented";
  notes?: string;
  created_at: string;
}

export interface DecisionList {
  decisions: Decision[];
  total: number;
  implemented: number;
  pending: number;
  in_progress: number;
}

export interface Transcript {
  meeting_id: string;
  full_text: string;
  created_at: string;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  filename: string;
  file_type: string;
  status: "processing" | "ready" | "failed" | string;
  chunk_count: number;
  error_message?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface KnowledgeDocumentList {
  documents: KnowledgeDocument[];
  total: number;
}

export interface KnowledgeCitation {
  document_id: string;
  document_title: string;
  excerpt: string;
  label: string;
  ref?: string | null;
}

export interface KnowledgeChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: KnowledgeCitation[];
  created_at: string;
}

export interface KnowledgeChatHistory {
  messages: KnowledgeChatMessage[];
}

// ---- API Functions ----

export const api = {
  // Meetings
  createMeeting: (title: string, transcript_text: string) =>
    apiFetch<Meeting>("/api/meetings", {
      method: "POST",
      body: JSON.stringify({ title, transcript_text }),
    }),

  uploadMeeting: (file: File, title?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (title) formData.append("title", title);
    return apiFetch<Meeting>("/api/meetings/upload", {
      method: "POST",
      body: formData,
    });
  },

  listMeetings: (search?: string, limit = 50, offset = 0) =>
    apiFetch<MeetingListResult>("/api/meetings", {
      params: {
        ...(search ? { search } : {}),
        limit: String(limit),
        offset: String(offset),
      },
    }),

  getMeeting: (id: string) => apiFetch<Meeting>(`/api/meetings/${id}`),

  retryMeeting: (id: string) =>
    apiFetch<Meeting>(`/api/meetings/${id}/retry`, { method: "POST" }),

  deleteMeeting: (id: string) =>
    apiFetch<{ message: string }>(`/api/meetings/${id}`, { method: "DELETE" }),

  getTranscript: (meetingId: string) =>
    apiFetch<Transcript>(`/api/meetings/${meetingId}/transcript`),

  // Chat
  sendChatMessage: (meetingId: string, content: string) =>
    apiFetch<ChatMessage>(`/api/meetings/${meetingId}/chat`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  getChatHistory: (meetingId: string) =>
    apiFetch<ChatHistory>(`/api/meetings/${meetingId}/chat`),

  // Tasks
  getMeetingTasks: (meetingId: string) =>
    apiFetch<TaskList>(`/api/meetings/${meetingId}/tasks`),

  updateTask: (taskId: string, updates: Partial<Pick<Task, "status" | "title" | "description" | "priority">>) =>
    apiFetch<Task>(`/api/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),

  // Decisions
  getMeetingDecisions: (meetingId: string) =>
    apiFetch<DecisionList>(`/api/meetings/${meetingId}/decisions`),

  updateDecision: (decisionId: string, updates: Partial<Pick<Decision, "implementation_status" | "notes">>) =>
    apiFetch<Decision>(`/api/decisions/${decisionId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),

  // Integrations
  getSlackIntegration: () =>
    apiFetch<{ configured: boolean; webhook_url_masked: string | null }>(
      "/api/integrations/slack"
    ),

  updateSlackIntegration: (webhook_url: string | null) =>
    apiFetch<{ configured: boolean; webhook_url_masked: string | null }>(
      "/api/integrations/slack",
      { method: "PUT", body: JSON.stringify({ webhook_url }) }
    ),

  testSlackIntegration: () =>
    apiFetch<{ message: string }>("/api/integrations/slack/test", {
      method: "POST",
    }),

  // Knowledge base
  listKnowledgeDocuments: () =>
    apiFetch<KnowledgeDocumentList>("/api/knowledge/documents"),

  uploadKnowledgeDocument: (file: File, title?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (title) formData.append("title", title);
    return apiFetch<KnowledgeDocument>("/api/knowledge/documents", {
      method: "POST",
      body: formData,
    });
  },

  deleteKnowledgeDocument: (id: string) =>
    apiFetch<{ message: string }>(`/api/knowledge/documents/${id}`, {
      method: "DELETE",
    }),

  sendKnowledgeChatMessage: (content: string) =>
    apiFetch<KnowledgeChatMessage>("/api/knowledge/chat", {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  getKnowledgeChatHistory: () =>
    apiFetch<KnowledgeChatHistory>("/api/knowledge/chat"),

  // Health
  healthCheck: () => apiFetch<{ status: string }>("/api/health"),
};

export { ApiError };
