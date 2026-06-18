"""RAG chat over the user's knowledge-base documents."""

import json
import logging
from typing import List, Tuple

import asyncpg
from openai import OpenAI

from app.config import get_settings
from app.exceptions import AIServiceError
from app.repositories import knowledge as knowledge_repo
from app.services.embedding import generate_single_embedding
from app.services.pinecone_service import query_vectors_across_knowledge
from app.services.traceplane_client import traced, record_chat_usage

logger = logging.getLogger(__name__)

KB_SYSTEM_PROMPT = """You are MeetingMind, an AI assistant that answers questions using the user's uploaded knowledge-base documents (PDFs, notes, policies, etc.).

RULES:
1. Answer using ONLY the numbered sources in KNOWLEDGE CONTEXT below.
2. Cite sources inline using [1], [2], etc. matching the source numbers.
3. If sources lack enough information, say what is missing — do not invent facts.
4. Be concise and professional. Quote excerpts when helpful.

KNOWLEDGE CONTEXT:
{context}

Respond with valid JSON only:
{{
  "answer": "Your answer with [1] style citations inline",
  "citation_refs": [1, 2]
}}

citation_refs must list every source number you cited in the answer (integers)."""


async def chat_with_knowledge(
    pool: asyncpg.Pool,
    user_id: str,
    user_query: str,
    chat_history: List[dict],
) -> Tuple[str, List[dict]]:
    """RAG chat across indexed knowledge documents. Returns (answer, citations)."""
    settings = get_settings()
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    try:
        documents = await knowledge_repo.list_documents(pool, user_id)
        ready_docs = [d for d in documents if d["status"] == "ready"]
        if not ready_docs:
            return (
                "No indexed documents yet. Upload a PDF, TXT, MD, or DOCX file and wait "
                "until processing completes.",
                [],
            )

        doc_ids = [d["id"] for d in ready_docs]
        titles = {d["id"]: d["title"] for d in ready_docs}

        query_embedding = await generate_single_embedding(user_query)
        chunks = await query_vectors_across_knowledge(doc_ids, query_embedding, top_k=10)

        sources: List[dict] = []
        seen = set()
        for chunk in chunks:
            cid = chunk.get("id")
            if cid and cid in seen:
                continue
            if cid:
                seen.add(cid)
            doc_id = chunk.get("document_id") or ""
            title = titles.get(doc_id, "Document")
            sources.append({
                "document_id": doc_id,
                "document_title": title,
                "excerpt": (chunk.get("text") or "")[:500],
                "label": f"{title} — Excerpt",
            })

        if not sources:
            return (
                "I couldn't find relevant passages in your knowledge base for this question. "
                "Try rephrasing or upload more documents.",
                [],
            )

        lines = []
        for i, src in enumerate(sources, start=1):
            src["ref"] = i
            lines.append(
                f"[{i}] {src['label']}\n{src['excerpt']}"
            )
        context = "\n\n".join(lines)

        system_prompt = KB_SYSTEM_PROMPT.format(context=context)
        messages = [{"role": "system", "content": system_prompt}]
        for msg in chat_history[-10:]:
            messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": user_query})

        with traced("knowledge-chat", model="gpt-4o-mini") as span:
            span.set_input(user_query)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                response_format={"type": "json_object"},
                temperature=0.2,
                max_tokens=2000,
            )
            raw = response.choices[0].message.content
            record_chat_usage(span, response, "gpt-4o-mini")
            span.set_output((raw or "")[:2000])
        parsed = json.loads(raw)
        answer = parsed.get("answer", "").strip()
        refs = parsed.get("citation_refs", [])

        ref_set = set()
        for r in refs:
            try:
                ref_set.add(int(r))
            except (TypeError, ValueError):
                continue

        citations = []
        for src in sources:
            if int(src["ref"]) in ref_set:
                citations.append({
                    "document_id": src["document_id"],
                    "document_title": src["document_title"],
                    "excerpt": src["excerpt"],
                    "label": src["label"],
                    "ref": str(src["ref"]),
                })

        if not answer:
            answer = "I couldn't generate an answer from your knowledge base."

        logger.info("KB chat for user %s: %s citations", user_id, len(citations))
        return answer, citations

    except json.JSONDecodeError as e:
        logger.error("Failed to parse KB chat JSON: %s", e)
        raise AIServiceError("Failed to parse chat response")
    except AIServiceError:
        raise
    except Exception as e:
        logger.error("KB chat failed: %s", e)
        raise AIServiceError(f"Chat failed: {str(e)}")
