"""
Backend FastAPI - Sistema de Homologação
API REST para integração com frontend React
Autor: Kauan Kelvin
Versão: 2.0.0
"""

from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List
import sys
import os
from datetime import datetime
import logging

# Adicionar diretório raiz ao path para importar módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.db_manager import get_db_connection, create_tables
from core.database import sanitizar_entrada
from core.document_generator import generate_document
from core.pdf_converter import convert_docx_to_pdf, PDFConversionError

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Criar aplicação FastAPI
app = FastAPI(
    title="Sistema de Homologação API",
    description="API REST para geração de atestados médicos",
    version="2.0.0"
)

# Configurar CORS para permitir requisições do frontend
# Adicionar URL do frontend em produção
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3001')

allowed_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",  # Vite padrão
]

# Adicionar URL de produção se configurada
if FRONTEND_URL and FRONTEND_URL not in allowed_origins:
    allowed_origins.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Criar tabelas no startup
@app.on_event("startup")
async def startup_event():
    """Inicializa o banco de dados ao iniciar a aplicação"""
    try:
        create_tables()
        logger.info("✅ Banco de dados inicializado com sucesso")
    except Exception as e:
        logger.error(f"❌ Erro ao inicializar banco: {e}")

# Modelos Pydantic para validação de dados
class PacienteData(BaseModel):
    nome: str
    tipo_documento: str
    numero_documento: str
    cargo: str
    empresa: str

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

class DocumentoRequest(BaseModel):
    paciente: PacienteData
    atestado: AtestadoData
    medico: MedicoData

class PacienteResponse(BaseModel):
    id: int
    nome: str
    tipo_documento: str
    numero_documento: str
    cargo: str
    empresa: str

class MedicoResponse(BaseModel):
    id: int
    nome: str
    tipo_registro: str
    numero_registro: str
    uf_registro: str

# ===== ENDPOINTS =====

@app.get("/")
async def root():
    """Endpoint raiz - Status da API"""
    return {
        "status": "online",
        "message": "Sistema de Homologação API v2.0",
        "author": "Kauan Kelvin",
        "docs": "/docs"
    }

