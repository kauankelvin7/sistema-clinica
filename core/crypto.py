from cryptography.fernet import Fernet
import os
import logging

logger = logging.getLogger(__name__)

# Tenta carregar a chave, senão gera uma temporária (apenas para dev, na Vercel DEVE existir ENCRYPTION_KEY)
_env_key = os.getenv("ENCRYPTION_KEY")
_is_production = bool(
    os.getenv("VERCEL")
    or os.getenv("RENDER")
    or os.getenv("RAILWAY_ENVIRONMENT")
)

if _env_key:
    _key = _env_key.encode()
elif _is_production:
    raise RuntimeError(
        "[SEGURANÇA CRÍTICA] ENCRYPTION_KEY não está definida em produção. "
        "A aplicação não será iniciada para evitar perda ou corrupção de dados criptografados."
    )
else:
    logger.warning(
        "ENCRYPTION_KEY não encontrada em desenvolvimento; usando uma chave temporária "
        "que será perdida ao reiniciar."
    )
    _key = Fernet.generate_key()

try:
    _fernet = Fernet(_key)
except (ValueError, TypeError) as exc:
    raise RuntimeError(
        "[SEGURANÇA CRÍTICA] ENCRYPTION_KEY inválida. Use uma chave Fernet válida."
    ) from exc

def encrypt(value: str) -> str:
    if not value:
        return value
    return _fernet.encrypt(value.encode()).decode()

def decrypt(value: str) -> str:
    if not value:
        return value
    try:
        return _fernet.decrypt(value.encode()).decode()
    except Exception as e:
        logger.error(f"Erro ao descriptografar valor. O dado original não estava criptografado ou a chave mudou. Retornando valor bruto/vazio. Erro: {e}")
        return value

import hashlib

def generate_hash(value: str) -> str:
    """Gera um hash determinístico para buscas e deduplicação."""
    if not value:
        return ""
    # Usamos a chave de criptografia como salt para o hash
    salt = _key.decode()
    return hashlib.sha256((value + salt).encode()).hexdigest()
