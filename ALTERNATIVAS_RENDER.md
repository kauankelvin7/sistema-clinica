# 🚀 Alternativas GRATUITAS ao Render (Backend FastAPI)

## ⚡ Comparação de Plataformas Gratuitas

| Plataforma | Cold Start | Uptime | RAM | Storage | Database | Velocidade |
|------------|-----------|--------|-----|---------|----------|------------|
| **Render** | 🔴 20-30s | 750h/mês | 512MB | 1GB | PostgreSQL 1GB | Lento |
| **Railway** | 🟡 10-15s | 500h/mês | 512MB | 1GB | PostgreSQL 1GB | Médio |
| **Fly.io** | 🟢 2-5s | Ilimitado | 256MB | 3GB | PostgreSQL 3GB | Rápido |
| **Koyeb** | 🟢 3-8s | Ilimitado | 512MB | 2.5GB | N/A | Rápido |
| **Vercel** | 🔴 N/A | N/A | N/A | N/A | N/A | ❌ Só frontend |

---

## 🏆 MELHOR OPÇÃO: Fly.io

### ✅ Vantagens:
- ⚡ **Cold start de 2-5 segundos** (vs 30s do Render)
- 🔄 **Sem limite de horas** (Render = 750h/mês)
- 💾 **3GB de storage** grátis (vs 1GB do Render)
- 🗄️ **PostgreSQL 3GB** grátis
- 🌎 **Servidores globais** (escolha região mais próxima)
- 📦 **Deploy via Docker** (seu app já tem Dockerfile se criou)

### ⚠️ Desvantagens:
- Requer cartão de crédito (mas **NÃO cobra** no plano free)
- Configuração um pouco mais técnica

---

## 🥈 2ª MELHOR: Koyeb

### ✅ Vantagens:
- ⚡ **Cold start de 3-8 segundos**
- 🔄 **Sem limite de horas**
- 💾 **2.5GB de storage**
- 🎯 **Deploy super fácil** (conecta com GitHub)
- 💳 **Não precisa de cartão**

### ⚠️ Desvantagens:
- Não oferece banco PostgreSQL grátis (precisa usar Supabase separado)
- Menos conhecido que Fly.io

---

## 🥉 3ª MELHOR: Railway

### ✅ Vantagens:
- 🎯 **Interface amigável**
- 🗄️ **PostgreSQL incluso**
- 📊 **Dashboard bonito**
- 🔄 **Auto-deploy do GitHub**

### ⚠️ Desvantagens:
- ⏱️ **Limite de 500 horas/mês** (20 dias)
- 🟡 Cold start de 10-15 segundos (melhor que Render, pior que Fly.io)

---

## 📋 GUIA DE MIGRAÇÃO: Render → Fly.io

### Passo 1: Instalar Fly CLI

**Windows (PowerShell):**
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

**macOS/Linux:**
```bash
curl -L https://fly.io/install.sh | sh
```

### Passo 2: Fazer Login
```bash
fly auth login
```

### Passo 3: Criar App no Fly.io
```bash
cd backend
fly launch --no-deploy
```

Vai perguntar:
- **App name**: `sistema-clinica-api` (ou o que preferir)
- **Region**: `gru` (São Paulo) ou `mia` (Miami)
- **PostgreSQL**: `Yes` (cria banco grátis 3GB)
- **Redis**: `No`

### Passo 4: Configurar Secrets (Variáveis de Ambiente)
```bash
# Se você usa Firebase
fly secrets set FIREBASE_CREDENTIALS="$(cat caminho/para/firebase-key.json)"

# Outras variáveis
fly secrets set FRONTEND_URL=https://sistema-clinica-seven.vercel.app
```

### Passo 5: Deploy!
```bash
fly deploy
```

### Passo 6: Ver Logs
```bash
fly logs
```

### Passo 7: Escalar (aumentar recursos se precisar)
```bash
fly scale memory 512  # Aumenta RAM
fly scale count 1     # Garante 1 instância sempre ativa
```

---

## 📋 GUIA DE MIGRAÇÃO: Render → Koyeb

### Passo 1: Criar Conta
1. Acesse https://koyeb.com
2. Crie conta (pode usar GitHub)

### Passo 2: Criar App
1. Clique em "Create App"
2. Escolha "GitHub" como source
3. Conecte seu repositório `sistema-clinica`
4. Configure:
   - **Branch**: `main`
   - **Root directory**: `backend`
   - **Build command**: `pip install -r requirements.txt`
   - **Run command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Port**: `8000`

