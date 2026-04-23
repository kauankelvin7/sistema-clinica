"""
Módulo de gerenciamento do banco de dados SQLite
Sistema de Homologação de Atestados Médicos
Autor: Kauan Kelvin
Data: 28/10/2025

Este módulo implementa:
- Conexões seguras ao banco de dados
- Prepared statements para prevenir SQL injection
- Validação de dados de entrada
- Tratamento robusto de erros
- Logging de operações
"""

import sqlite3
import logging
from contextlib import contextmanager
from typing import Optional, Dict, List, Any
from pathlib import Path

# Importar configurações centralizadas
try:
    from .config import (
        DB_FILE, DB_TIMEOUT, DB_CHECK_SAME_THREAD,
        CPF_LENGTH, RG_MIN_LENGTH, MAX_NOME_LENGTH
    )
except ImportError:
    # Fallback se config não estiver disponível
    import os
    DB_FILE = Path(os.path.dirname(os.path.dirname(__file__))) / 'data' / 'homologacao.db'
    DB_TIMEOUT = 30
    DB_CHECK_SAME_THREAD = False
    CPF_LENGTH = 11
    RG_MIN_LENGTH = 5
    MAX_NOME_LENGTH = 200

# Configurar logger
logger = logging.getLogger(__name__)

class DatabaseError(Exception):
    """Exceção personalizada para erros de banco de dados"""
    pass

@contextmanager
def get_db_connection():
    """
    Context manager para conexão segura com o banco de dados SQLite.
    Garante que a conexão seja fechada adequadamente mesmo em caso de erro.
    
    Yields:
        sqlite3.Connection: Conexão com o banco de dados
        
    Raises:
        DatabaseError: Se houver erro ao conectar ao banco
    """
    conn = None
    try:
        # Criar o diretório se não existir
        DB_FILE.parent.mkdir(parents=True, exist_ok=True)
        
        conn = sqlite3.connect(
            str(DB_FILE),
            timeout=DB_TIMEOUT,
            check_same_thread=DB_CHECK_SAME_THREAD
        )
        conn.row_factory = sqlite3.Row  # Permite acessar colunas como dicionários
        
        # Habilitar foreign keys
        conn.execute("PRAGMA foreign_keys = ON")
        
        # Habilitar write-ahead logging para melhor concorrência
        conn.execute("PRAGMA journal_mode = WAL")
        
        logger.debug("Conexão com banco de dados estabelecida")
        yield conn
        
    except sqlite3.Error as e:
        logger.error(f"Erro ao conectar ao banco de dados: {e}")
        raise DatabaseError(f"Erro de conexão com o banco de dados: {e}")
        
    finally:
        if conn:
            conn.close()
            logger.debug("Conexão com banco de dados fechada")

def validar_dados_paciente(tipo_doc: str, numero_doc: str, nome: str) -> bool:
    """
    Valida os dados do paciente antes de inserir no banco
    
    Args:
        tipo_doc: Tipo de documento (CPF ou RG)
        numero_doc: Número do documento (apenas dígitos)
        nome: Nome completo do paciente
        
    Returns:
        bool: True se válido, False caso contrário
    """
    # Validar tipo de documento
    if tipo_doc not in ['CPF', 'RG']:
        logger.warning(f"Tipo de documento inválido: {tipo_doc}")
        return False
    
    # Validar número do documento
    if not numero_doc or not numero_doc.isdigit():
        logger.warning("Número de documento inválido (deve conter apenas dígitos)")
        return False
    
    if tipo_doc == 'CPF' and len(numero_doc) != CPF_LENGTH:
        logger.warning(f"CPF deve ter {CPF_LENGTH} dígitos")
        return False
    
    if tipo_doc == 'RG' and len(numero_doc) < RG_MIN_LENGTH:
        logger.warning(f"RG deve ter pelo menos {RG_MIN_LENGTH} dígitos")
        return False
    
    # Validar nome
    if not nome or len(nome.strip()) == 0:
        logger.warning("Nome do paciente não pode estar vazio")
        return False
    
    if len(nome) > MAX_NOME_LENGTH:
        logger.warning(f"Nome do paciente excede o tamanho máximo de {MAX_NOME_LENGTH} caracteres")
        return False
    
    return True

