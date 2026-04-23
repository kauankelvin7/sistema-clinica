from fastapi import Request, HTTPException
from collections import defaultdict
import time
import os

_requests: dict = defaultdict(list)
WINDOW = 60   # segundos
MAX_REQUESTS = 30  # requests permitidos por IP na janela

def rate_limit(request: Request):
    # Pega o IP, na Vercel o IP real geralmente vem no X-Forwarded-For
    ip = request.headers.get("x-forwarded-for")
    if not ip:
        ip = request.client.host if request.client else "127.0.0.1"
        
    now = time.time()
    
    # Limpa requests antigos fora da janela de tempo
    _requests[ip] = [t for t in _requests[ip] if now - t < WINDOW]
    
    if len(_requests[ip]) >= MAX_REQUESTS:
        raise HTTPException(status_code=429, detail="Muitas requisições. Aguarde um momento.")
        
    _requests[ip].append(now)
