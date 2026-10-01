"""
Sistema de Homologação de Atestados Médicos - Backend API (Vercel Serverless)
══════════════════════════════════════════════════════════════════════════════
"""

from fastapi import FastAPI, HTTPException, Query, Depends, APIRouter, Response, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.gzip import GZipMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel, validator, Field
from typing import Optional
from datetime import datetime
import sys
import os
import re
import logging
import hmac  # [HOTFIX-04] Importado para comparação de tempo constante (anti-timing attack)

# Adicionamos a raiz do projeto ao sys.path com prioridade máxima
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT_DIR)

from core.db_manager import get_db_connection, create_tables
from core.database import sanitizar_entrada
from core.html_generator import generate_html
from core.crypto import encrypt, decrypt, generate_hash
from core.auth import require_auth, create_access_token
from core.rate_limit import rate_limit, rate_limit_login
from core.audit import audit_middleware

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="Sistema de Homologação de Atestados Médicos", version="2.1.0")

# Criamos um router para as rotas da API
api_router = APIRouter()

# Sessão via cookie HttpOnly. O token continua aceito via Bearer para compatibilidade
# com clientes externos, mas o frontend não precisa mais expô-lo ao JavaScript.
_IS_PRODUCTION = bool(os.getenv("VERCEL") or os.getenv("RENDER") or os.getenv("RAILWAY_ENVIRONMENT"))
_COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "lax").lower()
if _COOKIE_SAMESITE not in {"lax", "strict", "none"}:
    _COOKIE_SAMESITE = "lax"
_COOKIE_SECURE = os.getenv(
    "COOKIE_SECURE",
    "true" if _IS_PRODUCTION else "false",
).lower() == "true"
_SESSION_COOKIE = "session_token"

# [CAMADA 6] Middleware de Auditoria
app.add_middleware(BaseHTTPMiddleware, dispatch=audit_middleware)
app.add_middleware(GZipMiddleware, minimum_size=1024, compresslevel=5)

# CORS — somente origens e cabeçalhos necessários ao frontend.
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173').rstrip('/')
ALLOWED_ORIGINS = list(dict.fromkeys([
    FRONTEND_URL,
    "http://localhost:5173",
    "http://localhost:3000",
    "https://sistema-clinica-seven.vercel.app",
]))
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

@app.middleware("http")
async def protect_cookie_authenticated_writes(request, call_next):
    """Bloqueia escritas cross-origin quando o navegador envia cookie de sessão."""
    if request.method in {"POST", "PUT", "PATCH", "DELETE"}:
        origin = request.headers.get("origin")
        if origin and origin.rstrip("/") not in ALLOWED_ORIGINS:
            return JSONResponse(status_code=403, content={"detail": "Origem não autorizada."})
    return await call_next(request)

@app.on_event("startup")
async def startup_event():
    # DDL em cada cold start aumenta latência e pode gerar locks.
    # Em produção, migrações devem ser explícitas durante manutenção/deploy.
    run_schema_migrations = (
        not _IS_PRODUCTION
        or os.getenv("RUN_SCHEMA_MIGRATIONS", "false").lower() == "true"
    )
    if not run_schema_migrations:
        logger.info("Migração de schema ignorada no cold start de produção.")
        return
    try:
        create_tables()
    except Exception as e:
        logger.error(f"Erro ao inicializar banco de dados: {e}")

# ==========================================
# [CAMADA 5] Modelos com Sanitização Robusta
# ==========================================
class PacienteData(BaseModel):
    nome: str
    tipo_documento: str
    numero_documento: str
    cargo: str
    empresa: str

    @validator("nome")
    def sanitize_nome(cls, v):
        cleaned = re.sub(r"[^a-zA-ZÀ-ÿ\s\-]", "", v).strip()
        if len(cleaned) < 2:
            raise ValueError("Nome inválido")
        return cleaned

    @validator("numero_documento")
    def sanitize_doc(cls, v):
        return re.sub(r"[^\d.\-/]", "", v)

class AtestadoData(BaseModel):
    data_atestado: str
    dias_afastamento: Optional[int] = 0
    cid: Optional[str] = ""
    cid_nao_informado: bool = False
    tipo_atestado: Optional[str] = "saude"

