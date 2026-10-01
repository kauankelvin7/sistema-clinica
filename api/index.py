"""
Sistema de Homologação de Atestados Médicos - Backend API (Vercel Serverless)
══════════════════════════════════════════════════════════════════════════════
"""

from fastapi import FastAPI, HTTPException, Query, Depends, APIRouter, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, validator
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
from core.rate_limit import rate_limit
from core.audit import audit_middleware

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="Sistema de Homologação de Atestados Médicos", version="2.1.0")

# Criamos um router para as rotas da API
api_router = APIRouter()

# Sessão via cookie HttpOnly. O token continua aceito via Bearer para compatibilidade
# com clientes externos, mas o frontend não precisa mais expô-lo ao JavaScript.
_IS_PRODUCTION = bool(os.getenv("VERCEL") or os.getenv("RENDER") or os.getenv("RAILWAY_ENVIRONMENT"))
_COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "none" if _IS_PRODUCTION else "lax").lower()
if _COOKIE_SAMESITE not in {"lax", "strict", "none"}:
    _COOKIE_SAMESITE = "lax"
_COOKIE_SECURE = os.getenv(
    "COOKIE_SECURE",
    "true" if _IS_PRODUCTION else "false",
).lower() == "true"
_SESSION_COOKIE = "session_token"

# [CAMADA 6] Middleware de Auditoria
app.add_middleware(BaseHTTPMiddleware, dispatch=audit_middleware)

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

@app.on_event("startup")
async def startup_event():
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
    username: str
    password: str
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
async def login(credentials: LoginRequest, response: Response, _=Depends(rate_limit)):
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

