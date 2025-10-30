# 🚀 Guia de Deploy - Sistema de Atestados

## 📊 Arquitetura Atual vs Produção

### ❌ Problema Atual
- **Backend Local:** FastAPI rodando apenas no seu PC (localhost:8000)
- **Banco SQLite:** Arquivo local `data/clinica.db` - cada PC tem seu próprio banco
- **Frontend:** React rodando localmente (localhost:3001)

### ✅ Solução para Produção

```
┌─────────────────────────────────────────────────┐
│  Frontend (Vercel)                              │
│  https://sistema-clinica.vercel.app             │
│  React + TypeScript + Tailwind                  │
└─────────────────┬───────────────────────────────┘
                  │ HTTP Requests
                  ▼
┌─────────────────────────────────────────────────┐
│  Backend (Railway/Render)                       │
│  https://api-clinica.railway.app                │
│  FastAPI + Python                               │
└─────────────────┬───────────────────────────────┘
                  │ SQL Queries
                  ▼
┌─────────────────────────────────────────────────┐
│  Banco de Dados (PostgreSQL/MySQL)              │
│  Neon/Supabase/PlanetScale                      │
│  Compartilhado entre TODOS os PCs! ✅           │
└─────────────────────────────────────────────────┘
```

## 🎯 Opções de Deploy

### Opção 1: **GRÁTIS** (Recomendado para começar)
- **Frontend:** Vercel (ilimitado)
- **Backend:** Render Free (750h/mês = 24/7)
- **Banco:** Neon PostgreSQL (512MB grátis)

### Opção 2: **GRÁTIS com mais recursos**
- **Frontend:** Vercel
- **Backend:** Railway ($5 crédito/mês grátis)
- **Banco:** Supabase PostgreSQL (500MB grátis)

### Opção 3: **Pago mas barato** (~$10/mês)
- **Frontend:** Vercel (grátis)
- **Backend:** Railway ($5/mês)
- **Banco:** PlanetScale MySQL ($10/mês)

## 📝 Checklist de Deploy

### 1. Preparar Banco de Dados em Nuvem
- [ ] Criar conta no Neon (https://neon.tech)
- [ ] Criar novo projeto PostgreSQL
- [ ] Copiar connection string
- [ ] Migrar dados do SQLite para PostgreSQL

### 2. Preparar Backend
- [ ] Instalar `psycopg2` (PostgreSQL driver)
- [ ] Configurar variáveis de ambiente
- [ ] Adicionar `Procfile` para Render
- [ ] Testar localmente com PostgreSQL

### 3. Deploy do Backend
- [ ] Criar repositório no GitHub
- [ ] Conectar Render/Railway ao GitHub
- [ ] Configurar environment variables
- [ ] Fazer deploy automático

### 4. Deploy do Frontend
- [ ] Atualizar `API_BASE_URL` em `frontend/src/services/api.ts`
- [ ] Build de produção: `npm run build`
- [ ] Conectar Vercel ao GitHub
- [ ] Deploy automático

### 5. Testes Finais
- [ ] Testar geração de documentos
- [ ] Testar de múltiplos dispositivos
- [ ] Verificar compartilhamento de dados

## 🔧 Alterações Necessárias

### Backend precisa:
1. Suporte a PostgreSQL (além do SQLite)
2. Variáveis de ambiente para credenciais
3. CORS atualizado com URL de produção
4. Armazenamento de arquivos em cloud (AWS S3/Cloudflare R2)

### Frontend precisa:
1. URL da API em variável de ambiente
2. Build otimizado para produção
3. Tratamento de erros de rede

## 💡 Próximos Passos

Quer que eu:
1. **Configure tudo automático** (recomendado) - Faço todas as alterações necessárias
2. **Apenas migre o banco** - Converto SQLite → PostgreSQL
3. **Deploy simples** - Apenas subo para Vercel sem banco compartilhado
