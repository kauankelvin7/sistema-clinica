"""
Módulo de Autenticação JWT
Sistema de Homologação de Atestados Médicos

[SECURITY HARDENING]
- HOTFIX-01: Removido fallback hardcoded de JWT_SECRET.
  A aplicação agora lança RuntimeError na inicialização se a variável
  de ambiente não estiver configurada. Isso impede que o servidor suba
  com uma chave pública e previsível em produção.
"""

from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import os
from datetime import datetime, timedelta

bearer = HTTPBearer()

# [HOTFIX-01] — Remoção de Fallback Hardcoded (Credenciais)
#
# ANTES (VULNERÁVEL):
#   SECRET = os.getenv("JWT_SECRET", "super-secret-key-dev-only")
#
# RISCO: Se JWT_SECRET não estiver definido no ambiente de deploy (Vercel, Railway,
# Render), a aplicação subia normalmente usando a chave pública "super-secret-key-dev-only".
# Qualquer pessoa com acesso ao código-fonte poderia assinar JWTs válidos e se autenticar.
#
# CORREÇÃO: Lança RuntimeError imediatamente na importação do módulo.
# O servidor NÃO SOBE sem a variável configurada — falha rápida e explícita (Fail-Fast).
_jwt_secret = os.getenv("JWT_SECRET")
if not _jwt_secret:
    raise RuntimeError(
        "[SEGURANÇA CRÍTICA] A variável de ambiente JWT_SECRET não está definida. "
        "Configure-a antes de iniciar o servidor. "
        "Dica: gere uma chave segura com: python -c \"import secrets; print(secrets.token_hex(64))\""
    )

SECRET: str = _jwt_secret
ALGORITHM = "HS256"


def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """
    Cria um JWT assinado com o SECRET do ambiente.

    Args:
        data: Payload a ser codificado no token.
        expires_delta: Duração de validade. Padrão: 12 horas.

    Returns:
        str: Token JWT assinado.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(hours=12))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET, algorithm=ALGORITHM)


def require_auth(credentials: HTTPAuthorizationCredentials = Security(bearer)):
    """
    Dependência FastAPI para proteção de rotas via Bearer Token.
    Valida a assinatura e expiração do JWT recebido no header Authorization.

    Raises:
        HTTPException 401: Se o token estiver expirado ou for inválido.
    """
    try:
        payload = jwt.decode(credentials.credentials, SECRET, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Token expirado. Por favor, faça login novamente."
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Token inválido."
        )
