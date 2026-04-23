from fastapi import Request
import structlog
import time

# Configura o structlog para saídas mais fáceis de analisar (JSON na Vercel seria ideal, mas usaremos a saída limpa)
structlog.configure(
    processors=[
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer()
    ]
)

log = structlog.get_logger()

async def audit_middleware(request: Request, call_next):
    start = time.time()
    
    # Ignora rotas preflight CORS (OPTIONS)
    if request.method == "OPTIONS":
        return await call_next(request)
        
    response = await call_next(request)
    duration = time.time() - start

    # Pega o IP real (considerando proxy/Vercel)
    ip = request.headers.get("x-forwarded-for") or (request.client.host if request.client else "unknown")

    log.info(
        "api_request_audit",
        method=request.method,
        path=request.url.path,
        status=response.status_code,
        ip=ip,
        duration_ms=round(duration * 1000, 2),
    )
    return response
