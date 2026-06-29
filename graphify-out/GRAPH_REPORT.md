# Graph Report - .  (2026-06-29)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 760 nodes · 1385 edges · 52 communities (47 shown, 5 thin omitted)
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 122 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a7e27054`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_UI Components|UI Components]]
- [[_COMMUNITY_Decision API|Decision API]]
- [[_COMMUNITY_Backend API Calls|Backend API Calls]]
- [[_COMMUNITY_App Layout and Styling|App Layout and Styling]]
- [[_COMMUNITY_Frontend Dependencies|Frontend Dependencies]]
- [[_COMMUNITY_Meeting Pages|Meeting Pages]]
- [[_COMMUNITY_UI Utilities and Hooks|UI Utilities and Hooks]]
- [[_COMMUNITY_Workspace Database and Chat|Workspace Database and Chat]]
- [[_COMMUNITY_Knowledge Base UI|Knowledge Base UI]]
- [[_COMMUNITY_Workspace Actions and Status|Workspace Actions and Status]]
- [[_COMMUNITY_TypeScript Configuration|TypeScript Configuration]]
- [[_COMMUNITY_Dashboard UI|Dashboard UI]]
- [[_COMMUNITY_App Configuration and Integrations|App Configuration and Integrations]]
- [[_COMMUNITY_Pinecone Vector Service|Pinecone Vector Service]]
- [[_COMMUNITY_Meeting Data Schemas|Meeting Data Schemas]]
- [[_COMMUNITY_Knowledge Citations|Knowledge Citations]]
- [[_COMMUNITY_Meeting Processing Pipeline|Meeting Processing Pipeline]]
- [[_COMMUNITY_Global Chat UI|Global Chat UI]]
- [[_COMMUNITY_Chat API|Chat API]]
- [[_COMMUNITY_Knowledge Base API|Knowledge Base API]]
- [[_COMMUNITY_Observability and Utilities|Observability and Utilities]]
- [[_COMMUNITY_AI Services and RAG Chat|AI Services and RAG Chat]]
- [[_COMMUNITY_Embedding Generation|Embedding Generation]]
- [[_COMMUNITY_Decision Database Operations|Decision Database Operations]]
- [[_COMMUNITY_Meeting Creation UI|Meeting Creation UI]]
- [[_COMMUNITY_Authentication|Authentication]]
- [[_COMMUNITY_Knowledge Base Documents|Knowledge Base Documents]]
- [[_COMMUNITY_Task API|Task API]]
- [[_COMMUNITY_Meeting Database Operations|Meeting Database Operations]]
- [[_COMMUNITY_Task Database Operations|Task Database Operations]]
- [[_COMMUNITY_Transcript Database Operations|Transcript Database Operations]]
- [[_COMMUNITY_Action Items UI|Action Items UI]]
- [[_COMMUNITY_Decisions UI|Decisions UI]]
- [[_COMMUNITY_Chat Database Operations|Chat Database Operations]]
- [[_COMMUNITY_Workspace Memory|Workspace Memory]]
- [[_COMMUNITY_AI Meeting Analysis|AI Meeting Analysis]]
- [[_COMMUNITY_Memory Context Building|Memory Context Building]]
- [[_COMMUNITY_User Management|User Management]]
- [[_COMMUNITY_Global Workspace Chat|Global Workspace Chat]]
- [[_COMMUNITY_Project Documentation|Project Documentation]]
- [[_COMMUNITY_Health Checks|Health Checks]]
- [[_COMMUNITY_Database Schema Runner|Database Schema Runner]]
- [[_COMMUNITY_Development Script|Development Script]]
- [[_COMMUNITY_Next.js Configuration|Next.js Configuration]]
- [[_COMMUNITY_PostCSS Configuration|PostCSS Configuration]]
- [[_COMMUNITY_Meeting Intelligence API|Meeting Intelligence API]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 83 edges
2. `backendFetch()` - 48 edges
3. `get_settings()` - 21 edges
4. `AIServiceError` - 17 edges
5. `compilerOptions` - 16 edges
6. `NotFoundError` - 14 edges
7. `Skeleton()` - 13 edges
8. `api` - 13 edges
9. `global_workspace_chat()` - 11 edges
10. `process_text_meeting()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `lifespan()` --calls--> `setup_traceplane()`  [INFERRED]
  backend/app/main.py → backend/app/services/traceplane_client.py
- `register()` --calls--> `hash_password()`  [INFERRED]
  backend/app/api/auth.py → backend/app/auth_utils.py
- `register()` --calls--> `ValidationError`  [INFERRED]
  backend/app/api/auth.py → backend/app/exceptions.py
