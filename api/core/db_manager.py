"""
Gerenciador de banco de dados com suporte a SQLite e PostgreSQL
"""
import os
import logging
from contextlib import contextmanager
from typing import Optional, List, Dict, Any
from pathlib import Path

logger = logging.getLogger(__name__)

# Detectar se estamos em produção
IS_PRODUCTION = os.getenv('RAILWAY_ENVIRONMENT') or os.getenv('RENDER')

if IS_PRODUCTION:
    # Produção: PostgreSQL com SQLAlchemy
    from sqlalchemy import create_engine, text
    from sqlalchemy.orm import sessionmaker, Session
    from sqlalchemy.pool import NullPool
    
    DATABASE_URL = os.getenv('DATABASE_URL', '')
    if DATABASE_URL.startswith('postgres://'):
        DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
    
    engine = create_engine(
        DATABASE_URL,
        poolclass=NullPool,
        echo=False
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    @contextmanager
    def get_db_connection():
        """Context manager para PostgreSQL com SQLAlchemy"""
        session = SessionLocal()
        try:
            yield session
            session.commit()
        except Exception as e:
            session.rollback()
            logger.error(f"Erro no banco PostgreSQL: {e}")
            raise
        finally:
            session.close()
    
    def execute_query(query: str, params: Dict = None):
        """Executa query no PostgreSQL"""
        with get_db_connection() as session:
            result = session.execute(text(query), params or {})
            return result.fetchall()
    
    def execute_insert(query: str, params: Dict = None):
        """Executa INSERT no PostgreSQL e retorna o ID"""
        with get_db_connection() as session:
            result = session.execute(text(query), params or {})
            session.commit()
            # PostgreSQL retorna RETURNING id
            if 'RETURNING' in query.upper():
                return result.fetchone()[0]
            return result.lastrowid

else:
    # Desenvolvimento: SQLite
    import sqlite3
    
    DB_FILE = Path(__file__).parent.parent / 'data' / 'clinica.db'
    DB_FILE.parent.mkdir(parents=True, exist_ok=True)
    
    @contextmanager
    def get_db_connection():
        """Context manager para SQLite"""
        conn = None
        try:
            conn = sqlite3.connect(str(DB_FILE), timeout=30, check_same_thread=False)
            conn.row_factory = sqlite3.Row
            conn.execute("PRAGMA foreign_keys = ON")
            conn.execute("PRAGMA journal_mode = WAL")
            yield conn
            conn.commit()
        except sqlite3.Error as e:
            if conn:
                conn.rollback()
            logger.error(f"Erro no banco SQLite: {e}")
            raise
        finally:
            if conn:
                conn.close()
    
    def execute_query(query: str, params: Dict = None):
        """Executa query no SQLite"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params or {})
            return cursor.fetchall()
    
    def execute_insert(query: str, params: Dict = None):
        """Executa INSERT no SQLite e retorna o ID"""
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, params or {})
            conn.commit()
            return cursor.lastrowid


def create_tables():
    """Cria tabelas compatíveis com SQLite e PostgreSQL"""
    
    if IS_PRODUCTION:
        # PostgreSQL - usa SERIAL ao invés de AUTOINCREMENT
        queries = [
            '''
            CREATE TABLE IF NOT EXISTS pacientes (
                id SERIAL PRIMARY KEY,
                nome_completo TEXT NOT NULL,
                tipo_doc TEXT NOT NULL DEFAULT 'CPF',
                numero_doc TEXT NOT NULL,
                cargo TEXT,
                empresa TEXT,
                data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(tipo_doc, numero_doc)
            )
            ''',
            'CREATE INDEX IF NOT EXISTS idx_pacientes_nome ON pacientes(nome_completo)',
            'CREATE INDEX IF NOT EXISTS idx_pacientes_doc ON pacientes(tipo_doc, numero_doc)',
            
            '''
            CREATE TABLE IF NOT EXISTS medicos (
                id SERIAL PRIMARY KEY,
                nome_completo TEXT NOT NULL,
                tipo_crm TEXT NOT NULL DEFAULT 'CRM',
                crm TEXT NOT NULL,
                uf_crm TEXT NOT NULL,
                data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(tipo_crm, crm)
            )
            ''',
            'CREATE INDEX IF NOT EXISTS idx_medicos_nome ON medicos(nome_completo)',
            'CREATE INDEX IF NOT EXISTS idx_medicos_registro ON medicos(tipo_crm, crm)',
            
            '''
            CREATE TABLE IF NOT EXISTS atestados (
                id SERIAL PRIMARY KEY,
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
            ''',
            'CREATE INDEX IF NOT EXISTS idx_atestados_paciente ON atestados(paciente_id)',
            'CREATE INDEX IF NOT EXISTS idx_atestados_medico ON atestados(medico_id)',
            'CREATE INDEX IF NOT EXISTS idx_atestados_data ON atestados(data_atestado)',
        ]
        
        with get_db_connection() as session:
            for query in queries:
                session.execute(text(query))
            session.commit()
            
    else:
        # SQLite - usa AUTOINCREMENT
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
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
            
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_pacientes_nome ON pacientes(nome_completo)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_pacientes_doc ON pacientes(tipo_doc, numero_doc)')
            
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
            
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_medicos_nome ON medicos(nome_completo)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_medicos_registro ON medicos(tipo_crm, crm)')
            
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
            
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_atestados_paciente ON atestados(paciente_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_atestados_medico ON atestados(medico_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_atestados_data ON atestados(data_atestado)')
            
            conn.commit()
    
    logger.info(f"Tabelas criadas com sucesso no {'PostgreSQL' if IS_PRODUCTION else 'SQLite'}")


if __name__ == '__main__':
    create_tables()
    print(f"✅ Banco configurado: {'PostgreSQL (Produção)' if IS_PRODUCTION else 'SQLite (Local)'}")
