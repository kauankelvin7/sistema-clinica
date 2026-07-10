"""
Sistema de Homologação de Atestados Médicos - Backend API (Vercel Serverless)
══════════════════════════════════════════════════════════════════════════════
[CÓDIGO MANTIDO] Estrutura original adaptada para rodar como Serverless Function na Vercel.
[CÓDIGO SEGURO] Adicionadas 6 Camadas de Segurança (Auth, Crypto, Rate Limit, Audit, Sanitização).
"""

from fastapi import FastAPI, HTTPException, Query, Depends, APIRouter
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

# [CAMADA 6] Middleware de Auditoria
app.add_middleware(BaseHTTPMiddleware, dispatch=audit_middleware)

# CORS
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000", "http://localhost:3001", "https://sistema-clinica-seven.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
async def login(credentials: LoginRequest, _=Depends(rate_limit)):
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
        return {"access_token": token, "token_type": "bearer"}

    # Resposta genérica: não especifica se foi o usuário ou a senha que falhou
    raise HTTPException(status_code=401, detail="Usuário ou senha incorretos")

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
                    # [UPSERT] Tenta inserir, se houver conflito (CPF + Empresa), não faz nada (mantém original)
                    insert_query = """
                        INSERT INTO pacientes (nome_completo, tipo_doc, numero_doc, numero_doc_hash, cargo, empresa) 
                        VALUES (:nome, :tipo_doc, :numero_doc, :hash_doc, :cargo, :empresa)
                        ON CONFLICT (numero_doc_hash, empresa) DO NOTHING
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
                else:
                    cursor = conn.cursor()
                    # SQLite fallback para o comportamento original (manual upsert)
                    cursor.execute("SELECT id FROM pacientes WHERE numero_doc_hash = ? AND empresa = ?", (hash_doc_paciente, sanitizar_entrada(data.paciente.empresa)))
                    if not cursor.fetchone():
                        cursor.execute("INSERT INTO pacientes (nome_completo, tipo_doc, numero_doc, numero_doc_hash, cargo, empresa) VALUES (?, ?, ?, ?, ?, ?)", (
                            enc_nome_paciente, sanitizar_entrada(data.paciente.tipo_documento), enc_doc_paciente, hash_doc_paciente, sanitizar_entrada(data.paciente.cargo), sanitizar_entrada(data.paciente.empresa)
                        ))
                    # Note: No SQLite não atualizamos para seguir o padrão "DO NOTHING" pedido para pacientes
                    
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
        except Exception as db_error:
            logger.warning(f"Erro ao salvar no banco (continuando): {str(db_error)}")
        
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
                    result = conn.execute(sql, {"scan_limit": MAX_SCAN_FOR_SEARCH})
                else:
                    # Sem busca: paginação com parâmetros bindados
                    count_sql = text("SELECT COUNT(*) FROM pacientes")
                    total_db = conn.execute(count_sql).scalar()
                    offset = (page - 1) * page_size
                    sql = text(
                        "SELECT id, nome_completo, tipo_doc, numero_doc, cargo, empresa "
                        "FROM pacientes ORDER BY data_criacao DESC "
                        "LIMIT :limit OFFSET :offset"  # ← parâmetros bindados, não f-string
                    )
                    result = conn.execute(sql, {"limit": page_size, "offset": offset})
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
                "patients": patients_page
            }
    except Exception as e:
        logger.error(f"Erro ao buscar pacientes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/doctors")
async def get_doctors(search: Optional[str] = None, _=Depends(rate_limit), __=Depends(require_auth)):
    try:
        is_postgres = bool(os.getenv('DATABASE_URL')) or os.getenv('RENDER') or os.getenv('RAILWAY_ENVIRONMENT') or os.getenv('VERCEL')
        with get_db_connection() as conn:
            if is_postgres:
                from sqlalchemy import text
                result = conn.execute(text("SELECT id, nome_completo, tipo_crm, crm, uf_crm FROM medicos ORDER BY data_criacao DESC"))
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
            
            return medicos
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# [HOTFIX-05] — Blindagem da Rota /debug-db
#
# ANTES (VULNERÁVEL):
#   @api_router.get("/debug-db")
#   async def debug_db():   ← SEM autenticação!
#
# RISCO: Qualquer pessoa na internet poderia chamar GET /api/debug-db sem token
# e receber informações de infraestrutura (nome do banco, usuário do banco,
# URL mascarada mas parcialmente legível, status de produção).
#
# CORREÇÃO (dupla camada de defesa):
#   1. A rota SÓ EXISTE se DEBUG_MODE=true estiver definido no ambiente.
#      Em produção, a rota simplesmente não é registrada no router.
#   2. Mesmo quando ativa, requer autenticação JWT (require_auth).
_DEBUG_MODE = os.getenv("DEBUG_MODE", "false").lower() == "true"

if _DEBUG_MODE:
    @api_router.get("/debug-db")
    async def debug_db(_=Depends(rate_limit), __=Depends(require_auth)):
        """
        Endpoint de diagnóstico de banco de dados.
        SOMENTE disponível quando DEBUG_MODE=true E com autenticação válida.
        Nunca ative DEBUG_MODE em produção.
        """
        diag: dict = {}
        try:
            from core.db_manager import IS_PRODUCTION as is_postgres
            db_url = os.getenv('DATABASE_URL', 'NÃO DEFINIDA')

            # Mascara a senha da URL antes de qualquer log ou retorno
            masked_url = db_url
            if '@' in db_url:
                parts = db_url.split('@')
                user_part = parts[0].split(':')
                if len(user_part) > 2:
                    masked_url = f"{user_part[0]}:{user_part[1]}:****@{parts[1]}"
                else:
                    masked_url = f"{user_part[0]}:****@{parts[1]}"

            diag = {
                "is_production_detected": bool(os.getenv('VERCEL') or os.getenv('RENDER')),
                "database_url_masked": masked_url,
                "url_length": len(db_url),
                "is_postgres_logic": is_postgres
            }

            with get_db_connection() as conn:
                if is_postgres:
                    from sqlalchemy import text
                    res = conn.execute(text("SELECT current_user, current_database()")).fetchone()
                    diag["db_user"] = res[0]
                    diag["db_name"] = res[1]
                else:
                    diag["db_type"] = "SQLite"

            return {"status": "success", "diagnostics": diag}
        except Exception as e:
            return {"status": "error", "error_details": str(e), "diagnostics": diag}


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
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
