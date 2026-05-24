"""Extract plain text from knowledge-base uploads."""

import io
import logging
import zipfile
from pathlib import Path

from app.exceptions import ValidationError

logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md", ".docx", ".mp3", ".zip"}
AUDIO_EXTENSIONS = {".mp3"}
MAX_EXTRACT_CHARS = 2_000_000  # ~2M chars supports large PDFs/reports


def validate_knowledge_file(filename: str, size_bytes: int, max_mb: int) -> str:
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationError("Supported formats: PDF, TXT, MD, DOCX")
    if size_bytes > max_mb * 1024 * 1024:
        raise ValidationError(f"File too large. Maximum size is {max_mb}MB")
    if size_bytes == 0:
        raise ValidationError("File is empty")
    return ext


def is_audio_file(filename: str) -> bool:
    return Path(filename).suffix.lower() in AUDIO_EXTENSIONS


def extract_text(filename: str, content: bytes) -> str:
    ext = Path(filename).suffix.lower()
    if ext in (".txt", ".md"):
        text = content.decode("utf-8", errors="replace")
    elif ext == ".pdf":
        text = _extract_pdf(content)
    elif ext == ".docx":
        text = _extract_docx(content)
    elif ext == ".zip":
        text = _extract_zip(content)
    else:
        raise ValidationError("Unsupported file type")

    text = text.strip()
    if len(text) < 20:
        raise ValidationError("Document contains too little text to index")
    if len(text) > MAX_EXTRACT_CHARS:
        text = text[:MAX_EXTRACT_CHARS]
        logger.warning("Document truncated to %s characters", MAX_EXTRACT_CHARS)
    return text


def _extract_pdf(content: bytes) -> str:
    from pypdf import PdfReader

    reader = PdfReader(io.BytesIO(content))
    parts = []
    for page in reader.pages:
        parts.append(page.extract_text() or "")
    return "\n\n".join(parts)


def _extract_docx(content: bytes) -> str:
    from docx import Document

    doc = Document(io.BytesIO(content))
    return "\n\n".join(p.text for p in doc.paragraphs if p.text.strip())


def _extract_zip(content: bytes) -> str:
    """Extract text from all readable files inside a ZIP archive."""
    INNER_ALLOWED = {".pdf", ".txt", ".md", ".docx"}
    parts: list[str] = []
    try:
        with zipfile.ZipFile(io.BytesIO(content)) as zf:
            for name in zf.namelist():
                ext = Path(name).suffix.lower()
                if ext not in INNER_ALLOWED:
                    continue
                try:
                    inner = zf.read(name)
                    parts.append(f"=== {name} ===\n{extract_text(name, inner)}")
                except Exception as e:
                    logger.warning("ZIP: skipped %s — %s", name, e)
    except zipfile.BadZipFile:
        raise ValidationError("Invalid or corrupt ZIP file")
    if not parts:
        raise ValidationError("ZIP contains no readable documents (PDF, TXT, MD, DOCX)")
    return "\n\n".join(parts)
