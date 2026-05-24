"""Global workspace chat — queries meetings + knowledge docs together.

Modes:
  meetings  → meeting memory only (transcripts, tasks, decisions, summaries)
  knowledge → knowledge-base docs only
  everything → both fused into one answer
"""

import json
import logging
from typing import List, Literal, Tuple

import asyncpg
from openai import OpenAI

from app.config import get_settings
from app.exceptions import AIServiceError
from app.repositories import memory as memory_repo
from app.repositories import knowledge as knowledge_repo
from app.services.embedding import generate_single_embedding
from app.services.pinecone_service import (
    query_vectors_across_meetings,
    query_vectors_across_knowledge,
)

logger = logging.getLogger(__name__)

GLOBAL_SYSTEM_PROMPT = """You are MeetingMind, a workspace AI assistant.
Answer using ONLY the numbered sources below. Cite inline using [1], [2] etc.
If sources are insufficient, say what is missing — never invent facts.

SOURCE CONTEXT:
{context}

Respond with valid JSON only:
{{
  "answer": "Your answer with [1] citations inline",
  "citation_refs": [1, 2]
}}"""


async def global_workspace_chat(
    pool: asyncpg.Pool,
    user_id: str,
    user_query: str,
    mode: Literal["meetings", "knowledge", "everything"],
    chat_history: List[dict],
) -> Tuple[str, List[dict]]:
    """Unified RAG chat across meetings and/or knowledge docs."""
    settings = get_settings()
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    sources: List[dict] = []
    query_embedding = await generate_single_embedding(user_query)

    # --- Meeting sources ---
    if mode in ("meetings", "everything"):
        meeting_ids = await memory_repo.get_completed_meeting_ids(pool, user_id)
        titles = await memory_repo.get_meeting_titles(pool, user_id)

        if meeting_ids:
            chunks = await query_vectors_across_meetings(
                meeting_ids, query_embedding, top_k=10
            )
            seen = set()
            for c in chunks:
                cid = c.get("id", "")
                if cid in seen:
                    continue
                seen.add(cid)
                mid = c.get("meeting_id", "")
                sources.append({
                    "type": "meeting_transcript",
                    "label": f"{titles.get(mid, 'Meeting')} — Transcript",
                    "excerpt": (c.get("text") or "")[:500],
                    "meta": {"meeting_id": mid, "meeting_title": titles.get(mid, "Meeting")},
                })

        # Structured: summaries / tasks / decisions
        mem = await memory_repo.get_workspace_memory(pool, user_id, query=user_query)
        for m in mem["meetings"][:10]:
            if m.get("summary"):
                sources.append({
                    "type": "meeting_summary",
                    "label": f"{m['title']} — Summary",
                    "excerpt": (m["summary"] or "")[:400],
                    "meta": {"meeting_id": m["id"], "meeting_title": m["title"]},
                })
        for t in mem["tasks"][:15]:
            sources.append({
                "type": "action_item",
                "label": f"{t['meeting_title']} — Action ({t['status']})",
                "excerpt": t["title"] + (f" — {t['description']}" if t.get("description") else ""),
                "meta": {"meeting_id": t["meeting_id"], "meeting_title": t["meeting_title"]},
            })
        for d in mem["decisions"][:15]:
            sources.append({
                "type": "decision",
                "label": f"{d['meeting_title']} — Decision",
                "excerpt": d["decision_text"],
                "meta": {"meeting_id": d["meeting_id"], "meeting_title": d["meeting_title"]},
            })

    # --- Knowledge-doc sources ---
    if mode in ("knowledge", "everything"):
        docs = await knowledge_repo.list_documents(pool, user_id)
        ready_ids = [d["id"] for d in docs if d["status"] == "ready"]
        doc_titles = {d["id"]: d["title"] for d in docs}

        if ready_ids:
            kb_chunks = await query_vectors_across_knowledge(
                ready_ids, query_embedding, top_k=10
            )
            seen_kb: set = set()
            for c in kb_chunks:
                cid = c.get("id", "")
                if cid in seen_kb:
                    continue
                seen_kb.add(cid)
                did = c.get("document_id", "")
                sources.append({
                    "type": "knowledge_doc",
                    "label": f"{doc_titles.get(did, 'Document')} — Excerpt",
                    "excerpt": (c.get("text") or "")[:500],
                    "meta": {"document_id": did, "document_title": doc_titles.get(did, "Document")},
                })

    if not sources:
        return (
            "No indexed content found. Upload documents or complete a meeting first.",
            [],
        )

    # Cap + number sources
    sources = sources[:40]
    lines = []
    for i, src in enumerate(sources, 1):
        src["ref"] = i
        lines.append(f"[{i}] {src['label']}\n{src['excerpt']}")

    context = "\n\n---\n\n".join(lines)
    system_prompt = GLOBAL_SYSTEM_PROMPT.format(context=context)

    messages = [{"role": "system", "content": system_prompt}]
    for msg in chat_history[-8:]:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": user_query})

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=2000,
        )
        raw = response.choices[0].message.content
        parsed = json.loads(raw)
        answer = parsed.get("answer", "").strip()
        ref_set = {int(r) for r in parsed.get("citation_refs", []) if str(r).isdigit()}

        citations = []
        for src in sources:
            if src["ref"] in ref_set:
                c: dict = {"excerpt": src["excerpt"], "label": src["label"], "ref": str(src["ref"])}
                c.update(src["meta"])
                c["source_type"] = src["type"]
                citations.append(c)

        return answer or "No answer generated.", citations

    except json.JSONDecodeError:
        raise AIServiceError("Failed to parse global chat response")
    except Exception as e:
        logger.error("Global workspace chat failed: %s", e)
        raise AIServiceError(f"Chat failed: {str(e)}")