@app.post("/api/generate-document")
async def generate_document_endpoint(data: DocumentoRequest):
    """
    Gera documento de atestado médico e salva paciente/médico no banco
    """
    try:
        logger.info("Recebendo requisição para gerar documento")
        
        # SALVAR PACIENTE NO BANCO DE DADOS
        try:
            is_postgres = os.getenv('RENDER') or os.getenv('RAILWAY_ENVIRONMENT')
            
            with get_db_connection() as conn:
                if is_postgres:
                    # PostgreSQL
                    from sqlalchemy import text
                    
                    # Verificar paciente
                    result = conn.execute(text("""
                        SELECT id FROM pacientes WHERE numero_doc = :numero_doc
                    """), {"numero_doc": sanitizar_entrada(data.paciente.numero_documento)})
                    paciente_existente = result.fetchone()
                    
                    if not paciente_existente:
                        conn.execute(text("""
                            INSERT INTO pacientes (nome_completo, tipo_doc, numero_doc, cargo, empresa)
                            VALUES (:nome, :tipo_doc, :numero_doc, :cargo, :empresa)
                        """), {
                            "nome": sanitizar_entrada(data.paciente.nome),
                            "tipo_doc": sanitizar_entrada(data.paciente.tipo_documento),
                            "numero_doc": sanitizar_entrada(data.paciente.numero_documento),
                            "cargo": sanitizar_entrada(data.paciente.cargo),
                            "empresa": sanitizar_entrada(data.paciente.empresa)
                        })
                        logger.info(f"Paciente salvo: {data.paciente.nome}")
                    else:
                        conn.execute(text("""
                            UPDATE pacientes 
                            SET nome_completo = :nome, tipo_doc = :tipo_doc, cargo = :cargo, empresa = :empresa
                            WHERE numero_doc = :numero_doc
                        """), {
                            "nome": sanitizar_entrada(data.paciente.nome),
                            "tipo_doc": sanitizar_entrada(data.paciente.tipo_documento),
                            "cargo": sanitizar_entrada(data.paciente.cargo),
                            "empresa": sanitizar_entrada(data.paciente.empresa),
                            "numero_doc": sanitizar_entrada(data.paciente.numero_documento)
                        })
                        logger.info(f"Paciente atualizado: {data.paciente.nome}")
                    
                    # Verificar médico
                    result = conn.execute(text("""
                        SELECT id FROM medicos WHERE crm = :crm AND tipo_crm = :tipo_crm
                    """), {
                        "crm": sanitizar_entrada(data.medico.numero_registro),
                        "tipo_crm": sanitizar_entrada(data.medico.tipo_registro)
                    })
                    medico_existente = result.fetchone()
                    
                    if not medico_existente:
                        conn.execute(text("""
                            INSERT INTO medicos (nome_completo, tipo_crm, crm, uf_crm)
                            VALUES (:nome, :tipo_crm, :crm, :uf_crm)
                        """), {
                            "nome": sanitizar_entrada(data.medico.nome),
                            "tipo_crm": sanitizar_entrada(data.medico.tipo_registro),
                            "crm": sanitizar_entrada(data.medico.numero_registro),
                            "uf_crm": sanitizar_entrada(data.medico.uf_registro)
                        })
                        logger.info(f"Médico salvo: {data.medico.nome}")
                    else:
                        conn.execute(text("""
                            UPDATE medicos 
                            SET nome_completo = :nome, uf_crm = :uf_crm
                            WHERE crm = :crm AND tipo_crm = :tipo_crm
                        """), {
                            "nome": sanitizar_entrada(data.medico.nome),
                            "uf_crm": sanitizar_entrada(data.medico.uf_registro),
                            "crm": sanitizar_entrada(data.medico.numero_registro),
                            "tipo_crm": sanitizar_entrada(data.medico.tipo_registro)
                        })
                        logger.info(f"Médico atualizado: {data.medico.nome}")
                    
                    conn.commit()
                    
                else:
                    # SQLite
                    cursor = conn.cursor()
                    
                    # Verificar paciente
                    cursor.execute(
                        "SELECT id FROM pacientes WHERE numero_doc = ?",
                        (sanitizar_entrada(data.paciente.numero_documento),)
                    )
                    paciente_existente = cursor.fetchone()
                    
                    if not paciente_existente:
                        cursor.execute("""
                            INSERT INTO pacientes (nome_completo, tipo_doc, numero_doc, cargo, empresa)
                            VALUES (?, ?, ?, ?, ?)
                        """, (
                            sanitizar_entrada(data.paciente.nome),
                            sanitizar_entrada(data.paciente.tipo_documento),
                            sanitizar_entrada(data.paciente.numero_documento),
                            sanitizar_entrada(data.paciente.cargo),
                            sanitizar_entrada(data.paciente.empresa)
                        ))
                        logger.info(f"Paciente salvo: {data.paciente.nome}")
                    else:
                        cursor.execute("""
                            UPDATE pacientes 
                            SET nome_completo = ?, tipo_doc = ?, cargo = ?, empresa = ?
                            WHERE numero_doc = ?
                        """, (
                            sanitizar_entrada(data.paciente.nome),
                            sanitizar_entrada(data.paciente.tipo_documento),
                            sanitizar_entrada(data.paciente.cargo),
                            sanitizar_entrada(data.paciente.empresa),
                            sanitizar_entrada(data.paciente.numero_documento)
                        ))
                        logger.info(f"Paciente atualizado: {data.paciente.nome}")
                    
                    # Verificar médico
                    cursor.execute(
                        "SELECT id FROM medicos WHERE crm = ? AND tipo_crm = ?",
                        (sanitizar_entrada(data.medico.numero_registro), sanitizar_entrada(data.medico.tipo_registro))
                    )
                    medico_existente = cursor.fetchone()
                    
                    if not medico_existente:
                        cursor.execute("""
                            INSERT INTO medicos (nome_completo, tipo_crm, crm, uf_crm)
                            VALUES (?, ?, ?, ?)
                        """, (
                            sanitizar_entrada(data.medico.nome),
                            sanitizar_entrada(data.medico.tipo_registro),
                            sanitizar_entrada(data.medico.numero_registro),
                            sanitizar_entrada(data.medico.uf_registro)
                        ))
                        logger.info(f"Médico salvo: {data.medico.nome}")
                    else:
                        cursor.execute("""
                            UPDATE medicos 
                            SET nome_completo = ?, uf_crm = ?
                            WHERE crm = ? AND tipo_crm = ?
                        """, (
                            sanitizar_entrada(data.medico.nome),
                            sanitizar_entrada(data.medico.uf_registro),
                            sanitizar_entrada(data.medico.numero_registro),
                            sanitizar_entrada(data.medico.tipo_registro)
                        ))
                        logger.info(f"Médico atualizado: {data.medico.nome}")
                    
                    conn.commit()
                
                conn.commit()
            
        except Exception as e:
            logger.warning(f"Erro ao salvar no banco (continuando): {str(e)}")
        
        # Preparar dados no formato EXATO esperado pelo document_generator
        documento_data = {
            # Paciente
            "nome_paciente": data.paciente.nome,
            "tipo_doc_paciente": data.paciente.tipo_documento,
            "numero_doc_paciente": data.paciente.numero_documento,
            "cargo_paciente": data.paciente.cargo,
            "empresa_paciente": data.paciente.empresa,
            
            # Atestado
            "data_atestado": data.atestado.data_atestado,
            "qtd_dias_atestado": str(data.atestado.dias_afastamento),
            "codigo_cid": data.atestado.cid if not data.atestado.cid_nao_informado else "Não Informado",
            
            # Médico (ATENÇÃO: campos com nomes específicos!)
            "nome_medico": data.medico.nome,
            "tipo_registro_medico": data.medico.tipo_registro,
            "crm__medico": data.medico.numero_registro,  # Note o duplo underscore!
            "uf_crm_medico": data.medico.uf_registro,
        }
        
        # Gerar documento
        caminho_documento = generate_document(documento_data)
        
        if not caminho_documento or not os.path.exists(caminho_documento):
            raise HTTPException(status_code=500, detail="Erro ao gerar documento")
        
        logger.info(f"Documento gerado: {caminho_documento}")
        
        # Retornar arquivo para download
        return FileResponse(
            path=caminho_documento,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            filename=os.path.basename(caminho_documento)
        )
        
    except Exception as e:
        logger.error(f"Erro ao gerar documento: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao gerar documento: {str(e)}")

