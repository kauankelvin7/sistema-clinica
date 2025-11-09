"""
Arquivo de configuração centralizada do Sistema de Homologação de Atestados Médicos
Autor: Kauan Kelvin
Data: 28/10/2025
"""

import os
import sys
import logging
from pathlib import Path

# ===== DETECÇÃO DE AMBIENTE =====
# Detectar se está em produção (Render, Railway, Vercel)
IS_PRODUCTION = os.getenv('RENDER') or os.getenv('RAILWAY_ENVIRONMENT') or os.getenv('VERCEL')

def is_frozen():
    """Detecta se está rodando como executável PyInstaller"""
    return getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS')

def get_base_dir():
    """Retorna o diretório base dependendo do ambiente"""
    if is_frozen():
        # Executável: usar pasta do usuário
        return Path.home() / 'AppData' / 'Local' / 'SistemaHomologacao'
    else:
        # Desenvolvimento: usar pasta do projeto
        return Path(__file__).resolve().parent.parent

def get_resources_dir():
    """Retorna o diretório de recursos (assets, models)"""
    if is_frozen():
        # PyInstaller cria uma pasta temporária e armazena o caminho em _MEIPASS
        return Path(sys._MEIPASS)
    else:
        # Em desenvolvimento
        return Path(__file__).resolve().parent.parent

# ===== CONFIGURAÇÕES DE CAMINHOS =====
BASE_DIR = get_base_dir()
RESOURCES_DIR = get_resources_dir()

# Diretórios de dados (sempre na pasta do usuário para executável)
DATA_DIR = BASE_DIR / 'data'
GENERATED_DOCS_DIR = DATA_DIR / 'generated_documents'
LOGS_DIR = DATA_DIR / 'logs'

# Diretórios de recursos (na pasta de recursos para executável)
MODELS_DIR = RESOURCES_DIR / 'models'
ASSETS_DIR = RESOURCES_DIR / 'assets'

# Cria os diretórios necessários se não existirem
for directory in [DATA_DIR, GENERATED_DOCS_DIR, LOGS_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# ===== CONFIGURAÇÕES DO BANCO DE DADOS =====
DB_FILE = DATA_DIR / 'homologacao.db'
DB_TIMEOUT = 30  # Timeout de conexão em segundos
DB_CHECK_SAME_THREAD = False  # Permite uso em múltiplas threads

# ===== CONFIGURAÇÕES DO APLICATIVO =====
APP_NAME = "Sistema de Homologação de Atestados Médicos"
APP_VERSION = "2.0.0"
APP_AUTHOR = "Kauan Kelvin"
WINDOW_MIN_WIDTH = 850
WINDOW_MIN_HEIGHT = 700
WINDOW_DEFAULT_WIDTH = 950
WINDOW_DEFAULT_HEIGHT = 800

# ===== CONFIGURAÇÕES DE DOCUMENTOS =====
TEMPLATE_FILE = MODELS_DIR / 'modelo homologação.docx'
DOCUMENT_PREFIX = "Declaracao_"
DOCUMENT_EXTENSION = ".docx"
MAX_FILENAME_LENGTH = 200  # Tamanho máximo do nome do arquivo

# ===== CONFIGURAÇÕES DE VALIDAÇÃO =====
CPF_LENGTH = 11
RG_MIN_LENGTH = 5
RG_MAX_LENGTH = 15
MAX_NOME_LENGTH = 200
MAX_CARGO_LENGTH = 150
MAX_EMPRESA_LENGTH = 200
MAX_CID_LENGTH = 20
MIN_DIAS_AFASTAMENTO = 1
MAX_DIAS_AFASTAMENTO = 365

# ===== CONFIGURAÇÕES DE LOGGING =====
LOG_FILE = LOGS_DIR / 'sistema_homologacao.log'
LOG_LEVEL = logging.INFO
LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
LOG_DATE_FORMAT = '%d/%m/%Y %H:%M:%S'
LOG_MAX_BYTES = 10 * 1024 * 1024  # 10MB
LOG_BACKUP_COUNT = 5  # Manter 5 arquivos de backup

# ===== CONFIGURAÇÕES DE SEGURANÇA =====
ENABLE_SQL_INJECTION_PROTECTION = True
ENABLE_XSS_PROTECTION = True
SANITIZE_FILENAMES = True
MAX_DB_QUERY_TIME = 5  # segundos

# ===== CONFIGURAÇÕES REGIONAIS =====
LOCALE_LANGUAGE = 'pt_BR'
DATE_FORMAT = 'dd/MM/yyyy'
DATETIME_FORMAT = 'dd/MM/yyyy HH:mm:ss'

# ===== URLS DE CONSULTA ONLINE =====
CONSULTA_URLS = {
    "CRM": "https://portal.cfm.org.br/busca-medicos/",
    "CRO": "https://website.cfo.org.br/profissionais/busca-de-profissionais/",
    "CRN": "http://www.cfn.org.br/index.php/pesquisa-de-nutricionistas/",
    "RMs": "https://www.google.com/search?q=consulta+registro+profissional+saude"
}

# ===== LISTA DE UFs BRASILEIRAS =====
UFS_BRASIL = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
    "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
    "RS", "RO", "RR", "SC", "SP", "SE", "TO"
]

