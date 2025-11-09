# Backend Sistema Clinica - PythonAnywhere

## Deploy no PythonAnywhere

### 1. Fazer upload dos arquivos
- Upload via Git: `git clone https://github.com/kauankelvin7/sistema-clinica.git`
- Ou fazer upload manual da pasta `backend/`

### 2. Instalar dependências
```bash
pip3.10 install --user -r requirements.txt
```

### 3. Configurar variáveis de ambiente
No arquivo `.env`:
```
DATABASE_URL=postgresql://postgres:33277525@db.xliwkhhaatbaqxqktqrn.supabase.co:5432/postgres
RENDER=true
```

### 4. Configurar WSGI
Usar o arquivo `wsgi.py` fornecido

### 5. URL da API
Será: `https://SEU_USERNAME.pythonanywhere.com`
