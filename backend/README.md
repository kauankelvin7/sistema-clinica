# 🏥 Sistema Clínica - Backend API

FastAPI backend para geração de atestados médicos.

## 🚀 Deploy Fly.io

Este backend está configurado para deploy no Fly.io.

### Pré-requisitos
- Conta Fly.io (grátis)
- Fly CLI instalado
- Backup dos dados do Render (se migrando)

### Deploy Rápido
```bash
cd backend
fly launch --no-deploy  # Primeira vez
fly deploy              # Deploy
```

### Comandos Úteis
```bash
fly logs                # Ver logs
fly status              # Status do app
fly ssh console         # SSH no container
fly postgres connect    # Conectar ao PostgreSQL
```

## 📦 Estrutura

```
backend/
├── main.py              # FastAPI app
├── requirements.txt     # Dependências Python
├── Procfile            # Comando de start
├── fly.toml            # Configuração Fly.io
├── runtime.txt         # Versão Python
└── core/               # Módulos principais
    ├── db_manager.py
    ├── document_generator.py
    └── pdf_generator.py
```

## 🌍 Endpoints

- `GET /` - Status da API
- `GET /api/health` - Health check
- `GET /api/patients` - Listar pacientes
- `GET /api/doctors` - Listar médicos
- `POST /api/generate-document` - Gerar atestado (Word)
- `POST /api/generate-pdf` - Gerar atestado (PDF)

## 🗄️ Banco de Dados

PostgreSQL (Fly.io ou Render)
- `pacientes` - Dados dos pacientes
- `medicos` - Dados dos médicos
- `atestados` - Histórico de atestados

## 🔐 Variáveis de Ambiente

```bash
DATABASE_URL         # PostgreSQL connection string (auto no Fly.io)
FRONTEND_URL         # URL do frontend (Vercel)
RENDER=true          # Flag para usar PostgreSQL
```
