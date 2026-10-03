"""Modelos de texto persistidos e emissão no layout HTML da declaração."""
import html
import json
import os
import re
from datetime import datetime, timezone
from uuid import uuid4

from core.crypto import decrypt, encrypt
from core.db_manager import IS_PRODUCTION, get_db_connection
from core.html_generator import get_html_template, get_logo_base64

TOKEN = re.compile(r"\{\{([a-z][a-z0-9_]{0,39})\}\}")


def field_keys(body):
    keys = list(dict.fromkeys(TOKEN.findall(body)))
    remainder = TOKEN.sub("", body)
    if "{{" in remainder or "}}" in remainder or len(keys) > 30:
        raise ValueError("Use campos como {{nome}}, com letras minúsculas, números e _. Limite: 30 campos.")
    return keys


def _execute(connection, query, params=None):
    if IS_PRODUCTION:
        from sqlalchemy import text
        return connection.execute(text(query), params or {})
    return connection.execute(query, params or {})


def _decode(row):
    record = dict(row._mapping if IS_PRODUCTION else row)
    return {**json.loads(decrypt(record['payload'])), 'id': record['id'],
            'revision': record['revision'], 'updated_at': record['updated_at']}


def list_models():
    with get_db_connection() as connection:
        rows = _execute(connection, 'SELECT id, payload, revision, updated_at FROM document_models ORDER BY updated_at DESC, id').fetchall()
        return [_decode(row) for row in rows]


def get_model(model_id):
    with get_db_connection() as connection:
        row = _execute(connection, 'SELECT id, payload, revision, updated_at FROM document_models WHERE id = :id', {'id': model_id}).fetchone()
        return _decode(row) if row else None


def save_model(payload, model_id=None, revision=None):
    if not os.getenv('ENCRYPTION_KEY'):
        raise RuntimeError('Configure ENCRYPTION_KEY para salvar modelos com uma chave persistente.')
    now = datetime.now(timezone.utc).isoformat()
    encrypted = encrypt(json.dumps(payload, ensure_ascii=False))
    model_id = model_id or str(uuid4())
    with get_db_connection() as connection:
        if revision is None:
            _execute(connection, 'INSERT INTO document_models (id, payload, revision, updated_at) VALUES (:id, :payload, 1, :updated_at)',
                     {'id': model_id, 'payload': encrypted, 'updated_at': now})
            next_revision = 1
        else:
            result = _execute(connection, 'UPDATE document_models SET payload = :payload, revision = revision + 1, updated_at = :updated_at WHERE id = :id AND revision = :revision',
                              {'id': model_id, 'payload': encrypted, 'updated_at': now, 'revision': revision})
            if result.rowcount != 1:
                return None
            next_revision = revision + 1
    return {**payload, 'id': model_id, 'revision': next_revision, 'updated_at': now}


def render_model(model, values):
    keys = field_keys(model['body'])
    if set(values) != set(keys) or any(not values[key].strip() for key in keys):
        raise ValueError('Preencha todos os campos do modelo.')
    if 'cpf' in values and not re.fullmatch(r'\d{3}\.\d{3}\.\d{3}-\d{2}|\d{11}', values['cpf'].strip()):
        raise ValueError('Informe o CPF com 11 dígitos.')
    # Uma passagem: valores contendo marcadores não são reinterpretados.
    body = TOKEN.sub(lambda match: values[match.group(1)].strip(), model['body'])
    safe_body = html.escape(body, quote=True).replace('\n', '<br>')
    template = get_html_template()
    # Reutiliza o primeiro documento; decisão/prontuário pertencem somente à homologação.
    first_page = template.split('<!-- PÁGINA 2 - PRONTUÁRIO -->', 1)[0]
    first_page = first_page.replace('<title>Declaração Médica</title>', '<title>{titulo_documento}</title>')
    decision_start = first_page.index('<!-- CAIXA DE DECISÃO -->')
    signature_start = first_page.index('<!-- ASSINATURA -->', decision_start)
    first_page = first_page[:decision_start] + first_page[signature_start:]
    first_page = first_page.replace('</style>', '''
        .page { height: auto; }
        .main-text { overflow-wrap: anywhere; }
        @media print {
            .page { width: 100%; height: auto; min-height: 270mm; page-break-after: auto !important; }
            .header, .signature-section, .footer { break-inside: avoid; }
        }
    </style>''')
    replacements = {
        'logo_base64': get_logo_base64(),
        'titulo_documento': html.escape(model['title'], quote=True),
        'texto_principal': safe_body,
        'data_atual': datetime.now().strftime('%d/%m/%Y'),
    }
    # Substitui somente placeholders do layout, sem reprocessar texto do usuário.
    return re.sub(r'\{(logo_base64|titulo_documento|texto_principal|data_atual)\}',
                  lambda match: replacements[match.group(1)], first_page) + '</body>\n</html>'
