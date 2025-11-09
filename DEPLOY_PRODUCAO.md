# 🚀 GUIA DE DEPLOY PARA PRODUÇÃO

## Sistema de Homologação de Atestados Médicos v2.0

---

## 📋 PRÉ-REQUISITOS

- Python 3.11+ instalado
- Node.js 18+ e npm instalado
- Servidor com acesso SSH
- Domínio configurado (opcional)

---

## 🔧 CONFIGURAÇÃO DO BACKEND

### 1. Preparar Ambiente

```bash
# Clonar repositório
git clone https://github.com/kauankelvin7/sistema-clinica.git
cd sistema-clinica

# Criar ambiente virtual Python
python -m venv venv

# Ativar ambiente virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependências
cd backend
pip install -r requirements.txt
```

### 2. Configurar Variáveis de Ambiente

Criar arquivo `.env` no diretório `backend/`:

```env
# Banco de Dados (Produção)
DATABASE_URL=postgresql://usuario:senha@localhost:5432/sistema_clinica

# Ou usar Railway/Render (opcional)
RENDER=true
# ou
RAILWAY_ENVIRONMENT=production

# CORS (Frontend URL)
FRONTEND_URL=https://seu-dominio.com
```

### 3. Iniciar Backend em Produção

```bash
# Opção 1: Com Gunicorn (Linux/Mac - RECOMENDADO)
gunicorn backend.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000

# Opção 2: Com Uvicorn (Windows/Development)
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 4

# Opção 3: Com PM2 (Node Process Manager - RECOMENDADO)
pm2 start "uvicorn backend.main:app --host 0.0.0.0 --port 8000" --name sistema-clinica-backend
```

### 4. Configurar Nginx como Proxy Reverso (Opcional)

```nginx
server {
    listen 80;
    server_name api.seu-dominio.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🎨 CONFIGURAÇÃO DO FRONTEND

### 1. Instalar Dependências

```bash
cd frontend
npm install
```

### 2. Configurar API URL

Editar `frontend/src/config/api.ts`:

```typescript
// Para produção
const API_BASE_URL = 'https://api.seu-dominio.com'
// ou
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
```

Criar arquivo `.env` no diretório `frontend/`:

```env
VITE_API_URL=https://api.seu-dominio.com
```

### 3. Build para Produção

```bash
npm run build
```

Isso criará a pasta `dist/` com os arquivos otimizados.

### 4. Servir Frontend

**Opção 1: Nginx (RECOMENDADO)**

```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    root /var/www/sistema-clinica/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Opção 2: Servir com Node.js**

```bash
npm install -g serve
serve -s dist -l 3000
```

**Opção 3: PM2 com servir estático**

```bash
pm2 serve dist 3000 --name sistema-clinica-frontend --spa
```

---

## 🗄️ BANCO DE DADOS

### Opção 1: SQLite (Development/Pequenas Instalações)

Automático - nenhuma configuração necessária.

### Opção 2: PostgreSQL (Produção - RECOMENDADO)

```bash
# Instalar PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Criar banco de dados
sudo -u postgres psql
CREATE DATABASE sistema_clinica;
CREATE USER clinica_user WITH PASSWORD 'senha_segura';
GRANT ALL PRIVILEGES ON DATABASE sistema_clinica TO clinica_user;
\q

# Configurar no .env
DATABASE_URL=postgresql://clinica_user:senha_segura@localhost:5432/sistema_clinica
```

---

## 🔐 SEGURANÇA

### 1. Firewall

```bash
# Permitir apenas portas necessárias
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

### 2. SSL/HTTPS com Let's Encrypt

```bash
# Instalar Certbot
sudo apt-get install certbot python3-certbot-nginx

# Gerar certificado
sudo certbot --nginx -d seu-dominio.com -d api.seu-dominio.com
```

### 3. Atualizar CORS no Backend

Editar `backend/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://seu-dominio.com"],  # Produção
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📦 DEPLOY EM PLATAFORMAS CLOUD

### Render.com (Fácil e Grátis)

1. **Backend:**
   - Criar novo Web Service
   - Conectar repositório GitHub
   - Build Command: `pip install -r backend/requirements.txt`
   - Start Command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`

2. **Frontend:**
   - Criar novo Static Site
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/dist`

### Railway (Alternativa)

1. Criar novo projeto
2. Adicionar PostgreSQL addon
3. Deploy backend e frontend separadamente

### Vercel (Frontend Only)

```bash
cd frontend
npm install -g vercel
vercel --prod
```

---

## 🧪 TESTES PÓS-DEPLOY

### 1. Testar Backend

```bash
# Health check
curl http://api.seu-dominio.com/api/health

# Testar geração HTML
curl -X POST http://api.seu-dominio.com/api/generate-html \
  -H "Content-Type: application/json" \
  -d '{"paciente":{"nome":"Teste"},...}'
```

### 2. Testar Frontend

- Acesse https://seu-dominio.com
- Preencha formulário
- Clique em "Gerar Documento ▼"
- Teste "Gerar Documento HTML"
- Teste "Gerar Documento Word"

---

## 📊 MONITORAMENTO

### PM2 Dashboard

```bash
pm2 monit
```

### Logs

```bash
# Backend
pm2 logs sistema-clinica-backend

# Frontend
pm2 logs sistema-clinica-frontend
```

---

## 🔄 ATUALIZAÇÕES

```bash
# 1. Parar serviços
pm2 stop all

# 2. Atualizar código
git pull origin main

# 3. Atualizar dependências
cd backend && pip install -r requirements.txt
cd ../frontend && npm install

# 4. Rebuild frontend
npm run build

# 5. Reiniciar serviços
pm2 restart all
```

---

## ⚡ PERFORMANCE

### Backend

- Use Gunicorn com múltiplos workers
- Configure cache HTTP
- Use CDN para assets estáticos

### Frontend

- Build está otimizado automaticamente pelo Vite
- Usa lazy loading de componentes
- Assets minimizados e com hash

---

## 📞 SUPORTE

**Desenvolvedor:** Kauan Kelvin  
**Versão:** 2.0.0  
**Data:** 09/11/2025

---

## ✅ CHECKLIST DE DEPLOY

- [ ] Ambiente Python configurado
- [ ] Dependências do backend instaladas
- [ ] Banco de dados configurado
- [ ] Backend rodando e testado
- [ ] Frontend buildado
- [ ] Frontend servido corretamente
- [ ] CORS configurado
- [ ] SSL/HTTPS configurado
- [ ] Firewall configurado
- [ ] Testes de geração funcionando
- [ ] Monitoramento ativo
- [ ] Backup configurado

---

## 🎯 ARQUITETURA EM PRODUÇÃO

```
Internet
    ↓
[Nginx/CloudFlare]
    ↓
    ├─→ Frontend (Porta 80/443)
    │   └─→ React/Vite (Static Files)
    │
    └─→ Backend API (Porta 8000)
        ├─→ FastAPI + Uvicorn
        ├─→ PostgreSQL Database
        └─→ Geração de Documentos
            ├─→ HTML (unified_generator)
            └─→ Word (document_generator)
```

---

**Sistema pronto para produção! 🚀**
