"""
WSGI config for PythonAnywhere deployment
"""
import sys
import os

# Adicionar o diretório do projeto ao path
path = '/home/SEU_USERNAME/sistema-clinica/backend'
if path not in sys.path:
    sys.path.append(path)

# Configurar variáveis de ambiente
os.environ['DATABASE_URL'] = 'postgresql://postgres:novaadmin2026@db.gnolsvpefqdkmmaglozw.supabase.co:5432/postgres'
os.environ['RENDER'] = 'true'

# Importar a aplicação FastAPI
from main import app

# Wrapper para WSGI
application = app
