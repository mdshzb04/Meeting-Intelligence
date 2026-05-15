#!/usr/bin/env bash
# Use uv + a real CPython (system /usr/bin/python3.12 may be a Cursor shim on some setups).
set -euo pipefail
cd "$(dirname "$0")"

PORT="${PORT:-8000}"

if command -v lsof >/dev/null 2>&1; then
  OLD_PIDS=$(lsof -ti ":${PORT}" 2>/dev/null || true)
  if [ -n "${OLD_PIDS}" ]; then
    echo "Stopping existing process on port ${PORT}..."
    # shellcheck disable=SC2086
    kill ${OLD_PIDS} 2>/dev/null || true
    sleep 1
  fi
fi

echo ""
echo "=============================================="
echo "  MeetingMind — backend API"
echo "=============================================="
echo "  In your browser, use:"
echo "    http://localhost:${PORT}          (status page)"
echo "    http://localhost:${PORT}/docs     (API explorer)"
echo ""
echo "  The web app UI is separate — run in another terminal:"
echo "    cd ../frontend && npm run dev"
echo "    → http://localhost:3000"
echo ""
echo "  Note: 0.0.0.0 is only for binding; browsers need localhost."
echo "=============================================="
echo ""

if command -v uv >/dev/null 2>&1; then
  exec uv run --python 3.12.13 uvicorn app.main:app --reload --host 0.0.0.0 --port "${PORT}"
else
  echo "Install uv: https://docs.astral.sh/uv/"
  exit 1
fi
