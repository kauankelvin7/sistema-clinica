import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

os.environ.setdefault("ADMIN_USER", "test-admin")
os.environ.setdefault("ADMIN_PASSWORD", "test-password")
os.environ.setdefault("JWT_SECRET", "test-only-jwt-secret-that-is-long-enough-for-ci")
os.environ.setdefault("ENCRYPTION_KEY", "MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDA=")

from fastapi.testclient import TestClient
import pytest

from api.index import app


def test_health_is_lightweight_and_public():
    with TestClient(app) as client:
        response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_directory_requires_authentication():
    with TestClient(app) as client:
        response = client.get("/api/directory")
    assert response.status_code == 401


def test_invalid_login_is_rejected():
    with TestClient(app) as client:
        response = client.post(
            "/api/auth/token",
            json={"username": "wrong", "password": "wrong", "remember_me": False},
        )
    assert response.status_code == 401


def test_cross_origin_write_is_blocked():
    with TestClient(app) as client:
        response = client.post(
            "/api/auth/logout",
            headers={"Origin": "https://attacker.invalid"},
        )
    assert response.status_code == 403


@pytest.mark.parametrize("remember_me", [False, True])
def test_login_cookie_session_and_logout(remember_me, monkeypatch):
    monkeypatch.setattr("api.index._admin_user", "test-admin")
    monkeypatch.setattr("api.index._admin_pass", "test-password")
    with TestClient(app) as client:
        response = client.post("/api/auth/token", json={
            "username": "test-admin", "password": "test-password",
            "remember_me": remember_me,
        })
        assert response.status_code == 200
        assert response.json() == {"authenticated": True}
        cookie = response.headers["set-cookie"].lower()
        assert "httponly" in cookie
        assert "samesite=lax" in cookie
        assert ("max-age=2592000" in cookie) == remember_me
        assert client.get("/api/auth/session").json()["authenticated"] is True
        assert client.post("/api/auth/logout").status_code == 200
        assert client.get("/api/auth/session").status_code == 401
