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
os.environ['DATABASE_URL'] = 'postgresql://postgres:33277525@db.xliwkhhaatbaqxqktqrn.supabase.co:5432/postgres'
os.environ['RENDER'] = 'true'

# Importar a aplicação FastAPI
from main import app

# Wrapper para WSGI
application = app