- `login()` --calls--> `verify_password()`  [INFERRED]
  backend/app/api/auth.py → backend/app/auth_utils.py
- `login()` --calls--> `UnauthorizedError`  [INFERRED]
  backend/app/api/auth.py → backend/app/exceptions.py

## Import Cycles
- 1-file cycle: `frontend/src/components/ui/tabs.tsx -> frontend/src/components/ui/tabs.tsx`
- 1-file cycle: `frontend/src/components/ui/sonner.tsx -> frontend/src/components/ui/sonner.tsx`
- 1-file cycle: `frontend/src/components/ui/avatar.tsx -> frontend/src/components/ui/avatar.tsx`
- 1-file cycle: `frontend/src/components/ui/button.tsx -> frontend/src/components/ui/button.tsx`
- 1-file cycle: `frontend/src/components/ui/dialog.tsx -> frontend/src/components/ui/dialog.tsx`
- 1-file cycle: `frontend/src/components/ui/input.tsx -> frontend/src/components/ui/input.tsx`
- 1-file cycle: `frontend/src/components/ui/progress.tsx -> frontend/src/components/ui/progress.tsx`
- 1-file cycle: `frontend/src/components/ui/scroll-area.tsx -> frontend/src/components/ui/scroll-area.tsx`
- 1-file cycle: `frontend/src/components/ui/separator.tsx -> frontend/src/components/ui/separator.tsx`
- 1-file cycle: `frontend/src/components/ui/tooltip.tsx -> frontend/src/components/ui/tooltip.tsx`

## Communities (52 total, 5 thin omitted)

### Community 0 - "UI Components"
Cohesion: 0.05
Nodes (49): markSize, MeetingMindLogoProps, MeetingMindMark(), MeetingMindMarkProps, priorityConfig, statusConfig, Avatar(), AvatarBadge() (+41 more)

### Community 1 - "Decision API"
Cohesion: 0.06
Nodes (48): get_meeting_decisions(), Decision API endpoints — track decisions from meetings., update_decision(), BackgroundTasks, UploadFile, Accept multiple files; skip exact duplicates (same filename+hash)., upload_knowledge_document(), upload_knowledge_documents_batch() (+40 more)

### Community 2 - "Backend API Calls"
Cohesion: 0.08
Nodes (30): POST(), GET(), POST(), PATCH(), GET(), GET(), POST(), POST() (+22 more)

### Community 3 - "App Layout and Styling"
Cohesion: 0.08
Nodes (27): geistMono, geistSans, instrumentSerif, metadata, LoginPage(), Mode, AppShell(), getActiveWorkspaceKey() (+19 more)

### Community 4 - "Frontend Dependencies"
Cohesion: 0.06
Nodes (32): dependencies, @base-ui/react, class-variance-authority, clsx, framer-motion, lucide-react, next, next-themes (+24 more)

### Community 5 - "Meeting Pages"
Cohesion: 0.14
Nodes (19): MeetingActionsPage(), MeetingChatPage(), MeetingDecisionsPage(), MeetingOverviewPage(), formatFullDate(), MeetingHeader(), useMeetingReady(), MeetingProcessingState() (+11 more)

### Community 6 - "UI Utilities and Hooks"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 7 - "Workspace Database and Chat"
Cohesion: 0.12
Nodes (17): global_chat(), GlobalChatRequest, Global workspace endpoints — cross-meeting + cross-doc chat and stats., Single endpoint for cross-meeting + cross-doc RAG chat., Ingestion dashboard — document counts, chunks, vector estimate., workspace_stats(), close_db(), init_db() (+9 more)

### Community 8 - "Knowledge Base UI"
Cohesion: 0.18
Nodes (12): KnowledgePage(), KnowledgeChatPanel(), KnowledgeDocumentList(), FileResult, KnowledgeUpload(), CHAT_KEY, DOCS_KEY, useDeleteKnowledgeDocument() (+4 more)

### Community 9 - "Workspace Actions and Status"
Cohesion: 0.16
Nodes (12): DECISION_GROUPS, StatusGroupColumn(), StatusGroupHeader(), WORKFLOW_GROUPS, AllActionItemsBoard(), nextStatus, AllDecisionsBoard(), nextStatus (+4 more)

### Community 10 - "TypeScript Configuration"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 11 - "Dashboard UI"
Cohesion: 0.16
Nodes (13): DashboardPage(), EmptyState(), formatDate(), MeetingCard(), MeetingCardProps, statusDot(), StatsCards(), StatsCardsProps (+5 more)