def validar_dados_medico(tipo_crm: str, crm: str, nome: str, uf: str) -> bool:
    """
    Valida os dados do médico antes de inserir no banco
    
    Args:
        tipo_crm: Tipo de registro (CRM, CRO, etc)
        crm: Número do registro
        nome: Nome completo do médico
        uf: UF do registro
        
    Returns:
        bool: True se válido, False caso contrário
    """
    if tipo_crm not in ['CRM', 'CRO', 'RMS']:
        logger.warning(f"Tipo de registro inválido: {tipo_crm}")
        return False
    
    if not crm or len(crm.strip()) == 0:
        logger.warning("Número de registro não pode estar vazio")
        return False
    
    if not nome or len(nome.strip()) == 0:
        logger.warning("Nome do médico não pode estar vazio")
        return False
    
    if len(nome) > MAX_NOME_LENGTH:
        logger.warning(f"Nome do médico excede o tamanho máximo de {MAX_NOME_LENGTH} caracteres")
        return False
    
    if not uf or len(uf) != 2:
        logger.warning("UF deve ter 2 caracteres")
        return False
    
    return True

def create_tables():
    """
    Cria as tabelas de Pacientes, Médicos e Atestados se elas não existirem.
    Implementa índices para otimização de consultas.
    
    Raises:
        DatabaseError: Se houver erro ao criar as tabelas
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Tabela Pacientes
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS pacientes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nome_completo TEXT NOT NULL,
                    tipo_doc TEXT NOT NULL DEFAULT 'CPF',
                    numero_doc TEXT NOT NULL,
                    cargo TEXT,
                    empresa TEXT,
                    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(tipo_doc, numero_doc)
                )
            ''')
            
            # Índices para otimização de consultas de pacientes
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_pacientes_nome 
                ON pacientes(nome_completo)
            ''')
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_pacientes_doc 
                ON pacientes(tipo_doc, numero_doc)
            ''')
            
            # Tabela Médicos
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS medicos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nome_completo TEXT NOT NULL,
                    tipo_crm TEXT NOT NULL DEFAULT 'CRM',
                    crm TEXT NOT NULL,
                    uf_crm TEXT NOT NULL,
                    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(tipo_crm, crm)
                )
            ''')
            
            # Índices para otimização de consultas de médicos
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_medicos_nome 
                ON medicos(nome_completo)
            ''')
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_medicos_registro 
                ON medicos(tipo_crm, crm)
            ''')
            
            # Tabela Atestados
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS atestados (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    paciente_id INTEGER NOT NULL,
                    medico_id INTEGER NOT NULL,
                    data_atestado TEXT NOT NULL,
                    qtd_dias_atestado INTEGER NOT NULL CHECK(qtd_dias_atestado > 0),
                    codigo_cid TEXT NOT NULL,
                    data_homologacao TEXT NOT NULL,
                    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
                    FOREIGN KEY (medico_id) REFERENCES medicos(id) ON DELETE CASCADE
                )
            ''')
            
            # Índices para otimização de consultas de atestados
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_atestados_paciente 
                ON atestados(paciente_id)
            ''')
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_atestados_medico 
                ON atestados(medico_id)
            ''')
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_atestados_data 
                ON atestados(data_atestado)
            ''')
            
            conn.commit()
            logger.info("Tabelas do banco de dados criadas/verificadas com sucesso")
            
    except sqlite3.Error as e:
        logger.error(f"Erro ao criar tabelas: {e}")
        raise DatabaseError(f"Erro ao criar tabelas: {e}")

def sanitizar_entrada(texto: str) -> str:
    """
    Sanitiza entrada de texto removendo caracteres potencialmente perigosos
    
    Args:
        texto: Texto a ser sanitizado
        
    Returns:
        str: Texto sanitizado
    """
    if not texto:
        return ""
    
    # Remove caracteres nulos e de controle
    texto_limpo = ''.join(char for char in texto if ord(char) >= 32 or char in ['\n', '\r', '\t'])
    
    return texto_limpo.strip()

if __name__ == '__main__':
    try:
        create_tables()
        print(f"Banco de dados criado em: {DB_FILE}")
        print("Tabelas 'pacientes', 'medicos' e 'atestados' verificadas/criadas com sucesso.")
        logger.info("Script de criação de banco executado com sucesso")
    except DatabaseError as e:
        print(f"Erro: {e}")
        logger.error(f"Falha ao executar script de criação: {e}")