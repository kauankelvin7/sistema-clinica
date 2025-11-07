# 🚀 GUIA COMPLETO: Migração Render → Fly.io (SEM PERDER DADOS)

## ✅ O QUE VOCÊ VAI CONSEGUIR:
- ⚡ Cold start: **30 segundos → 2-5 segundos**
- 💾 Storage: **1GB → 3GB**
- 🔄 Uptime: **750h/mês → Ilimitado**
- 📊 **TODOS os dados migrados** (0% de perda)

---

## 📋 ETAPA 1: Backup dos Dados do Render

### 1.1. Fazer Backup do PostgreSQL do Render

```bash
# No PowerShell, vá para a pasta do projeto
cd C:\Users\Kauan\Desktop\sistema_clinica_homologacao

# Criar pasta para backups
mkdir backups
cd backups

# Fazer dump do banco Render (substitua com sua DATABASE_URL do Render)
# Pegue a URL em: Render Dashboard → Database → Connection String
```

**Opção A: Via pg_dump (recomendado)**
```bash
# Instale PostgreSQL tools se não tiver:
# https://www.enterprisedb.com/downloads/postgres-postgresql-downloads

# Fazer backup (substitua a URL)
pg_dump "postgresql://usuario:senha@hostname.oregon-postgres.render.com/database" > backup_render.sql
```

**Opção B: Via Interface Web do Render**
1. Acesse Render Dashboard → Seu Database
2. Menu "Backups"
3. "Create Backup Now"
4. Download do arquivo `.sql` quando terminar

---

## 📋 ETAPA 2: Instalar e Configurar Fly.io

### 2.1. Instalar Fly CLI

**Windows (PowerShell como Administrador):**
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

**Feche e reabra o PowerShell** para atualizar o PATH.

### 2.2. Fazer Login no Fly.io
```bash
fly auth login
```
- Abre navegador
- Faça login/cadastro (pode usar GitHub)
- **Precisa adicionar cartão** (mas NÃO cobra no free tier!)

---

## 📋 ETAPA 3: Criar App e Banco no Fly.io

### 3.1. Navegar para Backend
```bash
cd C:\Users\Kauan\Desktop\sistema_clinica_homologacao\backend
```

### 3.2. Criar App no Fly.io
```bash
fly launch --no-deploy
```

**Responda as perguntas:**
```
? Choose an app name: sistema-clinica-api
? Choose a region: gru (São Paulo)
? Would you like to set up a Postgresql database? Yes
? Select configuration: Development (1GB RAM, 10GB storage) ← GRÁTIS
? Would you like to set up an Upstash Redis database? No
```

✅ Isso cria:
- App no Fly.io
- PostgreSQL 10GB grátis
- Arquivo `fly.toml` (já criado acima)

### 3.3. Pegar URL do Novo Banco
```bash
fly postgres connect -a sistema-clinica-api-db
```

Ou ver todas as infos:
```bash
fly postgres db list -a sistema-clinica-api-db
```

Salve a `DATABASE_URL` que aparece!

---

## 📋 ETAPA 4: Migrar os Dados (CRÍTICO!)

### 4.1. Restaurar Backup no Fly.io

**Opção A: Via psql (mais rápido)**
```bash
# Conectar ao banco Fly.io
fly proxy 5432 -a sistema-clinica-api-db

# Em OUTRO terminal PowerShell:
cd C:\Users\Kauan\Desktop\sistema_clinica_homologacao\backups

# Importar dados (substitua as credenciais do Fly.io)
psql "postgresql://postgres:senha@localhost:5432/sistema_clinica_api" < backup_render.sql
```

**Opção B: Via Interface Fly.io**
```bash
# Conectar ao console do PostgreSQL
fly postgres connect -a sistema-clinica-api-db

# Dentro do psql, executar:
\i /caminho/para/backup_render.sql
```

### 4.2. Verificar Dados Migrados
```bash
fly postgres connect -a sistema-clinica-api-db

# Dentro do psql:
SELECT COUNT(*) FROM pacientes;
SELECT COUNT(*) FROM medicos;
\q
```

✅ **Confirme que os números batem** com o Render!

---

## 📋 ETAPA 5: Configurar Variáveis de Ambiente

### 5.1. Adicionar Secrets no Fly.io
```bash
# Adicionar URL do frontend
fly secrets set FRONTEND_URL=https://sistema-clinica-seven.vercel.app

# Se usar Firebase, adicionar credenciais
fly secrets set FIREBASE_CREDENTIALS='{"type":"service_account","project_id":"..."}'

# DATABASE_URL já foi criado automaticamente pelo Fly.io!
```

### 5.2. Ver todas as secrets
```bash
fly secrets list
```

---

## 📋 ETAPA 6: Deploy no Fly.io! 🚀

### 6.1. Deploy
```bash
fly deploy
```

Aguarde 2-3 minutos. Fly.io vai:
- ✅ Criar container Docker
- ✅ Instalar dependências
- ✅ Executar health checks
- ✅ Ativar HTTPS automático

