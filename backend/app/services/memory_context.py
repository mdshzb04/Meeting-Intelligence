"""Build numbered citation sources from workspace memory + vector search."""

from typing import List, Optional
import asyncpg

from app.repositories import memory as memory_repo
from app.services.embedding import generate_single_embedding
from app.services.pinecone_service import query_vectors, query_vectors_across_meetings


def _source(
    meeting_id: str,
    meeting_title: str,
    source_type: str,
    excerpt: str,
    label: str,
) -> dict:
    return {
        "meeting_id": meeting_id,
        "meeting_title": meeting_title,
        "source_type": source_type,
        "excerpt": excerpt[:500],
        "label": label,
    }


async def build_memory_context(
    pool: asyncpg.Pool,
    user_id: str,
    focus_meeting_id: str,
    focus_meeting_title: str,
    user_query: str,
) -> tuple[str, List[dict]]:
    """Returns (formatted context for LLM, citation source list)."""
    memory = await memory_repo.get_workspace_memory(
        pool, user_id, focus_meeting_id=focus_meeting_id, query=user_query
    )
    titles = {m["id"]: m["title"] for m in memory["meetings"]}
    titles[focus_meeting_id] = focus_meeting_title

    sources: List[dict] = []

    # Structured: summaries (focus meeting first)
    meetings = sorted(
        memory["meetings"],
        key=lambda m: m["id"] != focus_meeting_id,
    )
    for m in meetings[:20]:
        mid, title = m["id"], m["title"]
        if m.get("summary"):
            sources.append(
                _source(mid, title, "summary", m["summary"], f"{title} — Summary")
            )
        if m.get("highlights") and mid == focus_meeting_id:
            sources.append(
                _source(mid, title, "summary", m["highlights"], f"{title} — Highlights")
            )
        if m.get("next_steps") and mid == focus_meeting_id:
            sources.append(
                _source(mid, title, "summary", m["next_steps"], f"{title} — Next steps")
            )

    # Action items
    for t in memory["tasks"]:
        line = t["title"]
        if t.get("description"):
            line += f" — {t['description']}"
        sources.append(
            _source(
                t["meeting_id"],
                t["meeting_title"],
                "action_item",
                line,
                f"{t['meeting_title']} — Action ({t['priority']}, {t['status']})",
            )
        )

    # Decisions
    for d in memory["decisions"]:
        line = d["decision_text"]
        if d.get("notes"):
            line += f" — {d['notes']}"
        sources.append(
            _source(
                d["meeting_id"],
                d["meeting_title"],
                "decision",
                line,
                f"{d['meeting_title']} — Decision",
            )
        )

    # Vector: current meeting + cross-meeting transcripts
    query_embedding = await generate_single_embedding(user_query)
    current_chunks = await query_vectors(focus_meeting_id, query_embedding, top_k=6)

    meeting_ids = await memory_repo.get_completed_meeting_ids(pool, user_id)
    other_ids = [mid for mid in meeting_ids if mid != focus_meeting_id]
    cross_chunks = await query_vectors_across_meetings(
        other_ids, query_embedding, top_k=6
    ) if other_ids else []

    seen_chunk_ids = set()
    for chunk in current_chunks + cross_chunks:
        cid = chunk.get("id")
        if cid and cid in seen_chunk_ids:
            continue
        if cid:
            seen_chunk_ids.add(cid)

        mid = chunk.get("meeting_id") or focus_meeting_id
        title = titles.get(mid, "Meeting")
        sources.append(
            _source(
                mid,
                title,
                "transcript",
                chunk.get("text", ""),
                f"{title} — Transcript",
            )
        )

    # Cap context size to stay within model limits and keep responses fast
    max_sources = 35
    if len(sources) > max_sources:
        focus = [s for s in sources if s.get("meeting_id") == focus_meeting_id]
        other = [s for s in sources if s.get("meeting_id") != focus_meeting_id]
        sources = (focus + other)[:max_sources]

    lines = []
    for i, src in enumerate(sources, 1):
        src["ref"] = str(i)
        lines.append(
            f"[{i}] {src['label']}\n"
            f"Meeting: {src['meeting_title']} (id: {src['meeting_id']})\n"
            f"Type: {src['source_type']}\n"
            f"Content: {src['excerpt']}"
        )

    context = (
        "You have memory of ALL completed meetings below. "
        f"The user is viewing meeting \"{focus_meeting_title}\" but may ask about any meeting.\n\n"
        + "\n\n---\n\n".join(lines)
    )

    return context, sources