# ===== TIPOS DE DOCUMENTOS ACEITOS =====
TIPOS_DOCUMENTO = ["CPF", "RG"]

# ===== TIPOS DE REGISTRO PROFISSIONAL =====
TIPOS_REGISTRO = ["CRM", "CRO", "CRN", "RMs"]

# ===== CONFIGURAÇÕES DE INTERFACE =====
THEME_PRIMARY_COLOR = "#38b2ac"
THEME_SECONDARY_COLOR = "#81c7d4"
THEME_SUCCESS_COLOR = "#48bb78"
THEME_ERROR_COLOR = "#e53e3e"
THEME_WARNING_COLOR = "#ed8936"

# ===== MENSAGENS DO SISTEMA =====
MSG_CAMPO_OBRIGATORIO = "O campo '{campo}' é obrigatório."
MSG_CPF_INVALIDO = "O CPF deve conter 11 dígitos."
MSG_RG_INVALIDO = "O RG parece estar incompleto."
MSG_ERRO_BD = "Erro ao acessar o banco de dados: {erro}"
MSG_SUCESSO_GERACAO = "Declaração gerada com sucesso!\nSalvo em: {caminho}"
MSG_ERRO_GERACAO = "Não foi possível gerar a declaração. Verifique o modelo e os dados."
MSG_CAMPOS_LIMPOS = "Campos limpos. Sistema pronto."
MSG_SISTEMA_PRONTO = "Sistema pronto para uso."

def configurar_logging():
    """
    Configura o sistema de logging da aplicação
    """
    # Criar o diretório de logs se não existir
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    
    # Configurar logging com rotação de arquivos
    from logging.handlers import RotatingFileHandler
    
    # Configurar handler para arquivo
    file_handler = RotatingFileHandler(
        LOG_FILE,
        maxBytes=LOG_MAX_BYTES,
        backupCount=LOG_BACKUP_COUNT,
        encoding='utf-8'
    )
    file_handler.setLevel(LOG_LEVEL)
    file_handler.setFormatter(logging.Formatter(LOG_FORMAT, LOG_DATE_FORMAT))
    
    # Configurar handler para console
    console_handler = logging.StreamHandler()
    console_handler.setLevel(LOG_LEVEL)
    console_handler.setFormatter(logging.Formatter(LOG_FORMAT, LOG_DATE_FORMAT))
    
    # Configurar logger raiz
    root_logger = logging.getLogger()
    root_logger.setLevel(LOG_LEVEL)
    root_logger.addHandler(file_handler)
    root_logger.addHandler(console_handler)
    
    return root_logger

# Inicializar logging quando o módulo é importado
logger = configurar_logging()
logger.info(f"{APP_NAME} v{APP_VERSION} - Sistema inicializado")
