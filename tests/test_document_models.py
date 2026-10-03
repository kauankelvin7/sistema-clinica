import os
import sys
from pathlib import Path

os.environ.setdefault('ADMIN_USER', 'test-admin')
os.environ.setdefault('ADMIN_PASSWORD', 'test-password')
os.environ.setdefault('JWT_SECRET', 'test-only-jwt-secret-that-is-long-enough-for-ci')
os.environ.setdefault('ENCRYPTION_KEY', 'MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDA=')
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import pytest
from fastapi.testclient import TestClient
from api.index import app
from core.document_models import get_model, render_model

MODEL = {'title': 'Modelo sintético', 'body': 'Texto de {{nome}}. CPF: {{cpf}}.\nCargo: {{cargo}}.',
         'fields': [{'key': 'nome', 'label': 'Nome'}, {'key': 'cpf', 'label': 'CPF'}, {'key': 'cargo', 'label': 'Cargo'}]}


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr('core.db_manager.DB_FILE', tmp_path / 'models.db')
    monkeypatch.setattr('api.index._admin_user', 'test-admin')
    monkeypatch.setattr('api.index._admin_pass', 'test-password')
    from core.rate_limit import _requests
    _requests.clear()
    with TestClient(app) as client:
        yield client


def login(client):
    assert client.post('/api/auth/token', json={'username': 'test-admin', 'password': 'test-password'}).status_code == 200


def test_model_auth_and_cross_origin(client):
    response = client.get('/api/document-models')
    assert response.status_code == 401
    assert 'no-store' in response.headers['cache-control']
    response = client.post('/api/document-models', json=MODEL)
    assert response.status_code == 401
    assert 'no-store' in response.headers['cache-control']
    login(client)
    assert client.post('/api/document-models', json=MODEL, headers={'Origin': 'https://attacker.invalid'}).status_code == 403


def test_model_save_reload_edit_revision_and_encrypted_storage(client):
    login(client)
    response = client.post('/api/document-models', json=MODEL)
    assert response.status_code == 201
    assert 'no-store' in response.headers['cache-control']
    record = response.json()
    assert record['revision'] == 1
    assert get_model(record['id'])['body'] == MODEL['body']
    from core.db_manager import get_db_connection
    with get_db_connection() as connection:
        stored = connection.execute('SELECT payload FROM document_models').fetchone()[0]
        assert MODEL['title'] not in stored and MODEL['body'] not in stored
    edited = {**MODEL, 'title': 'Título alterado', 'revision': 1}
    response = client.post('/api/document-models/' + record['id'], json=edited)
    assert response.status_code == 200 and response.json()['revision'] == 2
    assert client.post('/api/document-models/' + record['id'], json=edited).status_code == 409
    response = client.get('/api/document-models')
    assert response.json()[0]['title'] == 'Título alterado'
    assert 'no-store' in response.headers['cache-control']
    stale = client.post('/api/document-models/' + record['id'] + '/generate', json={'revision': 1, 'values': {}})
    assert stale.status_code == 409
    assert 'no-store' in stale.headers['cache-control']


def test_model_render_escapes_content_and_preserves_shared_layout(client):
    login(client)
    model = client.post('/api/document-models', json=MODEL).json()
    values = {'nome': '<script>alert(1)</script>{{cargo}}', 'cpf': '111.222.333-44', 'cargo': '<img src=x onerror=alert(1)>'}
    response = client.post('/api/document-models/' + model['id'] + '/generate', json={'revision': 1, 'values': values})
    assert response.status_code == 200
    content = response.text
    assert 'NOVA | Medicina e Segurança do Trabalho.' in content
    assert 'Médico do trabalho / Examinador' in content
    assert 'NOVA MEDICINA E SEGURANÇA DO TRABALHO LTDA.' in content
    assert '111.222.333-44' in content
    assert '&lt;script&gt;' in content and '<script>' not in content
    assert '{{cargo}}' in content  # valor não dispara nova substituição
    assert '<img src=x' not in content
    assert 'decision-box"' not in content and 'PRONTUÁRIO DE PERÍCIA MÉDICA' not in content
    assert content.count('<div class="page"') == 1
    assert 'no-store' in response.headers['cache-control']
    assert client.get('/api/document-models').json()[0]['body'] == MODEL['body']


@pytest.mark.parametrize('change', [
    {'body': 'Campo {{nome inválido}}'}, {'body': 'Sem campo', 'fields': MODEL['fields']},
    {'fields': [*MODEL['fields'], MODEL['fields'][0]]}, {'title': '   '}, {'body': 'x' * 20001},
])
def test_invalid_models_are_rejected(client, change):
    login(client)
    response = client.post('/api/document-models', json={**MODEL, **change})
    assert response.status_code == 422
    assert 'no-store' in response.headers['cache-control']
    assert client.get('/api/document-models').json() == []


@pytest.mark.parametrize('values', [{}, {'nome': '', 'cpf': '111.222.333-44', 'cargo': 'Teste'},
                                      {'nome': 'Pessoa', 'cpf': '123', 'cargo': 'Teste'},
                                      {'nome': 'Pessoa', 'cpf': '11122233344', 'cargo': 'Teste', 'extra': 'x'},
                                      {'nome': 'x' * 2001, 'cpf': '11122233344', 'cargo': 'Teste'}])
def test_invalid_fill_is_rejected(client, values):
    login(client)
    model = client.post('/api/document-models', json=MODEL).json()
    assert client.post('/api/document-models/' + model['id'] + '/generate', json={'revision': 1, 'values': values}).status_code == 422


def test_static_model_and_literal_layout_placeholders_are_not_interpreted(client):
    login(client)
    payload = {'title': '<b>Título</b>', 'body': 'Texto fixo {logo_base64} <script>teste</script>', 'fields': []}
    model = client.post('/api/document-models', json=payload).json()
    content = render_model(model, {})
    assert '&lt;b&gt;Título&lt;/b&gt;' in content
    assert '{logo_base64}' in content
    assert '&lt;script&gt;teste&lt;/script&gt;' in content


def test_models_do_not_save_with_temporary_key(client, monkeypatch):
    login(client)
    monkeypatch.delenv('ENCRYPTION_KEY')
    assert client.post('/api/document-models', json=MODEL).status_code == 503
    assert client.get('/api/document-models').json() == []
