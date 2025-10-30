# 🚀 GUIA PASSO A PASSO - DEPLOY RENDER + VERCEL (GRÁTIS)

## ✅ CHECKLIST

- [ ] 1. Criar conta no Render (GitHub)
- [ ] 2. Criar Web Service no Render (Backend)
- [ ] 3. Criar PostgreSQL no Render (Banco)
- [ ] 4. Conectar Backend ao Banco
- [ ] 5. Criar conta no Vercel (GitHub)
- [ ] 6. Deploy Frontend no Vercel
- [ ] 7. Conectar Frontend ao Backend
- [ ] 8. Testar aplicação online

---

## 1️⃣ CRIAR CONTA NO RENDER

1. Acesse: https://render.com
2. Clique "Get Started" ou "Sign Up"
3. Escolha **"Sign up with GitHub"**
4. Autorize o Render

✅ **PRONTO? Vá para o passo 2!**

---

## 2️⃣ CRIAR WEB SERVICE (BACKEND)

1. No dashboard do Render, clique **"New +"** (canto superior direito)
2. Escolha **"Web Service"**
3. Clique **"Connect account"** para conectar GitHub (se pedir)
4. Encontre e selecione: **`kauankelvin7/sistema-clinica`**
5. Clique **"Connect"**

**Configure assim:**

```
Name: sistema-clinica-api
Region: Oregon (US West)
Branch: main
Root Directory: (deixe vazio)
Runtime: Python 3
Build Command: chmod +x build.sh && ./build.sh
Start Command: uvicorn backend.main:app --host 0.0.0.0 --port $PORT
Instance Type: Free
```

6. **NÃO CLIQUE EM "CREATE" AINDA!** 
7. Role para baixo até "Environment Variables"
8. Adicione temporariamente:
   ```
   FRONTEND_URL = http://localhost:3001
   ```
9. **AGORA SIM**, clique **"Create Web Service"**

⏳ **Aguarde ~2-3 minutos** enquanto o Render faz o deploy...

Você verá logs aparecendo. Quando aparecer:
```
✅ Build successful
✅ Your service is live 🎉
```

**COPIE A URL** que aparece no topo (ex: `https://sistema-clinica-api.onrender.com`)

✅ **Backend está no ar! Vá para o passo 3!**

---

## 3️⃣ CRIAR POSTGRESQL (BANCO DE DADOS)

1. No dashboard do Render, clique **"New +"** novamente
2. Escolha **"PostgreSQL"**

**Configure assim:**

```
Name: sistema-clinica-db
Database: homologacao
User: admin
Region: Oregon (US West) - MESMA do backend!
PostgreSQL Version: 16
Instance Type: Free
```

3. Clique **"Create Database"**

⏳ **Aguarde ~1 minuto**...

Quando estiver pronto:
4. Vá na aba **"Info"**
5. **COPIE o "Internal Database URL"** (começa com `postgresql://`)

Exemplo:
```
postgresql://admin:SENHA@dpg-xxxxx/homologacao
```

✅ **Banco criado! Vá para o passo 4!**

---

## 4️⃣ CONECTAR BACKEND AO BANCO

1. Volte para o **Web Service** (sistema-clinica-api)
2. Clique na aba **"Environment"** (menu esquerdo)
3. Clique **"Add Environment Variable"**
4. Adicione:
   ```
   Key: DATABASE_URL
   Value: cole_aqui_o_internal_database_url
   ```
5. Clique **"Save Changes"**

O backend vai reiniciar automaticamente (~30 segundos).

Quando aparecer "Your service is live 🎉" novamente:

✅ **Backend conectado ao banco! Vá para o passo 5!**

---

## 5️⃣ CRIAR CONTA NO VERCEL

1. Acesse: https://vercel.com
2. Clique **"Sign Up"**
3. Escolha **"Continue with GitHub"**
4. Autorize o Vercel

✅ **Pronto? Vá para o passo 6!**

---