class MedicoData(BaseModel):
    nome: str
    tipo_registro: str
    numero_registro: str
    uf_registro: str

    @validator("nome")
    def sanitize_nome(cls, v):
        cleaned = re.sub(r"[^a-zA-ZÀ-ÿ\s\-.]", "", v).strip() # Permite '.' para "Dr."
        return cleaned

class DocumentoRequest(BaseModel):
    paciente: PacienteData
    atestado: AtestadoData
    medico: MedicoData

class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=128)
    password: str = Field(min_length=1, max_length=256)
    remember_me: bool = False

# ==========================================
# [CAMADA 3] Rota de Login / Autenticação
# ==========================================

# [HOTFIX-02] — Remoção de Fallback Hardcoded (Credenciais de Admin)
#
# ANTES (VULNERÁVEL):
#   admin_user = os.getenv("ADMIN_USER", "admin")
#   admin_pass = os.getenv("ADMIN_PASSWORD", "admin123")
#
# RISCO: Se as variáveis não estivessem definidas na plataforma de deploy,
# qualquer pessoa poderia entrar com admin/admin123.
#
# CORREÇÃO: Lança RuntimeError na inicialização do módulo.
# O servidor NÃO SOBE sem as credenciais configuradas (Fail-Fast).
_admin_user = os.getenv("ADMIN_USER")
_admin_pass = os.getenv("ADMIN_PASSWORD")
if not _admin_user or not _admin_pass:
    raise RuntimeError(
        "[SEGURANÇA CRÍTICA] As variáveis de ambiente ADMIN_USER e ADMIN_PASSWORD "
        "não estão definidas. Configure-as antes de iniciar o servidor. "
        "Jamais utilize valores padrão para credenciais em produção."
    )


@api_router.post("/auth/token")
async def login(credentials: LoginRequest, response: Response, _=Depends(rate_limit_login)):
    """
    Rota para o frontend obter o JWT.

    [HOTFIX-02] Credenciais lidas de variáveis de ambiente sem fallback.
    [HOTFIX-04] Comparação de senha via hmac.compare_digest para prevenir timing attacks.
    """
    # [HOTFIX-04] — Prevenção de Timing Attack
    #
    # ANTES (VULNERÁVEL):
    #   if credentials.username == admin_user and credentials.password == admin_pass:
    #
    # RISCO: A comparação com '==' em Python retorna False assim que encontra o primeiro
    # caractere diferente, vazando informação sobre o tamanho/prefixo correto da senha
    # para atacantes que medem o tempo de resposta (timing side-channel).
    #
    # CORREÇÃO: hmac.compare_digest() executa a comparação em tempo CONSTANTE,
    # independentemente de onde os strings divergem. Não vaza timing information.
    #
    # NOTA: Encode para bytes é necessário pois compare_digest exige str ou bytes,
    # e garante comparação byte a byte sem otimizações do Python.
    username_match = hmac.compare_digest(
        credentials.username.encode("utf-8"),
        _admin_user.encode("utf-8")
    )
    password_match = hmac.compare_digest(
        credentials.password.encode("utf-8"),
        _admin_pass.encode("utf-8")
    )

    if username_match and password_match:
        from datetime import timedelta
        expires = timedelta(days=30) if credentials.remember_me else timedelta(hours=24)
        token = create_access_token(data={"sub": credentials.username}, expires_delta=expires)
        response.set_cookie(
            key=_SESSION_COOKIE,
            value=token,
            httponly=True,
            secure=_COOKIE_SECURE,
            samesite=_COOKIE_SAMESITE,
            max_age=int(expires.total_seconds()) if credentials.remember_me else None,
            path="/",
        )
        return {"authenticated": True}

    # Resposta genérica: não especifica se foi o usuário ou a senha que falhou
    raise HTTPException(status_code=401, detail="Usuário ou senha incorretos")


@api_router.get("/auth/session")
async def auth_session(_=Depends(rate_limit), identity=Depends(require_auth)):
    return {"authenticated": True, "subject": identity.get("sub", "")}


@api_router.post("/auth/logout")
async def logout(response: Response, _=Depends(rate_limit)):
    response.delete_cookie(
        key=_SESSION_COOKIE,
        path="/",
        secure=_COOKIE_SECURE,
        samesite=_COOKIE_SAMESITE,
    )
    return {"authenticated": False}


