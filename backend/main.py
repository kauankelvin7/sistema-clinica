"""
Sistema de Homologação de Atestados Médicos - Backend API
══════════════════════════════════════════════════════════════════════════════

Descrição:
    API REST desenvolvida com FastAPI para geração automatizada de atestados 
    médicos, com gerenciamento de pacientes e médicos em banco de dados.

Autor: Kauan Kelvin
Versão: 2.0.0
Data: Novembro 2025

Tecnologias:
    - FastAPI: Framework web assíncrono de alta performance
    - PostgreSQL/SQLite: Banco de dados relacional
    - Python-docx: Geração de documentos Word
    - ReportLab: Geração de documentos PDF
    
Endpoints Principais:
    GET  /                          - Status da API
    GET  /api/health                - Verificação de saúde do sistema
    GET  /api/patients              - Listagem de pacientes
    GET  /api/doctors               - Listagem de médicos
    POST /api/generate-document     - Geração de atestado em Word
    POST /api/generate-pdf          - Geração de atestado em PDF

Deploy:
    - Produção: Koyeb (https://loose-catriona-clinica-medica-seven-71f0d13c.koyeb.app)
    - Banco de Dados: Supabase PostgreSQL
    - Frontend: Vercel (https://sistema-clinica-seven.vercel.app)

══════════════════════════════════════════════════════════════════════════════
"""

# ═══════════════════════════════════════════════════════════════════════════════
# IMPORTAÇÕES E DEPENDÊNCIAS
# ═══════════════════════════════════════════════════════════════════════════════

# Framework Web
from fastapi import FastAPI, HTTPException, File, UploadFile, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from pydantic import BaseModel

# Bibliotecas Padrão Python
from typing import Optional, List
from datetime import datetime
import sys
import os
import logging

# Adicionar diretório raiz ao path para importar módulos customizados
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Módulos Internos do Sistema
from core.db_manager import get_db_connection, create_tables
from core.database import sanitizar_entrada
from core.document_generator import generate_document
from core.pdf_generator import generate_pdf_direct, PDFGenerationError

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURAÇÃO DE LOGGING
# ═══════════════════════════════════════════════════════════════════════════════

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════════════════════════
# INICIALIZAÇÃO DA APLICAÇÃO FASTAPI
# ═══════════════════════════════════════════════════════════════════════════════

app = FastAPI(
    title="Sistema de Homologação de Atestados Médicos",
    description="API REST para geração automatizada de atestados médicos com gerenciamento de pacientes e médicos",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# ═══════════════════════════════════════════════════════════════════════════════
# CONFIGURAÇÃO DE CORS (Cross-Origin Resource Sharing)
# ═══════════════════════════════════════════════════════════════════════════════

# URL do frontend em produção (variável de ambiente)
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3001')

# Lista de origens permitidas para requisições CORS
allowed_origins = [
    "http://localhost:3000",      # React dev server (porta alternativa)
    "http://localhost:3001",      # React dev server (porta padrão)
    "http://localhost:5173",      # Vite dev server
    "https://sistema-clinica-seven.vercel.app",  # Frontend em produção
    "https://loose-catriona-clinica-medica-seven-71f0d13c.koyeb.app",  # Backend Koyeb (para CORS interno)
]

# Adicionar URL de produção dinamicamente se configurada
if FRONTEND_URL and FRONTEND_URL not in allowed_origins:
    allowed_origins.append(FRONTEND_URL)

# Configurar middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",  # Permite todos os subdomínios Vercel
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos os métodos HTTP
    allow_headers=["*"],  # Permite todos os headers
)

# ═══════════════════════════════════════════════════════════════════════════════
# EVENTOS DO CICLO DE VIDA DA APLICAÇÃO
# ═══════════════════════════════════════════════════════════════════════════════

@app.on_event("startup")
async def startup_event():
    """
    Evento executado na inicialização da aplicação.
    
    Responsabilidades:
        - Criar tabelas no banco de dados se não existirem
        - Verificar conectividade com o banco
        - Inicializar recursos necessários
    
    Raises:
        Exception: Se houver erro na inicialização do banco de dados
    """
    try:
        create_tables()
        logger.info("✅ Banco de dados inicializado com sucesso")
    except Exception as e:
        logger.error(f"❌ Erro ao inicializar banco de dados: {e}")