@api_router.post("/generate-document")
@api_router.post("/generate-pdf")
@api_router.post("/generate-html")
async def generate_html_endpoint(data: DocumentoRequest, _=Depends(rate_limit), __=Depends(require_auth)):
    try:
        is_postgres = bool(os.getenv('DATABASE_URL')) or os.getenv('RENDER') or os.getenv('RAILWAY_ENVIRONMENT') or os.getenv('VERCEL')
        
        # [CAMADA 2] Criptografa e gera hashes para os dados sensíveis
        enc_nome_paciente = encrypt(data.paciente.nome)
        enc_doc_paciente = encrypt(data.paciente.numero_documento)
        hash_doc_paciente = generate_hash(data.paciente.numero_documento)
        
        enc_nome_medico = encrypt(data.medico.nome)
        hash_crm_medico = generate_hash(data.medico.numero_registro)
        
        try:
            with get_db_connection() as conn:
                if is_postgres:
                    from sqlalchemy import text
                    # [UPSERT] Tenta inserir. Se já existir (por hash do documento), não faz nada (mantém original)
                    result_paciente = conn.execute(text("SELECT id FROM pacientes WHERE numero_doc_hash = :hash_doc"), {
                        "hash_doc": hash_doc_paciente
                    })
                    if not result_paciente.fetchone():
                        insert_query = """
                            INSERT INTO pacientes (nome_completo, tipo_doc, numero_doc, numero_doc_hash, cargo, empresa) 
                            VALUES (:nome, :tipo_doc, :numero_doc, :hash_doc, :cargo, :empresa)
                        """
                        conn.execute(text(insert_query), {
                            "nome": enc_nome_paciente, "tipo_doc": sanitizar_entrada(data.paciente.tipo_documento),
                            "numero_doc": enc_doc_paciente, "hash_doc": hash_doc_paciente,
                            "cargo": sanitizar_entrada(data.paciente.cargo), "empresa": sanitizar_entrada(data.paciente.empresa)
                        })
                    
                    # Para médicos, mantemos o comportamento original de atualização se já existir (conflito por CRM)
                    result_medico = conn.execute(text("SELECT id FROM medicos WHERE crm_hash = :crm_hash AND tipo_crm = :tipo_crm"), {
                        "crm_hash": hash_crm_medico, "tipo_crm": sanitizar_entrada(data.medico.tipo_registro)
                    })
                    if not result_medico.fetchone():
                        conn.execute(text("INSERT INTO medicos (nome_completo, tipo_crm, crm, crm_hash, uf_crm) VALUES (:nome, :tipo_crm, :crm, :crm_hash, :uf_crm)"), {
                            "nome": enc_nome_medico, "tipo_crm": sanitizar_entrada(data.medico.tipo_registro),
                            "crm": sanitizar_entrada(data.medico.numero_registro), "crm_hash": hash_crm_medico,
                            "uf_crm": sanitizar_entrada(data.medico.uf_registro)
                        })
                    else:
                        conn.execute(text("UPDATE medicos SET nome_completo = :nome, uf_crm = :uf_crm, crm = :crm WHERE crm_hash = :crm_hash AND tipo_crm = :tipo_crm"), {
                            "nome": enc_nome_medico, "uf_crm": sanitizar_entrada(data.medico.uf_registro),
                            "crm": sanitizar_entrada(data.medico.numero_registro), "crm_hash": hash_crm_medico,
                            "tipo_crm": sanitizar_entrada(data.medico.tipo_registro)
                        })
                    conn.commit()
                    logger.info("✅ Paciente e Médico salvos/atualizados com sucesso no banco de dados!")
                else:
                    cursor = conn.cursor()
                    # SQLite fallback para o comportamento original (manual upsert)
                    cursor.execute("SELECT id FROM pacientes WHERE numero_doc_hash = ? AND empresa = ?", (hash_doc_paciente, sanitizar_entrada(data.paciente.empresa)))
                    if not cursor.fetchone():
                        cursor.execute("INSERT INTO pacientes (nome_completo, tipo_doc, numero_doc, numero_doc_hash, cargo, empresa) VALUES (?, ?, ?, ?, ?, ?)", (
                            enc_nome_paciente, sanitizar_entrada(data.paciente.tipo_documento), enc_doc_paciente, hash_doc_paciente, sanitizar_entrada(data.paciente.cargo), sanitizar_entrada(data.paciente.empresa)
                        ))
                    
                    cursor.execute("SELECT id FROM medicos WHERE crm_hash = ? AND tipo_crm = ?", (hash_crm_medico, sanitizar_entrada(data.medico.tipo_registro)))
                    if not cursor.fetchone():
                        cursor.execute("INSERT INTO medicos (nome_completo, tipo_crm, crm, crm_hash, uf_crm) VALUES (?, ?, ?, ?, ?)", (
                            enc_nome_medico, sanitizar_entrada(data.medico.tipo_registro), sanitizar_entrada(data.medico.numero_registro), hash_crm_medico, sanitizar_entrada(data.medico.uf_registro)
                        ))
                    else:
                        cursor.execute("UPDATE medicos SET nome_completo = ?, uf_crm = ?, crm = ? WHERE crm_hash = ? AND tipo_crm = ?", (
                            enc_nome_medico, sanitizar_entrada(data.medico.uf_registro), sanitizar_entrada(data.medico.numero_registro), hash_crm_medico, sanitizar_entrada(data.medico.tipo_registro)
                        ))
                    conn.commit()
                    logger.info("✅ Paciente e Médico salvos no SQLite!")
        except Exception as db_error:
            logger.error(f"❌ Erro ao salvar no banco de dados: {str(db_error)}", exc_info=True)
        
        documento_data = {
            "nome_paciente": data.paciente.nome, "tipo_doc_paciente": data.paciente.tipo_documento,
            "numero_doc_paciente": data.paciente.numero_documento, "cargo_paciente": data.paciente.cargo,
            "empresa_paciente": data.paciente.empresa, "data_atestado": data.atestado.data_atestado,
            "data_atual": datetime.now().strftime("%d/%m/%Y"), "qtd_dias_atestado": data.atestado.dias_afastamento,
            "codigo_cid": "NÃO INFORMADO" if data.atestado.cid_nao_informado else data.atestado.cid,
            "cid_nao_informado": data.atestado.cid_nao_informado, "nome_medico": data.medico.nome,
            "tipo_registro_medico": data.medico.tipo_registro, "crm_medico": data.medico.numero_registro,
            "uf_crm_medico": data.medico.uf_registro,
            "tipo_atestado": data.atestado.tipo_atestado or "saude",
        }
        
        html_content = generate_html(documento_data)
        return HTMLResponse(content=html_content, status_code=200)
    
    except Exception as e:
        logger.error(f"Erro geral ao gerar HTML: {str(e)}")
        raise HTTPException(status_code=500, detail="Não foi possível gerar o documento. Tente novamente.")

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
    """
    Verificação de saúde da API.
    Retorna apenas o status operacional — sem dados de negócio.
    Público e sem autenticação (apenas para health probes de plataforma).
    """
    try:
        from core.db_manager import IS_PRODUCTION as is_postgres
        with get_db_connection() as conn:
            # Verifica conectividade com o banco via query mínima, sem expor dados
            if is_postgres:
                from sqlalchemy import text
                conn.execute(text("SELECT 1"))
            else:
                conn.execute("SELECT 1")
        return {"status": "ok"}
    except Exception:
        # Não expõe detalhes do erro ao exterior — apenas indica degradação
        return {"status": "degraded"}

# Incluímos o router duas vezes para garantir compatibilidade
# 1. Com o prefixo /api (para chamadas diretas ou ambientes que não removem o prefixo)
# 2. Sem o prefixo (para ambientes como Vercel que podem consumir o /api)
app.include_router(api_router, prefix="/api")
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=os.getenv("HOST", "127.0.0.1"), port=int(os.getenv("PORT", "8000")), reload=os.getenv("DEBUG_MODE", "false").lower() == "true")