# ==========================================
# ROTAS PROTEGIDAS
# ==========================================
@api_router.get("/")
async def root():
    return {"status": "online", "message": "API Segura - Vercel Serverless"}

@api_router.get("/consultar-profissional")
async def consultar_profissional(
    tipo_registro: str = Query(...), numero_registro: str = Query(...), uf_registro: str = Query(...),
    _=Depends(rate_limit), __=Depends(require_auth)
):
    tipo_registro = tipo_registro.strip().upper()
    numero_registro = numero_registro.strip()
    uf_registro = uf_registro.strip().upper()

    if tipo_registro == "CRM":
        url = "https://portal.cfm.org.br/busca-medicos/"
        info = "A consulta CRM requer preenchimento manual e reCAPTCHA no site oficial."
    elif tipo_registro == "CRO":
        url = f"https://website.cfo.org.br/busca-profissionais/"
        info = "A consulta CRO pode ser feita diretamente pelo link gerado."
    else:
        url = f"https://www.google.com/search?q=consulta+registro+profissional+{tipo_registro}+{numero_registro}+{uf_registro}"
        info = "A consulta pode ser feita via busca genérica (quando não há um serviço oficial)."

    return { "tipo_registro": tipo_registro, "numero_registro": numero_registro, "uf_registro": uf_registro, "consulta_url": url, "info": info }

def _persist_directory_records(paciente: PacienteData, medico: MedicoData) -> bool:
    """Persiste paciente e médico sem bloquear a geração do documento."""
    try:
        from core.db_manager import IS_PRODUCTION as is_postgres

        encrypted_patient_name = encrypt(paciente.nome)
        encrypted_patient_doc = encrypt(paciente.numero_documento)
        patient_doc_hash = generate_hash(paciente.numero_documento)
        encrypted_doctor_name = encrypt(medico.nome)
        doctor_reg_hash = generate_hash(medico.numero_registro)

        patient_type = sanitizar_entrada(paciente.tipo_documento)
        patient_role = sanitizar_entrada(paciente.cargo)
        patient_company = sanitizar_entrada(paciente.empresa)
        doctor_type = sanitizar_entrada(medico.tipo_registro)
        doctor_reg = sanitizar_entrada(medico.numero_registro)
        doctor_uf = sanitizar_entrada(medico.uf_registro)

        with get_db_connection() as conn:
            if is_postgres:
                from sqlalchemy import text

                patient_exists = conn.execute(
                    text("SELECT id FROM pacientes WHERE numero_doc_hash = :hash_doc"),
                    {"hash_doc": patient_doc_hash},
                ).fetchone()
                patient_values = {
                    "nome": encrypted_patient_name,
                    "tipo_doc": patient_type,
                    "numero_doc": encrypted_patient_doc,
                    "hash_doc": patient_doc_hash,
                    "cargo": patient_role,
                    "empresa": patient_company,
                }
                if patient_exists:
                    conn.execute(text(
                        "UPDATE pacientes SET nome_completo=:nome, tipo_doc=:tipo_doc, "
                        "numero_doc=:numero_doc, cargo=:cargo, empresa=:empresa, "
                        "data_atualizacao=CURRENT_TIMESTAMP WHERE numero_doc_hash=:hash_doc"
                    ), patient_values)
                else:
                    conn.execute(text(
                        "INSERT INTO pacientes "
                        "(nome_completo, tipo_doc, numero_doc, numero_doc_hash, cargo, empresa) "
                        "VALUES (:nome, :tipo_doc, :numero_doc, :hash_doc, :cargo, :empresa)"
                    ), patient_values)

                doctor_exists = conn.execute(
                    text("SELECT id FROM medicos WHERE crm_hash=:crm_hash AND tipo_crm=:tipo_crm"),
                    {"crm_hash": doctor_reg_hash, "tipo_crm": doctor_type},
                ).fetchone()
                doctor_values = {
                    "nome": encrypted_doctor_name,
                    "tipo_crm": doctor_type,
                    "crm": doctor_reg,
                    "crm_hash": doctor_reg_hash,
                    "uf_crm": doctor_uf,
                }
                if doctor_exists:
                    conn.execute(text(
                        "UPDATE medicos SET nome_completo=:nome, crm=:crm, uf_crm=:uf_crm, "
                        "data_atualizacao=CURRENT_TIMESTAMP "
                        "WHERE crm_hash=:crm_hash AND tipo_crm=:tipo_crm"
                    ), doctor_values)
                else:
                    conn.execute(text(
                        "INSERT INTO medicos (nome_completo, tipo_crm, crm, crm_hash, uf_crm) "
                        "VALUES (:nome, :tipo_crm, :crm, :crm_hash, :uf_crm)"
                    ), doctor_values)
            else:
                cursor = conn.cursor()
                cursor.execute("SELECT id FROM pacientes WHERE numero_doc_hash = ?", (patient_doc_hash,))
                if cursor.fetchone():
                    cursor.execute(
                        "UPDATE pacientes SET nome_completo=?, tipo_doc=?, numero_doc=?, cargo=?, empresa=?, "
                        "data_atualizacao=CURRENT_TIMESTAMP WHERE numero_doc_hash=?",
                        (encrypted_patient_name, patient_type, encrypted_patient_doc, patient_role, patient_company, patient_doc_hash),
                    )
                else:
                    cursor.execute(
                        "INSERT INTO pacientes (nome_completo, tipo_doc, numero_doc, numero_doc_hash, cargo, empresa) "
                        "VALUES (?, ?, ?, ?, ?, ?)",
                        (encrypted_patient_name, patient_type, encrypted_patient_doc, patient_doc_hash, patient_role, patient_company),
                    )

                cursor.execute("SELECT id FROM medicos WHERE crm_hash=? AND tipo_crm=?", (doctor_reg_hash, doctor_type))
                if cursor.fetchone():
                    cursor.execute(
                        "UPDATE medicos SET nome_completo=?, crm=?, uf_crm=?, data_atualizacao=CURRENT_TIMESTAMP "
                        "WHERE crm_hash=? AND tipo_crm=?",
                        (encrypted_doctor_name, doctor_reg, doctor_uf, doctor_reg_hash, doctor_type),
                    )
                else:
                    cursor.execute(
                        "INSERT INTO medicos (nome_completo, tipo_crm, crm, crm_hash, uf_crm) VALUES (?, ?, ?, ?, ?)",
                        (encrypted_doctor_name, doctor_type, doctor_reg, doctor_reg_hash, doctor_uf),
                    )

        logger.info("Diretório de paciente/médico sincronizado em segundo plano.")
        return True
    except Exception:
        logger.exception("Falha ao sincronizar diretório em segundo plano")
        return False