# ═══════════════════════════════════════════════════════════════════════════════
# MODELOS PYDANTIC (Validação de Dados)
# ═══════════════════════════════════════════════════════════════════════════════

class PacienteData(BaseModel):
    """
    Modelo de dados para informações do paciente.
    
    Attributes:
        nome: Nome completo do paciente
        tipo_documento: Tipo de documento (CPF, RG, etc.)
        numero_documento: Número do documento de identificação
        cargo: Cargo/função do paciente
        empresa: Nome da empresa onde trabalha
    """
    nome: str
    tipo_documento: str
    numero_documento: str
    cargo: str
    empresa: str

class AtestadoData(BaseModel):
    """
    Modelo de dados para informações do atestado médico.
    
    Attributes:
        data_atestado: Data de emissão do atestado (formato: DD/MM/AAAA)
        dias_afastamento: Número de dias de afastamento
        cid: Código CID (Classificação Internacional de Doenças)
        cid_nao_informado: Flag indicando se CID não deve ser informado
    """
    data_atestado: str
    dias_afastamento: int
    cid: str
    cid_nao_informado: bool = False

class MedicoData(BaseModel):
    """
    Modelo de dados para informações do médico.
    
    Attributes:
        nome: Nome completo do médico
        tipo_registro: Tipo de registro profissional (CRM, CRO, etc.)
        numero_registro: Número do registro profissional
        uf_registro: UF (estado) do registro profissional
    """
    nome: str
    tipo_registro: str
    numero_registro: str
    uf_registro: str

class DocumentoRequest(BaseModel):
    """
    Modelo de requisição completa para geração de documento.
    
    Agrupa todos os dados necessários para gerar um atestado:
        - Dados do paciente
        - Dados do atestado
        - Dados do médico responsável
    """
    paciente: PacienteData
    atestado: AtestadoData
    medico: MedicoData

# ═══════════════════════════════════════════════════════════════════════════════
# ENDPOINTS DA API
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/", tags=["Status"])
async def root():
    """
    Endpoint raiz da API - Retorna informações básicas do sistema.
    
    Returns:
        dict: Informações sobre status, versão e documentação da API
    """
    return {
        "status": "online",
        "message": "Sistema de Homologação de Atestados Médicos API v2.0",
        "author": "Kauan Kelvin",
        "docs": "/docs",
        "endpoints": {
            "health": "/api/health",
            "patients": "/api/patients",
            "doctors": "/api/doctors",
            "generate_word": "/api/generate-document",
            "generate_html": "/api/generate-html",
            "generate_pdf": "/api/generate-pdf"
        }
    }

@app.get("/api/consultar-profissional")
async def consultar_profissional(
    tipo_registro: str = Query(..., description="Tipo de registro profissional (CRM, CRO, RMS)"),
    numero_registro: str = Query(..., description="Número do registro profissional"),
    uf_registro: str = Query(..., description="UF do registro profissional")
):
    """
    Retorna a URL de consulta do profissional conforme tipo, número e UF.
    """
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
        # Para registros não padronizados (RMS etc.), sugerimos uma busca genérica
        url = f"https://www.google.com/search?q=consulta+registro+profissional+{tipo_registro}+{numero_registro}+{uf_registro}"
        info = "A consulta pode ser feita via busca genérica (quando não há um serviço oficial)."

    return {
        "tipo_registro": tipo_registro,
        "numero_registro": numero_registro,
        "uf_registro": uf_registro,
        "consulta_url": url,
        "info": info
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
            "data_atual": datetime.now().strftime("%d/%m/%Y"),
            "qtd_dias_atestado": str(data.atestado.dias_afastamento),
            "codigo_cid": data.atestado.cid if not data.atestado.cid_nao_informado else "Não Informado",
            # Médico
            "nome_medico": data.medico.nome,
            "tipo_registro_medico": data.medico.tipo_registro,
            "crm_medico": data.medico.numero_registro,
            "uf_crm_medico": data.medico.uf_registro,
        }
        
        # Gerar documento
        caminho_documento = generate_document(documento_data)
        
        if not caminho_documento or not os.path.exists(caminho_documento):
            raise HTTPException(status_code=500, detail="Não foi possível gerar o documento. Por favor, tente novamente.")
        
        logger.info(f"Documento gerado: {caminho_documento}")
        
        # Retornar arquivo para download
        return FileResponse(
            path=caminho_documento,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            filename=os.path.basename(caminho_documento)
        )
        
    except Exception as e:
        logger.error(f"Erro ao gerar documento: {str(e)}")
        raise HTTPException(status_code=500, detail="Não foi possível gerar o documento. Por favor, tente novamente.")

