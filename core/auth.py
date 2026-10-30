"""Autenticação JWT; suporte a contas individuais com revogação por configuração."""
import os
import jwt
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

from fastapi import Request, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from core.operator_accounts import load_operator_accounts

bearer = HTTPBearer(auto_error=False)

# Compatibilidade com o ambiente local existente.
env_path = Path(__file__).resolve().parent.parent / ".env"
if env_path.exists():
    try:
        from dotenv import load_dotenv
        load_dotenv(dotenv_path=env_path)
    except ImportError:
        with open(env_path, "r", encoding="utf-8") as env_file:
            for line in env_file:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    os.environ.setdefault(key.strip(), value.strip().strip("'\""))

_jwt_secret = os.getenv("JWT_SECRET")
if not _jwt_secret:
    raise RuntimeError(
        "[SEGURANÇA CRÍTICA] JWT_SECRET não está definida. "
        'Gere uma chave: python -c "import secrets; print(secrets.token_hex(64))"'
    )

SECRET: str = _jwt_secret
ALGORITHM = "HS256"

# Configuração inválida não faz fallback para o admin compartilhado.
OPERATOR_ACCOUNTS = load_operator_accounts(os.getenv("OPERATOR_ACCOUNTS_JSON"))


def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta if expires_delta else timedelta(hours=12))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET, algorithm=ALGORITHM)


def require_auth(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Security(bearer),
):
    """Exige sessão válida e, no modo de operadores, conta ativa na versão atual."""
    token = None
    if credentials and credentials.credentials:
        token = credentials.credentials
    else:
        auth_header = request.headers.get("authorization")
        if auth_header:
            parts = auth_header.split()
            if len(parts) == 2 and parts[0].lower() == "bearer":
                token = parts[1]

    if not token:
        token = request.cookies.get("session_token")
    if not token:
        raise HTTPException(status_code=401, detail="Não autenticado.")

    try:
        payload = jwt.decode(token, SECRET, algorithms=[ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado. Por favor, faça login novamente.") from None
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido. Por favor, faça login novamente.") from None

    subject = payload.get("sub")
    if not isinstance(subject, str) or not subject:
        raise HTTPException(status_code=401, detail="Sessão inválida.")

    if OPERATOR_ACCOUNTS:
        account = OPERATOR_ACCOUNTS.get(subject)
        if (account is None or not account.active
                or payload.get("credential_version") != account.credential_version(subject)
                or payload.get("role") != account.role):
            raise HTTPException(status_code=401, detail="Sessão revogada ou sem permissão.")

    # Só atributos de sessão, nunca documento/CID/nome de paciente.
    request.state.actor = subject
    request.state.actor_role = payload.get("role", "legacy-admin")
    return payload
