"""Auditoria técnica minimizada; sem IP literal, query string ou valores clínicos.

A rastreabilidade de atos médicos exige persistência e integridade adicionais;
estes logs de requisições são apenas camada de observabilidade.
"""
import hashlib
import hmac
import os
import time
from uuid import uuid4

from fastapi import Request
import structlog


structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.JSONRenderer(),
    ],
)

log = structlog.get_logger()


def _actor_tag(actor: str | None) -> str | None:
    if not actor:
        return None
    # Reutiliza chave do ambiente sem expor identificadores diretamente no log.
    key = os.environ.get("AUDIT_PSEUDONYM_KEY") or os.environ.get("JWT_SECRET")
    if not key:
        return None
    return hmac.new(key.encode("utf-8"), actor.encode("utf-8"), hashlib.sha256).hexdigest()[:20]


async def audit_middleware(request: Request, call_next):
    if request.method == "OPTIONS":
        return await call_next(request)

    started = time.monotonic()
    correlation_id = str(uuid4())
    status = 500
    try:
        response = await call_next(request)
        status = response.status_code
        response.headers["X-Request-ID"] = correlation_id
        return response
    finally:
        route = request.scope.get("route")
        safe_path = getattr(route, "path", None) or request.url.path
        log.info(
            "api_request_audit",
            request_id=correlation_id,
            method=request.method,
            route=safe_path,
            status=status,
            actor_tag=_actor_tag(getattr(request.state, "actor", None)),
            actor_role=getattr(request.state, "actor_role", None),
            duration_ms=round((time.monotonic() - started) * 1000, 2),
        )