### Community 12 - "App Configuration and Integrations"
Cohesion: 0.13
Nodes (14): get_traceplane_integration(), Observability integration status., get_settings(), Application configuration via environment variables., Cached settings instance - loaded once on startup., All configuration is loaded from environment variables., Settings, chat_with_knowledge() (+6 more)

### Community 13 - "Pinecone Vector Service"
Cohesion: 0.16
Nodes (17): delete_knowledge_vectors(), delete_meeting_vectors(), _get_index(), query_vectors(), query_vectors_across_knowledge(), query_vectors_across_meetings(), Pinecone vector storage service., Query Pinecone for similar transcript chunks.      Returns list of dicts with 't (+9 more)

### Community 14 - "Meeting Data Schemas"
Cohesion: 0.16
Nodes (15): list_meetings(), LoginRequest, RegisterRequest, UserResponse, MeetingCreate, MeetingListResponse, MeetingListResult, MeetingResponse (+7 more)

### Community 15 - "Knowledge Citations"
Cohesion: 0.12
Nodes (14): KnowledgeCitations(), ApiError, ChatHistory, ChatMessage, DecisionList, FetchOptions, KnowledgeChatHistory, KnowledgeChatMessage (+6 more)

### Community 16 - "Meeting Processing Pipeline"
Cohesion: 0.17
Nodes (15): get_db(), Pool, Get the database connection pool. Used as a FastAPI dependency., _clear_derivatives(), process_audio_meeting(), process_text_meeting(), Pool, Background meeting processing — AI analysis, embeddings, Pinecone. (+7 more)

### Community 17 - "Global Chat UI"
Cohesion: 0.18
Nodes (11): GlobalMessage, Mode, MODES, WorkspaceChatPage(), ChatCitations(), typeIcons, ChatPanel(), useChatHistory() (+3 more)

### Community 18 - "Chat API"
Cohesion: 0.17
Nodes (13): _format_message(), get_chat_history(), Chat API endpoints — workspace memory with citations., send_chat_message(), ChatCitation, ChatHistoryResponse, ChatMessageCreate, ChatMessageResponse (+5 more)

### Community 19 - "Knowledge Base API"
Cohesion: 0.20
Nodes (13): _format_document(), _format_kb_message(), get_knowledge_chat_history(), list_knowledge_documents(), Knowledge base API — document upload, list, delete, and RAG chat., send_knowledge_chat(), KnowledgeChatHistoryResponse, KnowledgeChatMessageCreate (+5 more)

### Community 20 - "Observability and Utilities"
Cohesion: 0.23
Nodes (9): Any, generate_meeting_title(), Generate a short meeting title from the first few lines of the transcript., _NoOpSpan, Traceplane observability — optional SDK wrapper., record_chat_usage(), record_embedding_usage(), setup_traceplane() (+1 more)

### Community 21 - "AI Services and RAG Chat"
Cohesion: 0.19
Nodes (12): AIServiceError, AI service error (OpenAI, Pinecone, etc.)., chat_with_meeting(), chat_with_memory(), Pool, RAG chat with full workspace memory and citations., RAG chat across all meetings. Returns (answer_text, citations)., OpenAI Whisper transcription service. (+4 more)

### Community 22 - "Embedding Generation"
Cohesion: 0.18
Nodes (11): delete_knowledge_document(), chunk_text(), generate_embeddings(), generate_single_embedding(), OpenAI embedding service for transcript chunks., Split text into overlapping chunks by approximate word count.      Args:, Generate embeddings for a list of text chunks.      Uses OpenAI text-embedding-3, Generate embedding for a single text (e.g., a chat query). (+3 more)

### Community 23 - "Decision Database Operations"
Cohesion: 0.22
Nodes (12): create_decision(), create_decisions_bulk(), get_decision_stats(), get_decisions(), Pool, Database operations for decisions., Create a new decision., Bulk create decisions from AI extraction. (+4 more)

### Community 24 - "Meeting Creation UI"
Cohesion: 0.26
Nodes (7): TranscriptView(), InputMode, NewMeetingForm(), useCreateMeeting(), useTranscript(), useUploadMeeting(), api

### Community 25 - "Authentication"
Cohesion: 0.27
Nodes (10): login(), me(), Email registration and sign-in., register(), _user_payload(), create_access_token(), hash_password(), JWT and password helpers. (+2 more)

### Community 26 - "Knowledge Base Documents"
Cohesion: 0.29
Nodes (11): create_document(), create_kb_message(), delete_document(), get_document(), get_kb_messages(), get_recent_kb_messages(), list_documents(), list_ready_document_ids() (+3 more)

