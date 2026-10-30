"""Contas individuais configuráveis, sem senha em claro no repositório.

OPERATOR_ACCOUNTS_JSON é um objeto JSON de usuário -> {password_hash, role, active}.
Na ausência da variável, o legado ADMIN_USER/ADMIN_PASSWORD permanece ativo até a migração.
"""
from dataclasses import dataclass
import hashlib
import hmac
import json
import re
import secrets
from typing import Mapping


_HASH_PATTERN = re.compile(r"^pbkdf2_sha256\$(\d+)\$([0-9a-f]{32})\$([0-9a-f]{64})$")
_USERNAME_PATTERN = re.compile(r"^[a-zA-Z0-9][a-zA-Z0-9._-]{2,63}$")
MIN_ITERATIONS = 300_000
DEFAULT_ITERATIONS = 600_000


@dataclass(frozen=True)
class OperatorAccount:
    password_hash: str
    role: str
    active: bool

    def credential_version(self, username: str) -> str:
        """Versão opaca; invalidada ao alterar senha, papel ou estado."""
        data = f"{username}:{self.password_hash}:{self.role}:{self.active}".encode("utf-8")
        return hashlib.sha256(data).hexdigest()[:24]


def create_password_hash(password: str, *, iterations: int = DEFAULT_ITERATIONS) -> str:
    if len(password) < 12:
        raise ValueError("A senha do operador deve ter pelo menos 12 caracteres.")
    if iterations < MIN_ITERATIONS:
        raise ValueError("Número de iterações PBKDF2 abaixo do mínimo.")
    salt = secrets.token_bytes(16)
    derived = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return f"pbkdf2_sha256${iterations}${salt.hex()}${derived.hex()}"


def validate_password_hash(encoded: str) -> bool:
    if not isinstance(encoded, str):
        return False
    match = _HASH_PATTERN.fullmatch(encoded)
    return bool(match and int(match.group(1)) >= MIN_ITERATIONS)


def verify_password(password: str, encoded: str) -> bool:
    if not validate_password_hash(encoded):
        return False
    match = _HASH_PATTERN.fullmatch(encoded)
    if match is None:
        return False
    iterations = int(match.group(1))
    salt = bytes.fromhex(match.group(2))
    expected = bytes.fromhex(match.group(3))
    actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return hmac.compare_digest(actual, expected)


def load_operator_accounts(raw: str | None) -> Mapping[str, OperatorAccount]:
    if raw is None or not raw.strip():
        return {}
    try:
        entries = json.loads(raw)
    except (ValueError, TypeError) as exc:
        raise RuntimeError("OPERATOR_ACCOUNTS_JSON deve ser um JSON válido.") from exc

    if not isinstance(entries, dict) or not entries:
        raise RuntimeError("OPERATOR_ACCOUNTS_JSON deve conter um objeto não vazio.")

    accounts: dict[str, OperatorAccount] = {}
    for username, entry in entries.items():
        if not isinstance(username, str) or not _USERNAME_PATTERN.fullmatch(username):
            raise RuntimeError("Nome de operador inválido em OPERATOR_ACCOUNTS_JSON.")
        if not isinstance(entry, dict) or set(entry) != {"password_hash", "role", "active"}:
            raise RuntimeError("Conta de operador deve declarar password_hash, role e active.")
        if (not isinstance(entry["role"], str)
                or entry["role"] not in {"admin", "operator"}
                or not isinstance(entry["active"], bool)
                or not validate_password_hash(entry["password_hash"])):
            raise RuntimeError("Configuração de conta de operador inválida.")
        accounts[username] = OperatorAccount(
            password_hash=entry["password_hash"],
            role=entry["role"],
            active=entry["active"],
        )

    if not any(account.active and account.role == "admin" for account in accounts.values()):
        raise RuntimeError("É obrigatório pelo menos um administrador ativo.")
    return accounts
