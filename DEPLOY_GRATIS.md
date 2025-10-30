# 🚀 GUIA DE DEPLOY COMPLETO - 100% GRÁTIS

## 📋 Arquitetura da Solução

```
Frontend (Vercel) → Backend (Render ou Vercel) → PostgreSQL (Render)
     GRÁTIS              GRÁTIS                      GRÁTIS
```

---

## 🎯 OPÇÃO 1: Render (Backend) + Vercel (Frontend) - RECOMENDADO

### ✅ Vantagens:
- 100% grátis
- PostgreSQL incluído
- Fácil configuração
- HTTPS automático

### ❌ Desvantagens:
- Servidor hiberna após 15 min (primeiro acesso demora ~30s)

---

### **PASSO A PASSO - RENDER:**

#### **1️⃣ Deploy do Backend no Render (10 min)**

1. Acesse: https://render.com
2. Faça login com GitHub
3. Clique "New +" → "Web Service"
4. Conecte: `kauankelvin7/sistema-clinica`
5. Configure:
   ```
   Name: sistema-clinica-api
   Region: Oregon (US West) - mais próximo
   Branch: main
   Root Directory: (deixe vazio)
   Runtime: Python 3
   Build Command: ./build.sh
   Start Command: uvicorn backend.main:app --host 0.0.0.0 --port $PORT
   ```
6. Escolha plano: **Free** ✅
7. Clique "Create Web Service"

#### **2️⃣ Criar PostgreSQL no Render (5 min)**

1. No dashboard do Render, clique "New +" → "PostgreSQL"
2. Configure:
   ```
   Name: sistema-clinica-db
   Database: homologacao
   User: admin
   Region: Oregon (mesma do backend)
   ```
3. Escolha plano: **Free** ✅
4. Clique "Create Database"
5. **Copie o "Internal Database URL"**

#### **3️⃣ Conectar Backend ao Banco**

1. Volte no Web Service criado
2. Vá em "Environment"
3. Adicione variável:
   ```
   DATABASE_URL = cole_internal_database_url_aqui
   ```
4. Adicione (temporário):
   ```
   FRONTEND_URL = http://localhost:3001
   ```
5. Clique "Save Changes"
6. **COPIE a URL do backend** (ex: `https://sistema-clinica-api.onrender.com`)

#### **4️⃣ Deploy do Frontend no Vercel (5 min)**

1. Acesse: https://vercel.com
2. Login com GitHub
3. "New Project" → `sistema-clinica`
4. Configure:
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   ```
5. **Environment Variable:**
   ```
   VITE_API_URL = https://sistema-clinica-api.onrender.com
   ```
6. Deploy!
7. **COPIE a URL** (ex: `https://sistema-clinica.vercel.app`)

#### **5️⃣ Atualizar CORS**

1. Volte no Render (backend)
2. Vá em "Environment"
3. Edite `FRONTEND_URL`:
   ```
   FRONTEND_URL = https://sistema-clinica.vercel.app
   ```
4. Save (backend reiniciará automaticamente)

---

## 🎯 OPÇÃO 2: Vercel para TUDO (Backend + Frontend)

### ✅ Vantagens:
- Mais simples (tudo em um lugar)
- Sem hibernação (sempre ativo)
- 100% grátis

### ❌ Desvantagens:
- Limite de 10 segundos por requisição (pode ser problema para documentos grandes)
- Precisa de banco externo (Supabase/Neon)

---

### **PASSO A PASSO - VERCEL:**

#### **1️⃣ Criar Banco PostgreSQL no Neon (5 min)**

1. Acesse: https://neon.tech
2. Faça login com GitHub
3. "Create Project"
4. Configure:
   ```
   Name: sistema-clinica
   Region: US East (Ohio)
   Postgres Version: 16
   ```
5. **COPIE a Connection String**

#### **2️⃣ Deploy Tudo no Vercel (5 min)**

1. Acesse: https://vercel.com
2. "New Project" → `sistema-clinica`
3. Configure:
   ```
   Framework: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   ```
4. **Environment Variables:**
   ```
   VITE_API_URL = /api
   DATABASE_URL = cole_connection_string_neon_aqui
   ```
5. Deploy!

---

## 💰 Comparação de Custos

| Serviço | Opção 1 (Render) | Opção 2 (Vercel) |
|---------|------------------|------------------|
| **Backend** | Render (GRÁTIS) | Vercel (GRÁTIS) |
| **Frontend** | Vercel (GRÁTIS) | Vercel (GRÁTIS) |
| **Banco** | Render PostgreSQL (GRÁTIS) | Neon PostgreSQL (GRÁTIS) |
| **Hibernação** | ❌ Sim (15 min) | ✅ Não |
| **Limite Requisição** | ✅ Sem limite | ❌ 10 segundos |
| **Total** | **R$ 0,00** | **R$ 0,00** |

---

## 🏆 RECOMENDAÇÃO

**Use Opção 1 (Render + Vercel)** se:
- ✅ Você quer configuração separada (melhor organização)
- ✅ Aceita esperar ~30s no primeiro acesso
- ✅ Quer ambiente de produção "de verdade"

**Use Opção 2 (Vercel tudo)** se:
- ✅ Você quer mais simplicidade
- ✅ Precisa de resposta sempre rápida
- ✅ Documentos não demoram > 10s para gerar

---

## ❓ Qual você prefere?

**Posso configurar qualquer uma das duas opções agora!** 🚀
