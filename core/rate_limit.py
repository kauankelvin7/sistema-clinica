from collections import defaultdict, deque
import os
import time

from fastapi import HTTPException, Request

_Buckets = dict[tuple[str, str], deque[float]]
_requests: _Buckets = defaultdict(deque)
MAX_TRACKED_BUCKETS = 5000


def _client_key(request: Request) -> str:
    """Usa o IP confiável da borda apenas quando executando na Vercel."""
    if os.getenv("VERCEL"):
        forwarded = request.headers.get("x-vercel-forwarded-for")
        if forwarded:
            return forwarded.split(",", 1)[0].strip()
    return request.client.host if request.client else "unknown"


def _enforce(request: Request, *, scope: str, limit: int, window: int) -> None:
    now = time.monotonic()
    key = (scope, _client_key(request))
    bucket = _requests[key]

    while bucket and now - bucket[0] >= window:
        bucket.popleft()

    if len(bucket) >= limit:
        retry_after = max(1, int(window - (now - bucket[0])))
        raise HTTPException(
            status_code=429,
            detail="Muitas requisições. Aguarde um momento.",
            headers={"Retry-After": str(retry_after)},
        )

    bucket.append(now)

    if len(_requests) > MAX_TRACKED_BUCKETS:
        stale = [
            bucket_key
            for bucket_key, values in _requests.items()
            if not values or now - values[-1] > 600
        ]
        for bucket_key in stale[: max(0, len(_requests) - MAX_TRACKED_BUCKETS)]:
            _requests.pop(bucket_key, None)


def rate_limit(request: Request) -> None:
    """Limite geral: amplo o suficiente para a UI, restrito contra abuso simples."""
    _enforce(request, scope="general", limit=90, window=60)


def rate_limit_login(request: Request) -> None:
    """Login recebe uma janela mais restrita contra brute force."""
    _enforce(request, scope="login", limit=8, window=300)