## 6️⃣ DEPLOY FRONTEND NO VERCEL

1. No dashboard do Vercel, clique **"Add New..."** → **"Project"**
2. Encontre e selecione: **`sistema-clinica`**
3. Clique **"Import"**

**Configure assim:**

```
Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

4. Clique em **"Environment Variables"** para expandir
5. Adicione:
   ```
   Key: VITE_API_URL
   Value: https://sistema-clinica-api.onrender.com
   ```
   ⚠️ **IMPORTANTE:** Cole a URL do Render (passo 2)!

6. Clique **"Deploy"**

⏳ **Aguarde ~2-3 minutos**...

Quando aparecer "🎉 Congratulations!" com confetes:

7. **COPIE A URL** que aparece (ex: `https://sistema-clinica.vercel.app`)
8. Clique em **"Continue to Dashboard"**

✅ **Frontend está online! Vá para o passo 7!**

---

## 7️⃣ CONECTAR FRONTEND AO BACKEND (CORS)

1. Volte no **Render** (https://dashboard.render.com)
2. Abra o **Web Service** (sistema-clinica-api)
3. Vá na aba **"Environment"**
4. Edite a variável **FRONTEND_URL**:
   ```
   FRONTEND_URL = https://sistema-clinica.vercel.app
   ```
   ⚠️ **IMPORTANTE:** Cole a URL do Vercel (passo 6)!

5. Clique **"Save Changes"**

O backend vai reiniciar (~30 segundos).

✅ **CORS configurado! Vá para o passo 8!**

---

## 8️⃣ TESTAR APLICAÇÃO

1. Abra a URL do Vercel: `https://sistema-clinica.vercel.app`
2. Preencha o formulário com dados de teste
3. Clique em **"Gerar Declaração"**

⏳ **Primeira requisição pode demorar ~30s** (Render está "acordando")

Se tudo der certo:
- ✅ Documento será gerado
- ✅ Download iniciará automaticamente
- ✅ Mensagem de sucesso aparecerá

---

## 🎊 PRONTO! SEU SISTEMA ESTÁ ONLINE!

**URLs:**
- Frontend: `https://sistema-clinica.vercel.app`
- Backend: `https://sistema-clinica-api.onrender.com`
- Docs API: `https://sistema-clinica-api.onrender.com/docs`

**Compartilhe:**
- Qualquer pessoa pode acessar a URL do Vercel
- Todos compartilham o MESMO banco de dados PostgreSQL
- Funciona em PC, celular, tablet, etc.

**Atualizações:**
```bash
git add .
git commit -m "Nova feature"
git push
```
→ Deploy automático em ~2 minutos! 🚀

---

## 🆘 PROBLEMAS COMUNS

**"Error connecting to database":**
- Verifique se `DATABASE_URL` está correta no Render
- Certifique-se que usou "Internal Database URL", não "External"

**"CORS error":**
- Verifique se `FRONTEND_URL` aponta para URL correta do Vercel
- Certifique-se de usar HTTPS (não HTTP)

**"Build failed":**
- Verifique logs no Render/Vercel
- Certifique-se que `build.sh` tem permissão de execução

**"Backend não responde":**
- Primeira requisição demora ~30s (servidor acordando)
- Após 15 min sem uso, hiberna novamente

---

## 💡 DICAS

**Monitorar logs:**
- Render: Dashboard → Web Service → "Logs"
- Vercel: Dashboard → Project → "Deployments" → "View Function Logs"

**Forçar redeploy:**
- Render: "Manual Deploy" → "Deploy latest commit"
- Vercel: Deployments → três pontinhos → "Redeploy"

**Ver banco de dados:**
- Render: PostgreSQL → "Connect" → Copiar `psql` command
- Use TablePlus, pgAdmin ou DBeaver

---

## ✅ TUDO CERTO?

Se funcionou, comemore! 🎉

Se deu erro, me mande:
1. Screenshot do erro
2. Logs do Render/Vercel
3. URL que você está tentando acessar