@api_router.post("/generate-document")
@api_router.post("/generate-pdf")
@api_router.post("/generate-html")
async def generate_html_endpoint(
    data: DocumentoRequest,
    background_tasks: BackgroundTasks,
    _=Depends(rate_limit),
    __=Depends(require_auth),
):
    try:
        documento_data = {
            "nome_paciente": data.paciente.nome,
            "tipo_doc_paciente": data.paciente.tipo_documento,
            "numero_doc_paciente": data.paciente.numero_documento,
            "cargo_paciente": data.paciente.cargo,
            "empresa_paciente": data.paciente.empresa,
            "data_atestado": data.atestado.data_atestado,
            "data_atual": datetime.now().strftime("%d/%m/%Y"),
            "qtd_dias_atestado": data.atestado.dias_afastamento,
            "codigo_cid": "NÃO INFORMADO" if data.atestado.cid_nao_informado else data.atestado.cid,
            "cid_nao_informado": data.atestado.cid_nao_informado,
            "nome_medico": data.medico.nome,
            "tipo_registro_medico": data.medico.tipo_registro,
            "crm_medico": data.medico.numero_registro,
            "uf_crm_medico": data.medico.uf_registro,
            "tipo_atestado": data.atestado.tipo_atestado or "saude",
        }

        html_content = generate_html(documento_data)
        background_tasks.add_task(_persist_directory_records, data.paciente, data.medico)
        return HTMLResponse(content=html_content, status_code=200)
    except Exception:
        logger.exception("Erro geral ao gerar HTML")
        raise HTTPException(status_code=500, detail="Não foi possível gerar o documento. Tente novamente.")


