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
    dias_afastamento: int
    cid: str
    cid_nao_informado: bool = False

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
@api_router.post("/auth/token")
async def login(credentials: LoginRequest, _=Depends(rate_limit)):
    """Rota para o frontend obter o JWT"""
    admin_user = os.getenv("ADMIN_USER", "admin")
    admin_pass = os.getenv("ADMIN_PASSWORD", "admin123")
    
    if credentials.username == admin_user and credentials.password == admin_pass:
        from datetime import timedelta
        expires = timedelta(days=30) if credentials.remember_me else timedelta(hours=24)
        token = create_access_token(data={"sub": credentials.username}, expires_delta=expires)
        return {"access_token": token, "token_type": "bearer"}
    
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
                    # Busca por HASH (determinístico) em vez de valor criptografado (aleatório)
                    result = conn.execute(text("SELECT id FROM pacientes WHERE numero_doc_hash = :hash_doc"), {"hash_doc": hash_doc_paciente})
                    if not result.fetchone():
                        conn.execute(text("INSERT INTO pacientes (nome_completo, tipo_doc, numero_doc, numero_doc_hash, cargo, empresa) VALUES (:nome, :tipo_doc, :numero_doc, :hash_doc, :cargo, :empresa)"), {
                            "nome": enc_nome_paciente, "tipo_doc": sanitizar_entrada(data.paciente.tipo_documento),
                            "numero_doc": enc_doc_paciente, "hash_doc": hash_doc_paciente,
                            "cargo": sanitizar_entrada(data.paciente.cargo), "empresa": sanitizar_entrada(data.paciente.empresa)
                        })
                    else:
                        conn.execute(text("UPDATE pacientes SET nome_completo = :nome, tipo_doc = :tipo_doc, numero_doc = :numero_doc, cargo = :cargo, empresa = :empresa WHERE numero_doc_hash = :hash_doc"), {
                            "nome": enc_nome_paciente, "tipo_doc": sanitizar_entrada(data.paciente.tipo_documento),
                            "numero_doc": enc_doc_paciente, "cargo": sanitizar_entrada(data.paciente.cargo),
                            "empresa": sanitizar_entrada(data.paciente.empresa), "hash_doc": hash_doc_paciente
                        })
                    
                    result = conn.execute(text("SELECT id FROM medicos WHERE crm_hash = :crm_hash AND tipo_crm = :tipo_crm"), {
                        "crm_hash": hash_crm_medico, "tipo_crm": sanitizar_entrada(data.medico.tipo_registro)
                    })
                    if not result.fetchone():
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
                    cursor.execute("SELECT id FROM pacientes WHERE numero_doc_hash = ?", (hash_doc_paciente,))
                    if not cursor.fetchone():
                        cursor.execute("INSERT INTO pacientes (nome_completo, tipo_doc, numero_doc, numero_doc_hash, cargo, empresa) VALUES (?, ?, ?, ?, ?, ?)", (
                            enc_nome_paciente, sanitizar_entrada(data.paciente.tipo_documento), enc_doc_paciente, hash_doc_paciente, sanitizar_entrada(data.paciente.cargo), sanitizar_entrada(data.paciente.empresa)
                        ))
                    else:
                        cursor.execute("UPDATE pacientes SET nome_completo = ?, tipo_doc = ?, numero_doc = ?, cargo = ?, empresa = ? WHERE numero_doc_hash = ?", (
                            enc_nome_paciente, sanitizar_entrada(data.paciente.tipo_documento), enc_doc_paciente, sanitizar_entrada(data.paciente.cargo), sanitizar_entrada(data.paciente.empresa), hash_doc_paciente
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
        }
        
        html_content = generate_html(documento_data)
        return HTMLResponse(content=html_content, status_code=200)
    
    except Exception as e:
        logger.error(f"Erro geral ao gerar HTML: {str(e)}")
        raise HTTPException(status_code=500, detail="Não foi possível gerar o documento. Tente novamente.")

@api_router.get("/patients")
async def get_patients(search: Optional[str] = None, _=Depends(rate_limit), __=Depends(require_auth)):
    try:
        is_postgres = bool(os.getenv('DATABASE_URL')) or os.getenv('RENDER') or os.getenv('RAILWAY_ENVIRONMENT') or os.getenv('VERCEL')
        with get_db_connection() as conn:
            # Nota: A busca ILIKE não funcionará bem com dados criptografados se buscarmos por string parcial,
            # já que o hash altera a string completamente. Num sistema real com criptografia, 
            # não buscamos nomes parciais via LIKE sem algoritmos determinísticos. 
            # Aqui, descriptografamos a saída no retorno (fallback se já estiver criptografado).
            if is_postgres:
                from sqlalchemy import text
                if search:
                    result = conn.execute(text("SELECT id, nome_completo, tipo_doc, numero_doc, cargo, empresa FROM pacientes ORDER BY data_criacao DESC"))
                else:
                    result = conn.execute(text("SELECT id, nome_completo, tipo_doc, numero_doc, cargo, empresa FROM pacientes ORDER BY data_criacao DESC"))
            else:
                cursor = conn.cursor()
                cursor.execute("SELECT id, nome_completo, tipo_doc, numero_doc, cargo, empresa FROM pacientes ORDER BY data_criacao DESC")
                result = cursor.fetchall()

            # Processamento de retorno (Descriptografa Camada 2)
            pacientes = []
            for r in result:
                # Fallback: Se search tiver algo, filtramos em python já que no BD a string está criptografada
                nome = decrypt(r[1])
                doc = decrypt(r[3])
                if search:
                    if search.lower() not in nome.lower() and search not in doc:
                        continue
                pacientes.append({"id": r[0], "nome_completo": nome, "tipo_doc": r[2], "numero_doc": doc, "cargo": r[4] or "", "empresa": r[5] or ""})
            
            return pacientes
    except Exception as e:
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
async def check_duplicate(tipo: str, valor: str, _=Depends(rate_limit), __=Depends(require_auth)):
    """Verifica se um paciente (por CPF) ou médico (por CRM) já existe."""
    try:
        h = generate_hash(valor)
        is_postgres = bool(os.getenv('DATABASE_URL')) or os.getenv('RENDER') or os.getenv('RAILWAY_ENVIRONMENT') or os.getenv('VERCEL')
        
        with get_db_connection() as conn:
            if tipo == "paciente":
                query = "SELECT id FROM pacientes WHERE numero_doc_hash = :h" if is_postgres else "SELECT id FROM pacientes WHERE numero_doc_hash = ?"
            else:
                query = "SELECT id FROM medicos WHERE crm_hash = :h" if is_postgres else "SELECT id FROM medicos WHERE crm_hash = ?"
            
            if is_postgres:
                from sqlalchemy import text
                result = conn.execute(text(query), {"h": h}).fetchone()
            else:
                cursor = conn.cursor()
                cursor.execute(query, (h,))
                result = cursor.fetchone()
                
            return {"existe": bool(result)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/health")
async def health_check():
    try:
        is_postgres = bool(os.getenv('DATABASE_URL')) or os.getenv('VERCEL') or os.getenv('RENDER')
        with get_db_connection() as conn:
            if is_postgres:
                from sqlalchemy import text
                pacientes_count = conn.execute(text("SELECT COUNT(*) FROM pacientes")).fetchone()[0]
                medicos_count = conn.execute(text("SELECT COUNT(*) FROM medicos")).fetchone()[0]
            else:
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) FROM pacientes")
                pacientes_count = cursor.fetchone()[0]
                cursor.execute("SELECT COUNT(*) FROM medicos")
                medicos_count = cursor.fetchone()[0]
        return { "status": "healthy", "pacientes": pacientes_count, "medicos": medicos_count }
    except Exception as e:
        return { "status": "unhealthy", "error": str(e) }

# Incluímos o router duas vezes para garantir compatibilidade
# 1. Com o prefixo /api (para chamadas diretas ou ambientes que não removem o prefixo)
# 2. Sem o prefixo (para ambientes como Vercel que podem consumir o /api)
app.include_router(api_router, prefix="/api")
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
