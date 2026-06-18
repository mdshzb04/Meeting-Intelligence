"""Traceplane observability — optional SDK wrapper."""

import logging
from contextlib import contextmanager
from typing import Any, Iterator, Optional

logger = logging.getLogger(__name__)
_enabled = False


class _NoOpSpan:
    def set_input(self, value: str) -> None:
        pass

    def set_output(self, value: str) -> None:
        pass

    def llm_call(self, **kwargs: Any) -> None:
        pass

    def error(self, message: str, **kwargs: Any) -> None:
        pass


def setup_traceplane(api_key: Optional[str], base_url: str) -> bool:
    global _enabled
    if not api_key:
        logger.info("Traceplane disabled: TRACEPLANE_API_KEY not set")
        return False
    try:
        from traceplane import init

        init(api_key=api_key, base_url=base_url)
        _enabled = True
        logger.info("Traceplane initialized", extra={"base_url": base_url})
        return True
    except Exception as exc:
        logger.warning("Traceplane init failed: %s", exc)
        return False


def is_enabled() -> bool:
    return _enabled


@contextmanager
def traced(
    agent: str,
    model: Optional[str] = None,
    *,
    provider: str = "openai",
    **agent_meta: Any,
) -> Iterator[Any]:
    if not _enabled:
        yield _NoOpSpan()
        return
    from traceplane import trace

    with trace(agent=agent, model=model, provider=provider, **agent_meta) as span:
        yield span


def record_chat_usage(span: Any, response: Any, model: str) -> None:
    usage = getattr(response, "usage", None)
    if not usage:
        return
    span.llm_call(
        model=model,
        input_tokens=getattr(usage, "prompt_tokens", 0) or 0,
        output_tokens=getattr(usage, "completion_tokens", 0) or 0,
    )


def record_embedding_usage(span: Any, response: Any, model: str) -> None:
    usage = getattr(response, "usage", None)
    if not usage:
        return
    total = getattr(usage, "total_tokens", 0) or 0
    span.llm_call(model=model, input_tokens=total, output_tokens=0)