@api_router.get("/directory")
async def get_directory(response: Response, _=Depends(rate_limit), __=Depends(require_auth)):
    """
    Carrega pacientes e médicos em uma única ida ao banco.
    O navegador mantém um snapshot privado em IndexedDB e pesquisa localmente.
    """
    try:
        from core.db_manager import IS_PRODUCTION as is_postgres

        with get_db_connection() as conn:
            if is_postgres:
                from sqlalchemy import text
                patients_result = conn.execute(text(
                    "SELECT id, nome_completo, tipo_doc, numero_doc, cargo, empresa "
                    "FROM pacientes ORDER BY data_criacao DESC"
                )).fetchall()
                doctors_result = conn.execute(text(
                    "SELECT id, nome_completo, tipo_crm, crm, uf_crm "
                    "FROM medicos ORDER BY data_criacao DESC"
                )).fetchall()
            else:
                cursor = conn.cursor()
                cursor.execute(
                    "SELECT id, nome_completo, tipo_doc, numero_doc, cargo, empresa "
                    "FROM pacientes ORDER BY data_criacao DESC"
                )
                patients_result = cursor.fetchall()
                cursor.execute(
                    "SELECT id, nome_completo, tipo_crm, crm, uf_crm "
                    "FROM medicos ORDER BY data_criacao DESC"
                )
                doctors_result = cursor.fetchall()

        patients = [{
            "id": row[0],
            "nome_completo": decrypt(row[1]),
            "tipo_doc": row[2],
            "numero_doc": decrypt(row[3]),
            "cargo": row[4] or "",
            "empresa": row[5] or "",
        } for row in patients_result]
        doctors = [{
            "id": row[0],
            "nome_completo": decrypt(row[1]),
            "tipo_crm": row[2],
            "crm": row[3],
            "uf_crm": row[4],
        } for row in doctors_result]

        response.headers["Cache-Control"] = "private, no-store, max-age=0"
        response.headers["Pragma"] = "no-cache"
        return {
            "patients": patients,
            "doctors": doctors,
            "synced_at": datetime.utcnow().isoformat() + "Z",
        }
    except Exception:
        logger.exception("Erro ao sincronizar diretório local")
        raise HTTPException(status_code=503, detail="Base de cadastros temporariamente indisponível.")