### Passo 3: Adicionar Variáveis
Em "Environment Variables":
```
FRONTEND_URL=https://sistema-clinica-seven.vercel.app
DATABASE_URL=postgresql://... (do Supabase)
```

### Passo 4: Deploy
Clique em "Deploy" - pronto! 🎉

---

## 📋 GUIA DE MIGRAÇÃO: Render → Railway

### Passo 1: Criar Conta
1. Acesse https://railway.app
2. Login com GitHub

### Passo 2: Criar Projeto
1. "New Project" → "Deploy from GitHub repo"
2. Escolha `sistema-clinica`
3. Railway detecta Python automaticamente

### Passo 3: Adicionar PostgreSQL
1. No projeto, clique "New"
2. "Database" → "Add PostgreSQL"
3. Railway cria banco e variável `DATABASE_URL` automaticamente

### Passo 4: Configurar Variáveis
1. Clique na aplicação Python
2. "Variables" → Adicionar:
```
FRONTEND_URL=https://sistema-clinica-seven.vercel.app
```

### Passo 5: Deploy
Railway faz deploy automático! ✅

---

## 🗄️ ALTERNATIVA DE BANCO: Supabase (PostgreSQL Grátis)

Se escolher Koyeb (que não tem DB), use **Supabase**:

### Vantagens:
- 🆓 **PostgreSQL 500MB grátis** (para sempre)
- ⚡ **Instantâneo** (sem cold start)
- 🔐 **Backup automático**
- 📊 **Dashboard visual**

### Como usar:
1. Crie conta em https://supabase.com
2. Crie novo projeto
3. Copie `DATABASE_URL` (aba Settings → Database)
4. Cole nas variáveis de ambiente do Koyeb

---

## 🎯 RECOMENDAÇÃO FINAL

### Para iniciantes:
**Koyeb** (mais fácil, não precisa cartão)

### Para melhor performance:
**Fly.io** (mais rápido, mais recursos)

### Para interface bonita:
**Railway** (UI mais amigável)

---

## 🚀 Migração Expressa (5 minutos)

### Opção 1: Koyeb (MAIS FÁCIL)
```bash
# 1. Criar conta: https://koyeb.com
# 2. Conectar GitHub
# 3. Selecionar repositório
# 4. Configurar:
#    - Root: backend
#    - Build: pip install -r requirements.txt
#    - Start: uvicorn main:app --host 0.0.0.0 --port $PORT
# 5. Deploy!
```

### Opção 2: Fly.io (MAIS RÁPIDO)
```bash
# 1. Instalar CLI
iwr https://fly.io/install.ps1 -useb | iex

# 2. Login
fly auth login

# 3. Deploy
cd backend
fly launch
fly deploy

# Pronto! URL: https://seu-app.fly.dev
```

---

## 📝 Atualizar Frontend (Vercel)

Após migrar backend, atualize a URL no frontend:

1. Vá em https://vercel.com/seu-projeto/settings
2. Environment Variables
3. Edite `VITE_API_URL`:
   - **Fly.io**: `https://seu-app.fly.dev`
   - **Koyeb**: `https://seu-app.koyeb.app`
   - **Railway**: `https://seu-app.up.railway.app`

4. Redeploy do frontend

---

## 💰 Resumo dos Custos

Todas as opções são **100% GRATUITAS** com as limitações:

| Plataforma | Grátis Para Sempre? | Limite Principal |
|------------|---------------------|------------------|
| Fly.io | ✅ Sim | 3 apps, 256MB RAM |
| Koyeb | ✅ Sim | 2 apps, 512MB RAM |
| Railway | ⚠️ 500h/mês | ~20 dias uptime |
| Render | ⚠️ 750h/mês | Cold starts lentos |

**Nenhuma cobra automaticamente** - você controla 100%!

---

## ❓ Qual Escolher?

**Quer algo RÁPIDO e não se importa com cartão?**
→ **Fly.io** 🏆

**Quer FÁCIL e sem cartão?**
→ **Koyeb** 🥈

**Quer interface bonita?**
→ **Railway** 🥉

**Quer ficar no Render?**
→ Aceite os 30s de cold start 🐌

---

## 📞 Suporte

Qualquer dúvida sobre migração, é só perguntar! 🚀
