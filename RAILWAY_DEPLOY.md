# Sistema de Atestados Médicos - Guia de Deploy

## 📊 Arquitetura

### Desenvolvimento (Atual - Local)
```
Frontend (localhost:3001) → Backend (localhost:8000) → SQLite (local)
```

### Produção (Deploy)
```
Frontend (Vercel) → Backend (Railway) → PostgreSQL (compartilhado)
```

## 🎯 Passo a Passo Completo

### 1. Criar Repositório no GitHub

```bash
# No seu PC:
git init
git add .
git commit -m "Sistema de Atestados - Deploy Ready"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/sistema-clinica.git
git push -u origin main
```

### 2. Deploy do Backend (Railway)

**Por que Railway?**
- ✅ $5 grátis/mês (suficiente para começar)
- ✅ PostgreSQL incluído
- ✅ Deploy automático via Git
- ✅ HTTPS grátis

**Como fazer:**

1. Acesse https://railway.app e faça login com GitHub
2. Clique "New Project" → "Deploy from GitHub repo"
3. Selecione seu repositório
4. Adicione PostgreSQL: "+ New" → "Database" → "PostgreSQL"
5. Copie a URL do backend (ex: `https://api-clinica.up.railway.app`)

**Variáveis necessárias:**
- `DATABASE_URL` → Já configurado automaticamente ✅
- `FRONTEND_URL` → Adicionar depois com URL do Vercel

### 3. Deploy do Frontend (Vercel)

**Por que Vercel?**
- ✅ 100% grátis para projetos pessoais
- ✅ Deploy automático via Git
- ✅ HTTPS grátis
- ✅ CDN global

**Como fazer:**

1. Acesse https://vercel.com e faça login com GitHub
2. "Add New..." → "Project"
3. Selecione seu repositório
4. Configure:
   - **Root Directory:** `frontend`
   - **Framework:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. **Environment Variable:**
   - Key: `VITE_API_URL`
   - Value: URL do Railway (ex: `https://api-clinica.up.railway.app`)
6. Deploy!
7. Copie a URL do Vercel (ex: `https://sistema-clinica.vercel.app`)

### 4. Atualizar CORS

Volte no Railway e adicione a variável:
- Key: `FRONTEND_URL`
- Value: URL do Vercel

## ✅ Resultado

Depois do deploy:
- ✅ **Frontend:** Acessível de qualquer lugar via Vercel
- ✅ **Backend:** Rodando 24/7 no Railway
- ✅ **Banco:** PostgreSQL compartilhado entre TODOS os PCs
- ✅ **HTTPS:** Seguro e grátis
- ✅ **Atualizações:** Automáticas via `git push`

## 🧪 Como Testar

1. Acesse `https://SEU_APP.vercel.app`
2. Preencha o formulário
3. Gere um documento
4. Acesse de outro PC/celular - os dados estarão lá! ✅

## 💰 Custos

| Serviço | Grátis | Pago |
|---------|--------|------|
| Vercel | Ilimitado | - |
| Railway | $5/mês | $0.000231/min |
| PostgreSQL | 100MB | $5-10/mês |

**Total: GRÁTIS para uso moderado!**

## ⚠️ IMPORTANTE

**NÃO funciona apenas com GitHub Pages porque:**
- ❌ GitHub Pages só serve arquivos estáticos
- ❌ Não executa Python (backend)
- ❌ Não tem banco de dados

**Você PRECISA de:**
- ✅ Railway (ou Render/Heroku) para backend
- ✅ PostgreSQL (ou MySQL) para banco compartilhado
- ✅ Vercel (ou Netlify) para frontend

## 🔄 Workflow de Atualização

Depois do deploy inicial:

```bash
# Fazer alterações no código
git add .
git commit -m "Nova feature"
git push

# Railway e Vercel detectam e fazem deploy automático! 🎉
```

## 📱 Banco Compartilhado

**Como funciona:**
1. PostgreSQL fica no Railway (nuvem)
2. Todos os PCs acessam o mesmo banco via internet
3. Dados sincronizados em tempo real

**SQLite vs PostgreSQL:**
- SQLite: Arquivo local, cada PC tem seu próprio banco ❌
- PostgreSQL: Servidor remoto, todos compartilham ✅

## 🆘 Suporte

Problemas comuns:

**Erro de CORS:**
- Verifique se `FRONTEND_URL` está configurado no Railway
- Verifique se `VITE_API_URL` está configurado no Vercel

**Banco vazio após deploy:**
- PostgreSQL começa vazio, é normal
- Cadastre novos dados pela interface web

**Backend não responde:**
- Verifique logs no Railway
- Confirme que `DATABASE_URL` está configurado
