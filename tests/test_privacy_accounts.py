"""Regressões de autenticação individual e minimização de dados HTTP.

Não exige credenciais/infraestrutura reais nem inclui dados identificáveis.
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ.setdefault("ADMIN_USER", "test-admin")
os.environ.setdefault("ADMIN_PASSWORD", "test-password")
os.environ.setdefault("JWT_SECRET", "test-only-jwt-secret-that-is-long-enough-for-ci")
os.environ.setdefault("ENCRYPTION_KEY", "MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDA=")

import pytest
from fastapi.testclient import TestClient
from api import index as api
from core import auth
from core.audit import _actor_tag
from core.operator_accounts import (
    OperatorAccount,
    create_password_hash,
    load_operator_accounts,
    verify_password,
)


def test_password_hash_and_account_schema():
    encoded = create_password_hash("senha-forte-completa-2026")
    assert encoded.startswith("pbkdf2_sha256$")
    assert verify_password("senha-forte-completa-2026", encoded)
    assert not verify_password("senha-errada-2026", encoded)
    accounts = load_operator_accounts(
        '{"operador.01":{"password_hash":"' + encoded + '","role":"admin","active":true}}'
    )
    assert accounts["operador.01"].role == "admin"
    assert not load_operator_accounts(None)


@pytest.mark.parametrize("invalid", [
    "{",
    "{}",
    '[]',
    '{"operador.01":{"password_hash":"plain","role":"admin","active":true}}',
    '{"operador.01":{"password_hash":"pbkdf2_sha256$1$bad$bad","role":"admin","active":true}}',
    '{"operador.01":{"password_hash":"plain","role":"operator","active":true}}',
])
def test_invalid_operator_config_fails_closed(invalid):
    with pytest.raises(RuntimeError):
        load_operator_accounts(invalid)


def test_operator_login_and_revocation_by_account_version(monkeypatch):
    encoded = create_password_hash("senha-individual-2026")
    admin = OperatorAccount(password_hash=encoded, role="admin", active=True)
    accounts = {"operador.01": admin}
    monkeypatch.setattr(api, "OPERATOR_ACCOUNTS", accounts)
    monkeypatch.setattr(auth, "OPERATOR_ACCOUNTS", accounts)

    with TestClient(api.app) as client:
        assert client.post("/api/auth/token", json={
            "username": "test-admin", "password": "test-password",
        }).status_code == 401
        assert client.post("/api/auth/token", json={
            "username": "operador.01", "password": "errada",
        }).status_code == 401
        response = client.post("/api/auth/token", json={
            "username": "operador.01", "password": "senha-individual-2026",
        })
        assert response.status_code == 200
        assert client.get("/api/auth/session").json()["subject"] == "operador.01"

        # A mesma sessão passa a ser recusada após desativação.
        accounts["operador.01"] = OperatorAccount(password_hash=encoded, role="admin", active=False)
        assert client.get("/api/auth/session").status_code == 401


def test_privacy_headers_on_success_and_unauthorized():
    with TestClient(api.app) as client:
        for response in (client.get("/api/health"), client.get("/api/directory")):
            assert "no-store" in response.headers["cache-control"]
            assert response.headers["pragma"] == "no-cache"
            assert response.headers["x-content-type-options"] == "nosniff"
            assert response.headers["referrer-policy"] == "no-referrer"
            assert "noarchive" in response.headers["x-robots-tag"]
            assert response.headers["x-request-id"]


def test_audit_tag_does_not_expose_identifier(monkeypatch):
    monkeypatch.setenv("AUDIT_PSEUDONYM_KEY", "chave-de-teste-apenas")
    assert _actor_tag(None) is None
    tag = _actor_tag("operador.01")
    assert tag and "operador.01" not in tag and len(tag) == 20
    assert tag == _actor_tag("operador.01")
