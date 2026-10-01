import os

os.environ.setdefault("ADMIN_USER", "test-admin")
os.environ.setdefault("ADMIN_PASSWORD", "test-password")
os.environ.setdefault("JWT_SECRET", "test-only-jwt-secret-that-is-long-enough-for-ci")
os.environ.setdefault("ENCRYPTION_KEY", "MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDA=")

from fastapi.testclient import TestClient

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