@api_router.get("/patients")
async def get_patients(
    search: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    _=Depends(rate_limit),
    __=Depends(require_auth)
):
    """
    Retorna pacientes com paginação server-side.
    Como os dados estão criptografados, a busca é feita em Python
    após descriptografar uma janela de registros recentes.

    Retorna: { total, page, page_size, patients }
    """
    try:
        from core.db_manager import IS_PRODUCTION as is_postgres

        # [HOTFIX-03] — Correção de Injeção SQL via f-string
        #
        # ANTES (VULNERÁVEL):
        #   f"LIMIT {MAX_SCAN_FOR_SEARCH}"   — constante, baixo risco mas má prática
        #   f"LIMIT {page_size} OFFSET {offset}"  — CRÍTICO: page_size e page vêm do
        #   usuário via Query(). Mesmo com coerção de tipo pelo FastAPI, a interpolação
        #   direta em f-string bypassa a camada de bind parameter do driver SQL,
        #   abrindo vetor para manipulação de query se a coerção falhar.
        #
        # CORREÇÃO: Todos os valores numéricos são passados via dicionário de parâmetros
        # bindados (:param / ?), delegando ao driver a responsabilidade de escapar e
        # sanitizar. Esta é a única forma segura de construir queries dinâmicas.
        MAX_SCAN_FOR_SEARCH = 500

        with get_db_connection() as conn:
            if is_postgres:
                from sqlalchemy import text
                if search:
                    # Com busca: carrega janela de varredura via parâmetro bindado
                    sql = text(
                        "SELECT id, nome_completo, tipo_doc, numero_doc, cargo, empresa "
                        "FROM pacientes ORDER BY data_criacao DESC "
                        "LIMIT :scan_limit"  # ← parâmetro bindado, não f-string
                    )
                    count_sql = text("SELECT COUNT(*) FROM pacientes")
                    total_db = conn.execute(count_sql).scalar()
                    result = conn.execute(sql, {"scan_limit": MAX_SCAN_FOR_SEARCH}).fetchall()
                else:
                    # Sem busca: paginação com parâmetros bindados
                    count_sql = text("SELECT COUNT(*) FROM pacientes")
                    total_db = conn.execute(count_sql).scalar()
                    offset = (page - 1) * page_size
                    sql = text(
                        "SELECT id, nome_completo, tipo_doc, numero_doc, cargo, empresa "
                        "FROM pacientes ORDER BY data_criacao DESC "
                        "LIMIT :limit OFFSET :offset"  # ← parâmetro bindado, não f-string
                    )
                    result = conn.execute(sql, {"limit": page_size, "offset": offset}).fetchall()
            else:
                cursor = conn.cursor()
                if search:
                    # SQLite: placeholder '?' para parâmetros bindados
                    cursor.execute(
                        "SELECT id, nome_completo, tipo_doc, numero_doc, cargo, empresa "
                        "FROM pacientes ORDER BY data_criacao DESC "
                        "LIMIT ?",  # ← parâmetro bindado, não f-string
                        (MAX_SCAN_FOR_SEARCH,)
                    )
                    cursor2 = conn.cursor()
                    cursor2.execute("SELECT COUNT(*) FROM pacientes")
                    total_db = cursor2.fetchone()[0]
                    result = cursor.fetchall()
                else:
                    cursor.execute("SELECT COUNT(*) FROM pacientes")
                    total_db = cursor.fetchone()[0]
                    offset = (page - 1) * page_size
                    cursor.execute(
                        "SELECT id, nome_completo, tipo_doc, numero_doc, cargo, empresa "
                        "FROM pacientes ORDER BY data_criacao DESC "
                        "LIMIT ? OFFSET ?",  # ← parâmetros bindados, não f-string
                        (page_size, offset)
                    )
                    result = cursor.fetchall()

            # Descriptografa e filtra em Python (necessário por causa da criptografia)
            if search:
                search_lower = search.lower().strip()
                all_matched = []
                for r in result:
                    nome = decrypt(r[1])
                    doc = decrypt(r[3])
                    if search_lower in nome.lower() or search_lower in doc.lower():
                        all_matched.append({
                            "id": r[0],
                            "nome_completo": nome,
                            "tipo_doc": r[2],
                            "numero_doc": doc,
                            "cargo": r[4] or "",
                            "empresa": r[5] or ""
                        })

                total = len(all_matched)
                offset = (page - 1) * page_size
                patients_page = all_matched[offset: offset + page_size]
            else:
                patients_page = []
                for r in result:
                    patients_page.append({
                        "id": r[0],
                        "nome_completo": decrypt(r[1]),
                        "tipo_doc": r[2],
                        "numero_doc": decrypt(r[3]),
                        "cargo": r[4] or "",
                        "empresa": r[5] or ""
                    })
                total = total_db

            return {
                "total": total,
                "page": page,
                "page_size": page_size,
                "patients": patients_page,
            }
    except Exception:
        logger.exception("Erro ao buscar pacientes")
        raise HTTPException(
            status_code=500,
            detail="Não foi possível carregar os pacientes."
        )

@api_router.get("/doctors")
async def get_doctors(search: Optional[str] = None, _=Depends(rate_limit), __=Depends(require_auth)):
    """
    Retorna médicos com busca e diagnóstico detalhado de log.
    """
    try:
        from core.db_manager import IS_PRODUCTION as is_postgres
        logger.info(f"🔍 Buscando médicos - Banco de dados PostgreSQL/Supabase: {is_postgres}")

        with get_db_connection() as conn:
            if is_postgres:
                from sqlalchemy import text
                result = conn.execute(text("SELECT id, nome_completo, tipo_crm, crm, uf_crm FROM medicos ORDER BY data_criacao DESC")).fetchall()
            else:
                cursor = conn.cursor()
                cursor.execute("SELECT id, nome_completo, tipo_crm, crm, uf_crm FROM medicos ORDER BY data_criacao DESC")
                result = cursor.fetchall()
                
            medicos = []
            for r in result:
                nome = decrypt(r[1])
                if search and search.lower() not in nome.lower() and search not in r[3]:
                    continue
                medicos.append({"id": r[0], "nome_completo": nome, "tipo_crm": r[2], "crm": r[3], "uf_crm": r[4]})
            
            logger.info(f"✅ Sucesso ao buscar médicos! Total encontrados: {len(medicos)}")
            return medicos
    except Exception:
        logger.exception("Erro ao buscar médicos")
        raise HTTPException(
            status_code=500,
            detail="Não foi possível carregar os médicos."
        )