@app.post("/api/generate-html")
async def generate_html_endpoint(data: DocumentoRequest):
    """
    Gera documento de atestado médico em HTML (rápido, pronto para impressão como PDF)
    """
    try:
        logger.info("Recebendo requisição para gerar HTML")
        
        # Importar gerador unificado
        from core.unified_generator import generate_document_unified
        
        # SALVA PACIENTE E MÉDICO NO BANCO DE DADOS
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
                    
                    # Salvar médico
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
                    
        except Exception as db_error:
            logger.warning(f"Erro ao salvar no banco (continuando): {str(db_error)}")
        
        # Preparar dados para geração do documento
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
        }
        
        # Log dos dados enviados ao gerador HTML
        logger.info(f"🔍 Dados enviados ao gerador HTML:")
        logger.info(f"  - nome_medico: '{documento_data['nome_medico']}'")
        logger.info(f"  - tipo_registro_medico: '{documento_data['tipo_registro_medico']}'")
        logger.info(f"  - crm_medico: '{documento_data['crm_medico']}'")
        logger.info(f"  - uf_crm_medico: '{documento_data['uf_crm_medico']}'")
        
        # Gerar HTML
        try:
            resultado = generate_document_unified(documento_data, output_format='html')
            caminho_html = resultado.get('html')
            
            if not caminho_html or not os.path.exists(caminho_html):
                raise HTTPException(status_code=500, detail="Não foi possível gerar o documento HTML. Por favor, tente novamente.")
            
            logger.info(f"✅ HTML gerado: {caminho_html}")
            
            # Ler conteúdo do HTML e retornar como resposta HTML (abre em nova aba)
            with open(caminho_html, 'r', encoding='utf-8') as f:
                html_content = f.read()
            
            return HTMLResponse(content=html_content, status_code=200)
            
        except Exception as e:
            logger.error(f"❌ Erro ao gerar HTML: {str(e)}")
            raise HTTPException(status_code=500, detail="Não foi possível gerar o documento HTML. Por favor, tente novamente.")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Erro geral ao gerar HTML: {str(e)}")
        raise HTTPException(status_code=500, detail="Não foi possível gerar o documento HTML. Por favor, tente novamente.")

