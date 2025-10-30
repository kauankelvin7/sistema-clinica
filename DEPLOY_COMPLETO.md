# 🚀 GUIA COMPLETO DE DEPLOY

## 📋 Resumo do Sistema

### Arquitetura Atual
```
Frontend (React) → Backend (FastAPI) → Banco SQLite LOCAL ❌
```

### Arquitetura de Produção
```
Frontend (Vercel) → Backend (Railway) → PostgreSQL (Compartilhado) ✅
```

---

## 🎯 PASSO A PASSO - Deploy Completo

### 1️⃣ Preparar Repositório GitHub

```bash
# No seu PC, dentro da pasta do projeto:
git init
git add .
git commit -m "Initial commit - Sistema de Atestados"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/sistema-clinica.git
git push -u origin main
```

---

### 2️⃣ Deploy do Backend (Railway)

**Opção A: Railway (Recomendado - $5 grátis/mês)**

1. Acesse https://railway.app
2. Faça login com GitHub
3. Clique em "New Project"
4. Escolha "Deploy from GitHub repo"
5. Selecione o repositório `sistema-clinica`
6. Railway detecta automaticamente que é Python ✅
7. Clique em "+ New" → "Database" → "PostgreSQL"
8. Aguarde deploy (~2 minutos)
9. Copie a URL pública (ex: https://sistema-clinica-production.up.railway.app)

**Variáveis de Ambiente no Railway:**
- `DATABASE_URL` → Já configurado automaticamente ✅
- `FRONTEND_URL` → `https://SEU_APP.vercel.app` (você vai pegar depois)

---

### 3️⃣ Deploy do Frontend (Vercel)

1. Acesse https://vercel.com
2. Faça login com GitHub
3. Clique em "Add New..." → "Project"
4. Selecione o repositório `sistema-clinica`
5. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
6. **Environment Variables:**
   - Key: `VITE_API_URL`
   - Value: `https://SEU_BACKEND.up.railway.app` (URL do Railway)
7. Clique em "Deploy"
8. Aguarde build (~1 minuto)
9. Copie a URL (ex: https://sistema-clinica.vercel.app)

---

### 4️⃣ Atualizar CORS no Backend

**Volte no Railway:**
1. Vá em "Variables"
2. Adicione `FRONTEND_URL` com a URL do Vercel
3. O backend vai reiniciar automaticamente

---

### 5️⃣ Testar o Sistema

1. Acesse `https://SEU_APP.vercel.app`
2. Preencha o formulário
3. Clique em "Gerar Declaração"
4. O documento deve ser gerado e baixado! ✅

**Teste de múltiplos PCs:**
- Acesse de outro computador/celular
- Dados cadastrados estarão disponíveis para todos! ✅

---

## 💰 Custos

| Serviço | Plano Grátis | Limite |
|---------|--------------|--------|
| **Vercel** | Ilimitado | 100GB bandwidth/mês |
| **Railway** | $5 crédito/mês | ~500h de servidor |
| **PostgreSQL** | Incluído no Railway | 100MB |

**Total: GRÁTIS para começar!** 🎉

Se crescer muito:
- Railway Pro: $5/mês por workspace
- PostgreSQL maior: $5-10/mês

---

## 🔧 Comandos Úteis

### Testar localmente com PostgreSQL:
```bash
# Instalar PostgreSQL local (Windows)
choco install postgresql

# Criar banco local
createdb clinica_test

# Configurar variável de ambiente
$env:DATABASE_URL="postgresql://postgres:senha@localhost/clinica_test"

# Rodar backend
python -m uvicorn backend.main:app --reload
```

### Ver logs do Railway:
```bash
# Instalar CLI do Railway
npm i -g @railway/cli

# Login
railway login

# Ver logs
railway logs
```

---

## ❓ FAQ

**P: O banco compartilha entre todos os PCs?**
R: SIM! ✅ PostgreSQL no Railway é acessível de qualquer lugar.

**P: Posso usar SQLite em produção?**
R: NÃO! ❌ Cada deploy criaria um banco novo vazio.

**P: Preciso pagar algo?**
R: Não! Railway dá $5/mês grátis (suficiente para começar).

**P: Como migrar dados do SQLite local?**
R: Use `pgloader` ou exporte CSV e importe no PostgreSQL.

**P: E se exceder o limite grátis?**
R: Railway cobra apenas o que usar acima de $5/mês.

---

## 🎊 Resultado Final

Depois do deploy:
- ✅ Frontend acessível de qualquer lugar
- ✅ Backend rodando 24/7 em servidor cloud
- ✅ Banco de dados compartilhado entre todos
- ✅ Atualizações automáticas via Git push
- ✅ HTTPS grátis (seguro)
- ✅ Escalável conforme crescimento

---

## 🚨 IMPORTANTE

**NÃO FAÇA apenas push no GitHub!** Isso não funciona porque:
1. GitHub só hospeda código, não executa Python
2. Vercel só roda frontend (React)
3. Backend precisa de servidor próprio (Railway/Render)
4. Banco precisa estar em cloud (PostgreSQL)

**SIGA OS PASSOS ACIMA** para deploy correto! ✅
