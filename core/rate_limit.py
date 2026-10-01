from collections import defaultdict
import os
import time

from fastapi import HTTPException, Request

_requests: dict[str, list[float]] = defaultdict(list)
WINDOW = 60
MAX_REQUESTS = 30
MAX_TRACKED_CLIENTS = 5000


def _client_key(request: Request) -> str:
    # Na Vercel, o cabe?alho abaixo ? definido pela borda da plataforma.
    # Fora desse ambiente, use o peer real da conex?o para n?o aceitar
    # um IP arbitr?rio fornecido pelo pr?prio cliente.
    if os.getenv("VERCEL"):
        forwarded = request.headers.get("x-vercel-forwarded-for")
        if forwarded:
            return forwarded.split(",", 1)[0].strip()

    return request.client.host if request.client else "unknown"


def rate_limit(request: Request):
    ip = _client_key(request)
    now = time.monotonic()

    recent = [timestamp for timestamp in _requests[ip] if now - timestamp < WINDOW]
    if len(recent) >= MAX_REQUESTS:
        raise HTTPException(
            status_code=429,
            detail="Muitas requisições. Aguarde um momento.",
            headers={"Retry-After": str(WINDOW)},
        )

    recent.append(now)
    _requests[ip] = recent

    # Evita crescimento ilimitado do dicionário em processos de longa duração.
    if len(_requests) > MAX_TRACKED_CLIENTS:
        stale_keys = [
            key
            for key, timestamps in _requests.items()
            if not timestamps or now - timestamps[-1] >= WINDOW
        ]
        for key in stale_keys[: len(_requests) - MAX_TRACKED_CLIENTS]:
            _requests.pop(key, None)