@app.post("/api/generate-pdf")
async def generate_pdf_endpoint(data: DocumentoRequest):
    """
    Gera documento de atestado médico em PDF (converte de Word para PDF)
    """
    try:
        logger.info("Recebendo requisição para gerar PDF")
        
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
        
        # Preparar dados no formato EXATO esperado pelo pdf_generator
        documento_data = {
            "nome_paciente": data.paciente.nome,
            "tipo_doc_paciente": data.paciente.tipo_documento,
            "numero_doc_paciente": data.paciente.numero_documento,
            "cargo_paciente": data.paciente.cargo,
            "empresa_paciente": data.paciente.empresa,
            "data_atestado": data.atestado.data_atestado,
            "data_atual": datetime.now().strftime("%d/%m/%Y"),
            "qtd_dias_atestado": str(data.atestado.dias_afastamento),
            "codigo_cid": data.atestado.cid if not data.atestado.cid_nao_informado else "Não Informado",
            "nome_medico": data.medico.nome,
            "tipo_registro_medico": data.medico.tipo_registro,
            "crm_medico": data.medico.numero_registro,
            "uf_crm_medico": data.medico.uf_registro,
        }
        
        # Gerar PDF diretamente (sem passar por Word)
        try:
            caminho_pdf = generate_pdf_direct(documento_data)
            logger.info(f"PDF gerado com sucesso: {caminho_pdf}")
            
            # Retornar arquivo PDF para download
            return FileResponse(
                path=caminho_pdf,
                media_type="application/pdf",
                filename=os.path.basename(caminho_pdf)
            )
            
        except PDFGenerationError as e:
            logger.error(f"Erro ao gerar PDF: {e}")
            raise HTTPException(
                status_code=500, 
                detail="Não foi possível gerar o documento PDF. Por favor, tente novamente."
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao gerar PDF: {str(e)}")
        raise HTTPException(status_code=500, detail="Não foi possível gerar o documento PDF. Por favor, tente novamente.")


@app.get("/api/patients")
async def get_patients(
    search: Optional[str] = None,
    page: int = Query(1, ge=1, description="Número da página"),
    page_size: Optional[int] = Query(None, ge=1, le=100, description="Tamanho da página")
):
    """
    Busca pacientes no banco de dados com paginação inteligente
    """
    try:
        is_postgres = os.getenv('RENDER') or os.getenv('RAILWAY_ENVIRONMENT')
        with get_db_connection() as conn:
            # Buscar total de pacientes
            if is_postgres:
                from sqlalchemy import text
                count_query = text("SELECT COUNT(*) FROM pacientes")
                if search:
                    count_query = text("""
                        SELECT COUNT(*) FROM pacientes WHERE nome_completo ILIKE :search OR numero_doc LIKE :search
                    """)
                    count_result = conn.execute(count_query, {"search": f"%{search}%"})
                else:
                    count_result = conn.execute(count_query)
                total = count_result.fetchone()[0]
            else:
                cursor = conn.cursor()
                if search:
                    cursor.execute("SELECT COUNT(*) FROM pacientes WHERE nome_completo LIKE ? OR numero_doc LIKE ?", (f"%{search}%", f"%{search}%"))
                else:
                    cursor.execute("SELECT COUNT(*) FROM pacientes")
                total = cursor.fetchone()[0]

            # Cálculo inteligente do tamanho da página
            if page_size is None:
                if total > 40:
                    page_size = 20
                else:
                    page_size = 10

            offset = (page - 1) * page_size

            # Buscar pacientes paginados
            if is_postgres:
                from sqlalchemy import text
                if search:
                    query = text("""
                        SELECT id, nome_completo, tipo_doc, numero_doc, cargo, empresa
                        FROM pacientes 
                        WHERE nome_completo ILIKE :search OR numero_doc LIKE :search
                        ORDER BY nome_completo
                        LIMIT :limit OFFSET :offset
                    """)
                    result = conn.execute(query, {"search": f"%{search}%", "limit": page_size, "offset": offset})
                else:
                    query = text("""
                        SELECT id, nome_completo, tipo_doc, numero_doc, cargo, empresa
                        FROM pacientes 
                        ORDER BY data_criacao DESC
                        LIMIT :limit OFFSET :offset
                    """)
                    result = conn.execute(query, {"limit": page_size, "offset": offset})
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
                cursor = conn.cursor()
                if search:
                    query = """
                        SELECT id, nome_completo, tipo_doc, numero_doc, cargo, empresa
                        FROM pacientes 
                        WHERE nome_completo LIKE ? OR numero_doc LIKE ?
                        ORDER BY nome_completo
                        LIMIT ? OFFSET ?
                    """
                    cursor.execute(query, (f"%{search}%", f"%{search}%", page_size, offset))
                else:
                    query = """
                        SELECT id, nome_completo, tipo_doc, numero_doc, cargo, empresa
                        FROM pacientes 
                        ORDER BY data_criacao DESC
                        LIMIT ? OFFSET ?
                    """
                    cursor.execute(query, (page_size, offset))
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

        total_pages = max(1, (total + page_size - 1) // page_size)
        return {
            "results": pacientes,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages
        }
    except Exception as e:
        logger.error(f"Erro ao buscar pacientes: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar pacientes: {str(e)}")


@app.get("/api/doctors")
async def get_doctors(
    search: Optional[str] = None,
    page: int = Query(1, ge=1, description="Número da página"),
    page_size: Optional[int] = Query(None, ge=1, le=100, description="Tamanho da página")
):
    """
    Busca médicos no banco de dados com paginação inteligente
    """
    try:
        is_postgres = os.getenv('RENDER') or os.getenv('RAILWAY_ENVIRONMENT')
        with get_db_connection() as conn:
            # Buscar total de médicos
            if is_postgres:
                from sqlalchemy import text
                count_query = text("SELECT COUNT(*) FROM medicos")
                if search:
                    count_query = text("""
                        SELECT COUNT(*) FROM medicos WHERE nome_completo ILIKE :search OR crm LIKE :search
                    """)
                    count_result = conn.execute(count_query, {"search": f"%{search}%"})
                else:
                    count_result = conn.execute(count_query)
                total = count_result.fetchone()[0]
            else:
                cursor = conn.cursor()
                if search:
                    cursor.execute("SELECT COUNT(*) FROM medicos WHERE nome_completo LIKE ? OR crm LIKE ?", (f"%{search}%", f"%{search}%"))
                else:
                    cursor.execute("SELECT COUNT(*) FROM medicos")
                total = cursor.fetchone()[0]

            # Cálculo inteligente do tamanho da página
            if page_size is None:
                if total > 40:
                    page_size = 20
                else:
                    page_size = 10

            offset = (page - 1) * page_size

            # Buscar médicos paginados
            if is_postgres:
                from sqlalchemy import text
                if search:
                    query = text("""
                        SELECT id, nome_completo, tipo_crm, crm, uf_crm
                        FROM medicos 
                        WHERE nome_completo ILIKE :search OR crm LIKE :search
                        ORDER BY nome_completo
                        LIMIT :limit OFFSET :offset
                    """)
                    result = conn.execute(query, {"search": f"%{search}%", "limit": page_size, "offset": offset})
                else:
                    query = text("""
                        SELECT id, nome_completo, tipo_crm, crm, uf_crm
                        FROM medicos 
                        ORDER BY data_criacao DESC
                        LIMIT :limit OFFSET :offset
                    """)
                    result = conn.execute(query, {"limit": page_size, "offset": offset})
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
                cursor = conn.cursor()
                if search:
                    query = """
                        SELECT id, nome_completo, tipo_crm, crm, uf_crm
                        FROM medicos 
                        WHERE nome_completo LIKE ? OR crm LIKE ?
                        ORDER BY nome_completo
                        LIMIT ? OFFSET ?
                    """
                    cursor.execute(query, (f"%{search}%", f"%{search}%", page_size, offset))
                else:
                    query = """
                        SELECT id, nome_completo, tipo_crm, crm, uf_crm
                        FROM medicos 
                        ORDER BY data_criacao DESC
                        LIMIT ? OFFSET ?
                    """
                    cursor.execute(query, (page_size, offset))
                medicos = []
                for row in cursor.fetchall():
                    medicos.append({
                        "id": row[0],
                        "nome_completo": row[1],
                        "tipo_crm": row[2],
                        "crm": row[3],
                        "uf_crm": row[4]
                    })

        total_pages = max(1, (total + page_size - 1) // page_size)
        return {
            "results": medicos,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages
        }
    except Exception as e:
        logger.error(f"Erro ao buscar médicos: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro ao buscar médicos: {str(e)}")

@app.get("/api/health")
async def health_check():
    """
    Verifica saúde da API e banco de dados
    """
    try:
        is_postgres = os.getenv('RENDER') or os.getenv('RAILWAY_ENVIRONMENT')
        
        with get_db_connection() as conn:
            if is_postgres:
                from sqlalchemy import text
                result = conn.execute(text("SELECT COUNT(*) FROM pacientes"))
                pacientes_count = result.fetchone()[0]
                result = conn.execute(text("SELECT COUNT(*) FROM medicos"))
                medicos_count = result.fetchone()[0]
            else:
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) FROM pacientes")
                pacientes_count = cursor.fetchone()[0]
                cursor.execute("SELECT COUNT(*) FROM medicos")
                medicos_count = cursor.fetchone()[0]
        
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