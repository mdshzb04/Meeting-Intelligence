"""OpenAI Whisper transcription service."""

import logging
import tempfile
import os
from openai import OpenAI

from app.config import get_settings
from app.exceptions import AIServiceError

logger = logging.getLogger(__name__)

# Supported audio formats
SUPPORTED_FORMATS = {"mp3", "wav", "m4a", "mp4", "webm", "mpeg", "mpga"}
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25MB (OpenAI limit)


def validate_audio_file(filename: str, file_size: int) -> None:
    """Validate audio file format and size."""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in SUPPORTED_FORMATS:
        raise AIServiceError(
            f"Unsupported audio format: .{ext}. Supported: {', '.join(SUPPORTED_FORMATS)}"
        )
    if file_size > MAX_FILE_SIZE:
        raise AIServiceError(
            f"File too large ({file_size // (1024*1024)}MB). Maximum: 25MB"
        )


async def transcribe_audio(file_content: bytes, filename: str) -> str:
    """Transcribe audio using OpenAI Whisper API.

    Uses a temporary file because OpenAI SDK requires a file-like object.
    Temp files are cleaned up immediately after use (safe for Render).
    """
    settings = get_settings()
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    # Write to temp file (cleaned up automatically)
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(
            suffix=f".{filename.rsplit('.', 1)[-1]}",
            delete=False,
        ) as tmp:
            tmp.write(file_content)
            tmp_path = tmp.name

        logger.info(f"Transcribing audio: {filename} ({len(file_content)} bytes)")

        with open(tmp_path, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                response_format="text",
            )

        logger.info(f"Transcription complete: {len(transcription)} chars")
        return transcription

    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        raise AIServiceError(f"Audio transcription failed: {str(e)}")
    finally:
        # Always clean up temp file
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
