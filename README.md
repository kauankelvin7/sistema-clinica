# 🏥 Sistema de Homologação de Atestados Médicos

[![Status](https://img.shields.io/badge/status-ativo-success.svg)](https://loose-catriona-clinica-medica-seven-71f0d13c.koyeb.app)
[![Versão](https://img.shields.io/badge/vers%C3%A3o-2.0.0-blue.svg)](https://github.com/kauankelvin7/sistema-clinica)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

Sistema completo para geração automatizada de atestados médicos, desenvolvido com tecnologias modernas e arquitetura escalável.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias](#tecnologias)
- [Arquitetura](#arquitetura)
- [Funcionalidades](#funcionalidades)
- [Instalação](#instalação)
- [Deploy](#deploy)
- [API](#api)
- [Autor](#autor)

## 🎯 Sobre o Projeto

O **Sistema de Homologação de Atestados Médicos** é uma solução web completa que automatiza o processo de geração de atestados médicos. O sistema permite:

- ✅ Cadastro e busca de pacientes
- ✅ Cadastro e busca de médicos
- ✅ Geração de atestados em Word (.docx)
- ✅ Geração de atestados em PDF
- ✅ Armazenamento em banco de dados
- ✅ Interface web moderna e responsiva

## 🚀 Tecnologias

### Backend
- **[FastAPI](https://fastapi.tiangolo.com/)** - Framework web moderno e de alta performance
- **[PostgreSQL](https://www.postgresql.org/)** - Banco de dados relacional
- **[SQLAlchemy](https://www.sqlalchemy.org/)** - ORM para Python
- **[Python-docx](https://python-docx.readthedocs.io/)** - Geração de documentos Word
- **[ReportLab](https://www.reportlab.com/)** - Geração de documentos PDF
- **[Pydantic](https://pydantic-docs.helpmanual.io/)** - Validação de dados

### Frontend
- **[React](https://reactjs.org/)** - Biblioteca JavaScript para interfaces
- **[TypeScript](https://www.typescriptlang.org/)** - Superset tipado de JavaScript
- **[Vite](https://vitejs.dev/)** - Build tool moderna
- **[Tailwind CSS](https://tailwindcss.com/)** - Framework CSS utilitário
- **[Axios](https://axios-http.com/)** - Cliente HTTP

### Infraestrutura
- **[Koyeb](https://www.koyeb.com/)** - Hospedagem do backend
- **[Supabase](https://supabase.com/)** - Banco de dados PostgreSQL
- **[Vercel](https://vercel.com/)** - Hospedagem do frontend

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────┐
│         USUÁRIO (Browser)               │
│  https://sistema-clinica-seven.vercel...│
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│    FRONTEND (Vercel)                    │
│    - React + TypeScript                 │
│    - Tailwind CSS                       │
│    - Vite                               │
└────────────────┬────────────────────────┘
                 │ REST API
                 ▼
┌─────────────────────────────────────────┐
│    BACKEND (Koyeb)                      │
│    - FastAPI                            │
│    - Python 3.11                        │
│    - Geração Word/PDF                   │
└────────────────┬────────────────────────┘
                 │ SQL
                 ▼
┌─────────────────────────────────────────┐
│    DATABASE (Supabase)                  │
│    - PostgreSQL 15                      │
│    - 64 Pacientes + 61 Médicos          │
└─────────────────────────────────────────┘
```

## ✨ Funcionalidades

### Gestão de Pacientes
- Busca por nome ou documento
- Autocomplete inteligente
- Histórico de atendimentos
- Atualização automática de dados

### Gestão de Médicos
- Busca por nome ou CRM/CRO
- Suporte a múltiplos tipos de registro
- Validação de UF

### Geração de Documentos
- Templates profissionais
- Múltiplos formatos (Word e PDF)
- CID opcional
- Download imediato

## 📦 Instalação

### Pré-requisitos
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+ (ou conta Supabase)

### Backend

```bash
# Clonar repositório
git clone https://github.com/kauankelvin7/sistema-clinica.git
cd sistema-clinica/backend

# Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# Iniciar servidor
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Configurar variáveis
cp .env.example .env
# Edite .env com a URL da API

# Iniciar desenvolvimento
npm run dev
```

## 🌐 Deploy

### Backend (Koyeb)
1. Criar conta em [Koyeb](https://www.koyeb.com)
2. Conectar com GitHub
3. Selecionar repositório `sistema-clinica`
4. Configurar:
   - **Root directory**: `backend`
   - **Build command**: Automático
   - **Run command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Adicionar variáveis de ambiente:
   - `DATABASE_URL`: URL do PostgreSQL
   - `RENDER`: `true`
6. Deploy!

### Frontend (Vercel)
1. Importar projeto do GitHub
2. Configurar:
   - **Framework**: Vite
   - **Root directory**: `frontend`
3. Adicionar variável:
   - `VITE_API_URL`: URL da API no Koyeb
4. Deploy!

## 📡 API

### Endpoints Principais

#### Status
```http
GET /
GET /api/health
```

#### Pacientes
```http
GET /api/patients?search={termo}
```

#### Médicos
```http
GET /api/doctors?search={termo}
```

#### Geração de Documentos
```http
POST /api/generate-document
POST /api/generate-pdf

Content-Type: application/json

{
  "paciente": {
    "nome": "João Silva",
    "tipo_documento": "CPF",
    "numero_documento": "123.456.789-00",
    "cargo": "Analista",
    "empresa": "Empresa XYZ"
  },
  "atestado": {
    "data_atestado": "09/11/2025",
    "dias_afastamento": 3,
    "cid": "J00",
    "cid_nao_informado": false
  },
  "medico": {
    "nome": "Dr. Maria Santos",
    "tipo_registro": "CRM",
    "numero_registro": "12345",
    "uf_registro": "DF"
  }
}
```

### Documentação Interativa
- **Swagger UI**: https://loose-catriona-clinica-medica-seven-71f0d13c.koyeb.app/docs
- **ReDoc**: https://loose-catriona-clinica-medica-seven-71f0d13c.koyeb.app/redoc

## 📊 Estatísticas

- **64 Pacientes** cadastrados
- **61 Médicos** registrados
- **100% Uptime** (Koyeb)
- **Tempo de resposta**: < 500ms
- **Custo mensal**: R$ 0,00 (100% gratuito)

## 👨‍💻 Autor

**Kauan Kelvin Santos Barbosa**

- GitHub: [@kauankelvin7](https://github.com/kauankelvin7)
- LinkedIn: [Kauan Kelvin](https://linkedin.com/in/kauankelvin)

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🙏 Agradecimentos

- FastAPI pela excelente documentação
- Comunidade React pelo suporte
- Koyeb, Supabase e Vercel pela infraestrutura gratuita

---

<div align="center">
  <p>Desenvolvido com ❤️ por Kauan Kelvin</p>
  <p>© 2025 - Sistema de Homologação de Atestados Médicos</p>
</div>