### 6.2. Ver Logs
```bash
fly logs
```

### 6.3. Ver Status
```bash
fly status
```

### 6.4. Pegar URL da API
```bash
fly info
```

Sua API estará em: **`https://sistema-clinica-api.fly.dev`**

---

## 📋 ETAPA 7: Atualizar Frontend (Vercel)

### 7.1. Atualizar Variável no Vercel
1. Acesse https://vercel.com/seu-usuario/sistema-clinica-seven
2. Settings → Environment Variables
3. Edite `VITE_API_URL`:
   - **Valor antigo**: `https://sistema-clinica-api.onrender.com`
   - **Valor novo**: `https://sistema-clinica-api.fly.dev`
4. Clique em "Save"

### 7.2. Redeploy Frontend
```bash
cd C:\Users\Kauan\Desktop\sistema_clinica_homologacao

git add .
git commit -m "chore: migrar backend para Fly.io"
git push origin main
```

Vercel faz redeploy automático! ✅

---

## 📋 ETAPA 8: Validação Final

### 8.1. Testar API Diretamente
```bash
# Health check
curl https://sistema-clinica-api.fly.dev/api/health

# Listar pacientes
curl https://sistema-clinica-api.fly.dev/api/patients

# Listar médicos
curl https://sistema-clinica-api.fly.dev/api/doctors
```

### 8.2. Testar Frontend
1. Acesse seu frontend: https://sistema-clinica-seven.vercel.app
2. Abra DevTools (F12) → Network
3. Tente gerar um atestado
4. Verifique se as requisições vão para `fly.dev`

### 8.3. Verificar Dados
- ✅ Pacientes cadastrados aparecem?
- ✅ Médicos cadastrados aparecem?
- ✅ Gera documento corretamente?

---

## 📋 ETAPA 9: Desligar Render (Opcional)

**⚠️ SÓ FAÇA DEPOIS DE CONFIRMAR QUE FLY.IO ESTÁ 100% FUNCIONANDO!**

1. Acesse Render Dashboard
2. Vá no seu Web Service
3. Settings → Delete Service
4. Vá no Database
5. Settings → Delete Database

---

## ⚙️ Configurações Avançadas Fly.io

### Sempre Manter 1 Instância Ativa (sem cold start)
```bash
# Editar fly.toml, mudar:
min_machines_running = 1  # Era 0

# Redeploy:
fly deploy
```

### Aumentar RAM (se precisar)
```bash
fly scale memory 512
```

### Ver Uso de Recursos
```bash
fly dashboard
```

### Escalar Horizontalmente (mais instâncias)
```bash
fly scale count 2
```

---

## 🐛 Resolução de Problemas

### Erro: "Could not connect to database"
```bash
# Verificar se DATABASE_URL está setado:
fly secrets list

# Se não estiver, pegar do banco:
fly postgres config show -a sistema-clinica-api-db

# Setar manualmente:
fly secrets set DATABASE_URL="postgresql://..."
```

### Erro: "App crashed"
```bash
# Ver logs detalhados:
fly logs --app sistema-clinica-api

# Conectar ao console do app:
fly ssh console
```

### Erro: "Health check failed"
```bash
# Verificar se endpoint /api/health existe:
curl https://sistema-clinica-api.fly.dev/api/health

# Ver configuração de health check:
cat fly.toml
```

---

## 📊 Comparação Antes vs Depois

| Métrica | Render (Antes) | Fly.io (Depois) |
|---------|----------------|-----------------|
| Cold Start | 🔴 20-30s | 🟢 2-5s |
| Uptime | 750h/mês | ♾️ Ilimitado |
| RAM | 512MB | 256MB (upgradable) |
| Storage | 1GB | 3GB |
| Database | PostgreSQL 1GB | PostgreSQL 10GB |
| Região | Oregon | São Paulo 🇧🇷 |
| HTTPS | ✅ | ✅ |
| Auto-deploy | ✅ | ✅ |

---

## 💰 Custos

**Fly.io Free Tier:**
- ✅ 3 apps grátis
- ✅ 256MB RAM por app
- ✅ 3GB storage persistente
- ✅ PostgreSQL 10GB
- ✅ **ZERO cobrança automática**

**Você só paga se:**
- Aumentar recursos além do free tier
- Rodar mais de 3 apps simultaneamente

---

## 📞 Suporte

Qualquer erro durante a migração, me chame! 🚀

---

## ✅ Checklist Completo

- [ ] Backup do Render feito
- [ ] Fly CLI instalado
- [ ] Login no Fly.io feito
- [ ] App criado no Fly.io
- [ ] PostgreSQL criado
- [ ] Dados migrados
- [ ] Secrets configurados
- [ ] Deploy feito com sucesso
- [ ] Frontend atualizado no Vercel
- [ ] Testes realizados
- [ ] Render desligado (opcional)

**PRONTO! Migração completa! 🎉**