@app.post("/api/generate-pdf")
async def generate_pdf_endpoint(data: DocumentoRequest):
    """
    Gera documento de atestado médico em PDF (converte de Word para PDF)
    """
    try:
        logger.info("Recebendo requisição para gerar PDF")
        
        # Primeiro, gerar o documento Word usando a mesma lógica
        # (Reutilizar código de salvar no banco)
        
        # SALVAR PACIENTE NO BANCO DE DADOS
        try:
            is_postgres = os.getenv('RENDER') or os.getenv('RAILWAY_ENVIRONMENT')
            
            with get_db_connection() as conn:
                if is_postgres:
                    from sqlalchemy import text
                    
                    # Verificar paciente
                    result = conn.execute(text("""
                        SELECT id FROM pacientes WHERE numero_doc = :numero_doc
                    """), {"numero_doc": sanitizar_entrada(data.paciente.numero_documento)})
                    paciente_existente = result.fetchone()
                    
                    if not paciente_existente:
                        conn.execute(text("""
                            INSERT INTO pacientes (nome_completo, tipo_doc, numero_doc, cargo, empresa)
                            VALUES (:nome, :tipo_doc, :numero_doc, :cargo, :empresa)
                        """), {
                            "nome": sanitizar_entrada(data.paciente.nome),
                            "tipo_doc": sanitizar_entrada(data.paciente.tipo_documento),
                            "numero_doc": sanitizar_entrada(data.paciente.numero_documento),
                            "cargo": sanitizar_entrada(data.paciente.cargo),
                            "empresa": sanitizar_entrada(data.paciente.empresa)
                        })
                        logger.info(f"Paciente salvo: {data.paciente.nome}")
                    else:
                        conn.execute(text("""
                            UPDATE pacientes 
                            SET nome_completo = :nome, tipo_doc = :tipo_doc, cargo = :cargo, empresa = :empresa
                            WHERE numero_doc = :numero_doc
                        """), {
                            "nome": sanitizar_entrada(data.paciente.nome),
                            "tipo_doc": sanitizar_entrada(data.paciente.tipo_documento),
                            "cargo": sanitizar_entrada(data.paciente.cargo),
                            "empresa": sanitizar_entrada(data.paciente.empresa),
                            "numero_doc": sanitizar_entrada(data.paciente.numero_documento)
                        })
                        logger.info(f"Paciente atualizado: {data.paciente.nome}")
                    
                    # Verificar médico
                    result = conn.execute(text("""
                        SELECT id FROM medicos WHERE crm = :crm AND tipo_crm = :tipo_crm
                    """), {
                        "crm": sanitizar_entrada(data.medico.numero_registro),
                        "tipo_crm": sanitizar_entrada(data.medico.tipo_registro)
                    })
                    medico_existente = result.fetchone()
                    
                    if not medico_existente:
                        conn.execute(text("""
                            INSERT INTO medicos (nome_completo, tipo_crm, crm, uf_crm)
                            VALUES (:nome, :tipo_crm, :crm, :uf_crm)
                        """), {
                            "nome": sanitizar_entrada(data.medico.nome),
                            "tipo_crm": sanitizar_entrada(data.medico.tipo_registro),
                            "crm": sanitizar_entrada(data.medico.numero_registro),
                            "uf_crm": sanitizar_entrada(data.medico.uf_registro)
                        })
                        logger.info(f"Médico salvo: {data.medico.nome}")
                    else:
                        conn.execute(text("""
                            UPDATE medicos 
                            SET nome_completo = :nome, uf_crm = :uf_crm
                            WHERE crm = :crm AND tipo_crm = :tipo_crm
                        """), {
                            "nome": sanitizar_entrada(data.medico.nome),
                            "uf_crm": sanitizar_entrada(data.medico.uf_registro),
                            "crm": sanitizar_entrada(data.medico.numero_registro),
                            "tipo_crm": sanitizar_entrada(data.medico.tipo_registro)
                        })
                        logger.info(f"Médico atualizado: {data.medico.nome}")
                    
                    conn.commit()
                    
                else:
                    # SQLite
                    cursor = conn.cursor()
                    
                    # Verificar paciente
                    cursor.execute(
                        "SELECT id FROM pacientes WHERE numero_doc = ?",
                        (sanitizar_entrada(data.paciente.numero_documento),)
                    )
                    paciente_existente = cursor.fetchone()
                    
                    if not paciente_existente:
                        cursor.execute("""
                            INSERT INTO pacientes (nome_completo, tipo_doc, numero_doc, cargo, empresa)
                            VALUES (?, ?, ?, ?, ?)
                        """, (
                            sanitizar_entrada(data.paciente.nome),
                            sanitizar_entrada(data.paciente.tipo_documento),
                            sanitizar_entrada(data.paciente.numero_documento),
                            sanitizar_entrada(data.paciente.cargo),
                            sanitizar_entrada(data.paciente.empresa)
                        ))
                        logger.info(f"Paciente salvo: {data.paciente.nome}")
                    else:
                        cursor.execute("""
                            UPDATE pacientes 
                            SET nome_completo = ?, tipo_doc = ?, cargo = ?, empresa = ?
                            WHERE numero_doc = ?
                        """, (
                            sanitizar_entrada(data.paciente.nome),
                            sanitizar_entrada(data.paciente.tipo_documento),
                            sanitizar_entrada(data.paciente.cargo),
                            sanitizar_entrada(data.paciente.empresa),
                            sanitizar_entrada(data.paciente.numero_documento)
                        ))
                        logger.info(f"Paciente atualizado: {data.paciente.nome}")
                    
                    # Verificar médico
                    cursor.execute(
                        "SELECT id FROM medicos WHERE crm = ? AND tipo_crm = ?",
                        (sanitizar_entrada(data.medico.numero_registro), sanitizar_entrada(data.medico.tipo_registro))
                    )
                    medico_existente = cursor.fetchone()
                    
                    if not medico_existente:
                        cursor.execute("""
                            INSERT INTO medicos (nome_completo, tipo_crm, crm, uf_crm)
                            VALUES (?, ?, ?, ?)
                        """, (
                            sanitizar_entrada(data.medico.nome),
                            sanitizar_entrada(data.medico.tipo_registro),
                            sanitizar_entrada(data.medico.numero_registro),
                            sanitizar_entrada(data.medico.uf_registro)
                        ))
                        logger.info(f"Médico salvo: {data.medico.nome}")
                    else:
                        cursor.execute("""
                            UPDATE medicos 
                            SET nome_completo = ?, uf_crm = ?
                            WHERE crm = ? AND tipo_crm = ?
                        """, (
                            sanitizar_entrada(data.medico.nome),
                            sanitizar_entrada(data.medico.uf_registro),
                            sanitizar_entrada(data.medico.numero_registro),
                            sanitizar_entrada(data.medico.tipo_registro)
                        ))
                        logger.info(f"Médico atualizado: {data.medico.nome}")
                    
                    conn.commit()
            
        except Exception as e:
            logger.warning(f"Erro ao salvar no banco (continuando): {str(e)}")
        
        # Preparar dados no formato EXATO esperado pelo document_generator
        documento_data = {
            "nome_paciente": data.paciente.nome,
            "tipo_doc_paciente": data.paciente.tipo_documento,
            "numero_doc_paciente": data.paciente.numero_documento,
            "cargo_paciente": data.paciente.cargo,
            "empresa_paciente": data.paciente.empresa,
            "data_atestado": data.atestado.data_atestado,
            "qtd_dias_atestado": str(data.atestado.dias_afastamento),
            "codigo_cid": data.atestado.cid if not data.atestado.cid_nao_informado else "Não Informado",
            "nome_medico": data.medico.nome,
            "tipo_registro_medico": data.medico.tipo_registro,
            "crm__medico": data.medico.numero_registro,
            "uf_crm_medico": data.medico.uf_registro,
        }
        
        # Gerar documento Word primeiro
        caminho_docx = generate_document(documento_data)
        
        if not caminho_docx or not os.path.exists(caminho_docx):
            raise HTTPException(status_code=500, detail="Erro ao gerar documento Word")
        
        logger.info(f"Documento Word gerado: {caminho_docx}")
        
        # Converter para PDF
        try:
            caminho_pdf = convert_docx_to_pdf(caminho_docx)
            logger.info(f"Documento PDF gerado: {caminho_pdf}")
            
            # Retornar arquivo PDF para download
            return FileResponse(
                path=caminho_pdf,
                media_type="application/pdf",
                filename=os.path.basename(caminho_pdf)
            )
            
        except PDFConversionError as e:
            logger.error(f"Erro ao converter para PDF: {e}")
            raise HTTPException(
                status_code=500, 
                detail=f"Documento Word gerado, mas falha na conversão PDF: {str(e)}"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao gerar PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao gerar PDF: {str(e)}")

@app.get("/api/patients")
async def get_patients(search: Optional[str] = None):
    """
    Busca pacientes no banco de dados
    """
    try:
        # Detectar se está usando PostgreSQL
        is_postgres = os.getenv('RENDER') or os.getenv('RAILWAY_ENVIRONMENT')
        
        with get_db_connection() as conn:
            if is_postgres:
                # PostgreSQL - usar named parameters
                from sqlalchemy import text
                if search:
                    query = text("""
                        SELECT id, nome_completo, tipo_doc, numero_doc, cargo, empresa
                        FROM pacientes 
                        WHERE nome_completo ILIKE :search OR numero_doc LIKE :search
                        ORDER BY nome_completo
                        LIMIT 50
                    """)
                    result = conn.execute(query, {"search": f"%{search}%"})
                else:
                    query = text("""
                        SELECT id, nome_completo, tipo_doc, numero_doc, cargo, empresa
                        FROM pacientes 
                        ORDER BY data_criacao DESC
                        LIMIT 50
                    """)
                    result = conn.execute(query)
                
                pacientes = []
                for row in result:
                    pacientes.append({
                        "id": row[0],
                        "nome_completo": row[1],
                        "tipo_doc": row[2],
                        "numero_doc": row[3],
                        "cargo": row[4] or "",
                        "empresa": row[5] or ""
                    })
            else:
                # SQLite - usar ? placeholders
                cursor = conn.cursor()
                if search:
                    query = """
                        SELECT id, nome_completo, tipo_doc, numero_doc, cargo, empresa
                        FROM pacientes 
                        WHERE nome_completo LIKE ? OR numero_doc LIKE ?
                        ORDER BY nome_completo
                        LIMIT 50
                    """
                    cursor.execute(query, (f"%{search}%", f"%{search}%"))
                else:
                    query = """
                        SELECT id, nome_completo, tipo_doc, numero_doc, cargo, empresa
                        FROM pacientes 
                        ORDER BY data_criacao DESC
                        LIMIT 50
                    """
                    cursor.execute(query)
                
                pacientes = []
                for row in cursor.fetchall():
                    pacientes.append({
                        "id": row[0],
                        "nome_completo": row[1],
                        "tipo_doc": row[2],
                        "numero_doc": row[3],
                        "cargo": row[4] or "",
                        "empresa": row[5] or ""
                    })
        
        return pacientes
        
    except Exception as e:
        logger.error(f"Erro ao buscar pacientes: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar pacientes: {str(e)}")

@app.get("/api/doctors")
async def get_doctors(search: Optional[str] = None):
    """
    Busca médicos no banco de dados
    """
    try:
        # Detectar se está usando PostgreSQL
        is_postgres = os.getenv('RENDER') or os.getenv('RAILWAY_ENVIRONMENT')
        
        with get_db_connection() as conn:
            if is_postgres:
                # PostgreSQL - usar named parameters
                from sqlalchemy import text
                if search:
                    query = text("""
                        SELECT id, nome_completo, tipo_crm, crm, uf_crm
                        FROM medicos 
                        WHERE nome_completo ILIKE :search OR crm LIKE :search
                        ORDER BY nome_completo
                        LIMIT 50
                    """)
                    result = conn.execute(query, {"search": f"%{search}%"})
                else:
                    query = text("""
                        SELECT id, nome_completo, tipo_crm, crm, uf_crm
                        FROM medicos 
                        ORDER BY data_criacao DESC
                        LIMIT 50
                    """)
                    result = conn.execute(query)
                
                medicos = []
                for row in result:
                    medicos.append({
                        "id": row[0],
                        "nome_completo": row[1],
                        "tipo_crm": row[2],
                        "crm": row[3],
                        "uf_crm": row[4]
                    })
            else:
                # SQLite - usar ? placeholders
                cursor = conn.cursor()
                if search:
                    query = """
                        SELECT id, nome_completo, tipo_crm, crm, uf_crm
                        FROM medicos 
                        WHERE nome_completo LIKE ? OR crm LIKE ?
                        ORDER BY nome_completo
                        LIMIT 50
                    """
                    cursor.execute(query, (f"%{search}%", f"%{search}%"))
                else:
                    query = """
                        SELECT id, nome_completo, tipo_crm, crm, uf_crm
                        FROM medicos 
                        ORDER BY data_criacao DESC
                        LIMIT 50
                    """
                    cursor.execute(query)
                
                medicos = []
                for row in cursor.fetchall():
                    medicos.append({
                        "id": row[0],
                        "nome_completo": row[1],
                        "tipo_crm": row[2],
                        "crm": row[3],
                        "uf_crm": row[4]
                    })
        
        return medicos
        
    except Exception as e:
        logger.error(f"Erro ao buscar médicos: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar médicos: {str(e)}")

@app.get("/api/health")
async def health_check():
    """
    Verifica saúde da API e banco de dados
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM pacientes")
        pacientes_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM medicos")
        medicos_count = cursor.fetchone()[0]
        conn.close()
        
        return {
            "status": "healthy",
            "database": "connected",
            "pacientes": pacientes_count,
            "medicos": medicos_count,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