@api_router.get("/check-duplicate")
async def check_duplicate(tipo: str, valor: str, empresa: Optional[str] = None, _=Depends(rate_limit), __=Depends(require_auth)):
    """Verifica se um paciente (por CPF + Empresa) ou médico (por CRM) já existe."""
    try:
        h = generate_hash(valor)
        is_postgres = bool(os.getenv('DATABASE_URL')) or os.getenv('RENDER') or os.getenv('RAILWAY_ENVIRONMENT') or os.getenv('VERCEL')
        
        with get_db_connection() as conn:
            if tipo == "paciente":
                if empresa:
                    query = "SELECT id FROM pacientes WHERE numero_doc_hash = :h AND empresa = :e" if is_postgres else "SELECT id FROM pacientes WHERE numero_doc_hash = ? AND empresa = ?"
                    params = {"h": h, "e": sanitizar_entrada(empresa)} if is_postgres else (h, sanitizar_entrada(empresa))
                else:
                    query = "SELECT id FROM pacientes WHERE numero_doc_hash = :h" if is_postgres else "SELECT id FROM pacientes WHERE numero_doc_hash = ?"
                    params = {"h": h} if is_postgres else (h,)
            else:
                query = "SELECT id FROM medicos WHERE crm_hash = :h" if is_postgres else "SELECT id FROM medicos WHERE crm_hash = ?"
                params = {"h": h} if is_postgres else (h,)
            
            if is_postgres:
                from sqlalchemy import text
                result = conn.execute(text(query), params).fetchone()
            else:
                cursor = conn.cursor()
                cursor.execute(query, params)
                result = cursor.fetchone()
                
            return {"existe": bool(result)}
    except Exception:
        logger.exception("Erro ao verificar duplicidade")
        raise HTTPException(status_code=500, detail="Não foi possível verificar o cadastro.")

# Database diagnostics intentionally omitted from the public API.

# [HOTFIX-06] — Blindagem da Rota /health
#
# ANTES (VULNERÁVEL):
#   return { "status": "healthy", "pacientes": pacientes_count, "medicos": medicos_count }
#
# RISCO: O endpoint público retornava o volume total de dados sensíveis do banco
# (quantidade de pacientes e médicos), sem autenticação. Isso é information disclosure:
# um atacante pode monitorar o crescimento da base e inferir padrões de uso.
#
# CORREÇÃO: O /health agora retorna apenas um sinal vital limpo ("ok" ou "degraded"),
# sem expor metadados internos. Ele verifica a conectividade com o banco executando
# uma query mínima (SELECT 1), sem retornar nenhum dado de negócio.
@api_router.get("/health")
async def health_check():
    """Liveness leve: não acorda o banco nem expõe dados internos."""
    return {"status": "ok"}


@api_router.get("/health/database")
async def database_health(_=Depends(rate_limit), __=Depends(require_auth)):
    """Readiness autenticada para diagnóstico manual da conexão com o banco."""
    try:
        from core.db_manager import IS_PRODUCTION as is_postgres
        with get_db_connection() as conn:
            if is_postgres:
                from sqlalchemy import text
                conn.execute(text("SELECT 1"))
            else:
                conn.execute("SELECT 1")
        return {"status": "ok"}
    except Exception:
        logger.exception("Falha no health check do banco")
        raise HTTPException(status_code=503, detail="Banco temporariamente indisponível.")


# O prefixo /api atende a Vercel; o segundo router mantém compatibilidade local.
app.include_router(api_router, prefix="/api")
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=os.getenv("HOST", "127.0.0.1"), port=int(os.getenv("PORT", "8000")), reload=os.getenv("DEBUG_MODE", "false").lower() == "true")