### Community 27 - "Task API"
Cohesion: 0.24
Nodes (9): get_meeting_tasks(), Task API endpoints — manage action items from meetings., update_task(), Pydantic schemas for tasks., Task list for a meeting., Schema for updating a task., TaskListResponse, TaskResponse (+1 more)

### Community 28 - "Meeting Database Operations"
Cohesion: 0.29
Nodes (10): create_meeting(), delete_meeting(), get_meeting(), get_meeting_internal(), list_meetings(), Pool, Database operations for meetings., Load meeting by id (background jobs only — no user scope). (+2 more)

### Community 29 - "Task Database Operations"
Cohesion: 0.27
Nodes (10): create_task(), create_tasks_bulk(), get_task_stats(), get_tasks(), Pool, Database operations for tasks., Get task statistics for a meeting., Bulk create tasks from AI extraction. (+2 more)

### Community 30 - "Transcript Database Operations"
Cohesion: 0.24
Nodes (10): create_chunks(), create_transcript(), get_chunks(), get_transcript(), Pool, Database operations for transcripts and transcript chunks., Store the full transcript for a meeting., Get the transcript for a meeting. (+2 more)

### Community 31 - "Action Items UI"
Cohesion: 0.38
Nodes (7): ActionItems(), ActionItemsBoard(), nextStatus, nextStatus, PriorityBadge(), useTasks(), useUpdateTask()

### Community 32 - "Decisions UI"
Cohesion: 0.38
Nodes (7): DecisionsBoard(), nextDecisionStatus, DecisionsPanel(), nextDecisionStatus, Skeleton(), useDecisions(), useUpdateDecision()

### Community 33 - "Chat Database Operations"
Cohesion: 0.28
Nodes (8): create_message(), get_messages(), get_recent_messages(), Pool, Database operations for chat messages., Store a chat message with optional citations., Get chat history for a meeting, ordered chronologically., Get the most recent messages for context window.

### Community 34 - "Workspace Memory"
Cohesion: 0.47
Nodes (5): get_completed_meeting_ids(), get_meeting_titles(), get_workspace_memory(), Pool, Workspace memory scoped per user.

### Community 35 - "AI Meeting Analysis"
Cohesion: 0.47
Nodes (5): analyze_meeting(), _coerce_markdown_text(), _coerce_text(), OpenAI GPT service for meeting analysis and structured extraction., Analyze a meeting transcript and extract structured data.      Returns dict with

### Community 36 - "Memory Context Building"
Cohesion: 0.40
Nodes (5): build_memory_context(), Pool, Build numbered citation sources from workspace memory + vector search., Returns (formatted context for LLM, citation source list)., _source()

### Community 37 - "User Management"
Cohesion: 0.60
Nodes (4): create_user(), get_user_by_email(), get_user_by_id(), Pool

### Community 38 - "Global Workspace Chat"
Cohesion: 0.40
Nodes (4): global_workspace_chat(), Pool, Global workspace chat — queries meetings + knowledge docs together.  Modes:   me, Unified RAG chat across meetings and/or knowledge docs.

### Community 39 - "Project Documentation"
Cohesion: 0.50
Nodes (5): Render Deployment Config, Backend Requirements, Frontend README, MeetingMind README, Root Requirements

### Community 40 - "Health Checks"
Cohesion: 0.50
Nodes (3): health_check(), Health check endpoint., Health check for Render deployment monitoring.

## Knowledge Gaps
- **110 isolated node(s):** `meeting-intelligence-api`, `run-dev.sh script`, `$schema`, `style`, `rsc` (+105 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `UI Components` to `Decisions UI`, `App Layout and Styling`, `Meeting Pages`, `Knowledge Base UI`, `Workspace Actions and Status`, `Dashboard UI`, `Global Chat UI`, `Action Items UI`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Why does `sonner` connect `Frontend Dependencies` to `Action Items UI`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Are the 18 inferred relationships involving `get_settings()` (e.g. with `get_traceplane_integration()` and `upload_knowledge_document()`) actually correct?**
  _`get_settings()` has 18 INFERRED edges - model-reasoned connections that need verification._
- **Are the 13 inferred relationships involving `AIServiceError` (e.g. with `GlobalChatRequest` and `analyze_meeting()`) actually correct?**
  _`AIServiceError` has 13 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Email registration and sign-in.`, `Chat API endpoints — workspace memory with citations.`, `Decision API endpoints — track decisions from meetings.` to the rest of the system?**
  _219 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Components` be split into smaller, more focused modules?**
  _Cohesion score 0.052943354313217325 - nodes in this community are weakly interconnected._
- **Should `Decision API` be split into smaller, more focused modules?**
  _Cohesion score 0.058445353594389245 - nodes in this community are weakly interconnected._