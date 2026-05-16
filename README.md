# MeetingMind — AI Meeting Intelligence

AI-powered meeting analysis platform. Upload audio or paste transcripts to get instant summaries, action items, decisions, and intelligent RAG-powered chat with your meetings.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, React Query |
| Backend | FastAPI (Python) |
| Database | Neon PostgreSQL |
| Vector Store | Pinecone |
| AI | OpenAI GPT-4o-mini, Whisper, text-embedding-3-small |
| Frontend Deploy | Vercel |
| Backend Deploy | Render |

## Features

- **Meeting Input** — Upload audio (mp3, wav, m4a) or paste transcript text
- **AI Analysis** — Automatic summary, action items, decisions, highlights, next steps
- **RAG Chat** — Chat with meeting transcripts using semantic search (Pinecone + OpenAI)
- **Task Tracking** — Convert action items to tasks with status workflow (pending → in progress → completed)
- **Decision Tracking** — Track decision implementation status
- **Dashboard** — Meeting history, search, stats overview

## Project Structure

```
p2/
├── frontend/              # Next.js app (deploy to Vercel)
│   ├── src/
│   │   ├── app/           # Pages + API proxy routes
│   │   ├── components/    # UI components (layout, dashboard, meeting, shared)
│   │   ├── hooks/         # React Query hooks
│   │   ├── lib/           # API client, utilities
│   │   └── providers/     # React Query + Tooltip providers
│   └── package.json
├── backend/               # FastAPI app (deploy to Render)
│   ├── app/
│   │   ├── api/           # Route handlers
│   │   ├── services/      # AI, transcription, embedding, Pinecone, RAG
│   │   ├── repositories/  # Database operations
│   │   └── schemas/       # Pydantic models
│   ├── schema.sql         # Database migration
│   ├── requirements.txt
│   └── render.yaml        # Render deployment config
├── .env.example           # Environment variables template
└── README.md
```

## Quick Start (Local Development)

### Prerequisites

- Node.js 18+
- Python 3.11+
- OpenAI API key
- Pinecone account (free tier works)
- Neon PostgreSQL database (free tier works)

### 1. Clone and configure

```bash
cp .env.example .env
# Edit .env with your actual values
```

### 2. Set up the database

1. Create a Neon project at [neon.tech](https://neon.tech)
2. Copy the **pooled** connection string to `DATABASE_URL` in `.env`
3. Run the schema:

```bash
psql "YOUR_DATABASE_URL" -f backend/schema.sql
```

### 3. Set up Pinecone

1. Create a free account at [pinecone.io](https://app.pinecone.io)
2. Create a **serverless** index:
   - Name: `meeting-intel`
   - Dimensions: `1536`
   - Metric: `cosine`
   - Cloud: `aws`, Region: `us-east-1`
3. Copy your API key to `PINECONE_API_KEY` in `.env`

### 4. Start the backend
//cd backend && ./run-dev.sh
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Copy env vars (backend reads from its own .env)
cp ../.env .env

uvicorn app.main:app --reload --port 8000
```

### 5. Start the frontend

```bash
cd frontend

# Create .env.local for the frontend
echo "BACKEND_URL=http://localhost:8000" > .env.local

npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment Guide

### Deploy Backend to Render

1. Push your code to GitHub
2. Go to [dashboard.render.com](https://dashboard.render.com)
3. Click **New → Blueprint Instance**
4. Connect your GitHub repo
5. Render will auto-detect `backend/render.yaml`
6. Set the **Root Directory** to `backend`
7. Add environment variables:
   - `DATABASE_URL` — your Neon pooled connection string
   - `OPENAI_API_KEY` — your OpenAI key
   - `PINECONE_API_KEY` — your Pinecone key
   - `PINECONE_INDEX_NAME` — `meeting-intel`
   - `FRONTEND_URL` — your Vercel frontend URL (add after Vercel deploy)
8. Deploy — wait for health check to pass at `/api/health`

### Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **New Project** → Import your GitHub repo
3. Set **Root Directory** to `frontend`
4. Framework will be auto-detected as Next.js
5. Add environment variable:
   - `BACKEND_URL` — your Render backend URL (e.g., `https://meeting-intel-api.onrender.com`)
6. Deploy

### Post-Deploy

1. Go back to Render and set `FRONTEND_URL` to your Vercel URL
2. Test: visit your Vercel URL → create a meeting → verify it works

---

## Deployment Checklist

```
□ Create Neon PostgreSQL project → copy pooled DATABASE_URL
□ Run schema.sql against Neon database
□ Create Pinecone serverless index (1536 dims, cosine, us-east-1)
□ Get OpenAI API key from platform.openai.com
□ Deploy backend to Render (connect GitHub, set env vars, root dir: backend)
□ Wait for health check to pass at /api/health
□ Deploy frontend to Vercel (connect GitHub, set BACKEND_URL, root dir: frontend)
□ Update Render FRONTEND_URL with Vercel URL
□ Test full flow: create meeting → check summary → try chat → update tasks
```

## Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `DATABASE_URL` | Backend | Neon PostgreSQL pooled connection string |
| `OPENAI_API_KEY` | Backend | OpenAI API key |
| `PINECONE_API_KEY` | Backend | Pinecone API key |
| `PINECONE_INDEX_NAME` | Backend | Pinecone index name (default: `meeting-intel`) |
| `FRONTEND_URL` | Backend | Frontend URL for CORS (e.g., `https://your-app.vercel.app`) |
| `BACKEND_URL` | Frontend | Backend URL (e.g., `https://your-api.onrender.com`) |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/meetings` | Create meeting from text |
| `POST` | `/api/meetings/upload` | Create meeting from audio |
| `GET` | `/api/meetings` | List meetings (search via `?search=`) |
| `GET` | `/api/meetings/:id` | Get meeting detail |
| `DELETE` | `/api/meetings/:id` | Delete meeting |
| `GET` | `/api/meetings/:id/transcript` | Get transcript |
| `POST` | `/api/meetings/:id/chat` | Send chat message (RAG) |
| `GET` | `/api/meetings/:id/chat` | Get chat history |
| `GET` | `/api/meetings/:id/tasks` | Get tasks |
| `PATCH` | `/api/tasks/:id` | Update task |
| `GET` | `/api/meetings/:id/decisions` | Get decisions |
| `PATCH` | `/api/decisions/:id` | Update decision |

## Architecture Notes

- **API Proxy Pattern**: Frontend calls its own `/api/*` routes which proxy to FastAPI. This eliminates CORS issues and hides the backend URL.
- **Synchronous Processing**: Meeting analysis runs in a single request (no job queues needed).
- **File Size Limit**: 25MB max for audio uploads (OpenAI Whisper limit).
- **RAG Pipeline**: Transcript → chunk (500 words, 50 overlap) → embed (text-embedding-3-small) → Pinecone → semantic retrieval → grounded GPT response.

## License

MIT
# Meeting-Intelligence
