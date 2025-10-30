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

from core.database import get_db_connection, sanitizar_entrada
from core.document_generator import generate_document

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
            with get_db_connection() as conn:
                cursor = conn.cursor()
                
                # Verificar se paciente já existe
                cursor.execute(
                    "SELECT id FROM pacientes WHERE numero_doc = ?",
                    (sanitizar_entrada(data.paciente.numero_documento),)
                )
                paciente_existente = cursor.fetchone()
                
                if not paciente_existente:
                    # Inserir novo paciente
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
                    # Atualizar dados do paciente
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
                
                # SALVAR MÉDICO NO BANCO DE DADOS
                cursor.execute(
                    "SELECT id FROM medicos WHERE crm = ? AND tipo_crm = ?",
                    (sanitizar_entrada(data.medico.numero_registro), sanitizar_entrada(data.medico.tipo_registro))
                )
                medico_existente = cursor.fetchone()
                
                if not medico_existente:
                    # Inserir novo médico
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
                    # Atualizar dados do médico
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

@app.get("/api/patients")
async def get_patients(search: Optional[str] = None):
    """
    Busca pacientes no banco de dados
    """
    try:
        with get_db_connection() as conn:
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
        with get_db_connection() as conn:
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
