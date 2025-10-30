# 🏥 Sistema de Homologação de Atestados Médicos v2.0

Sistema completo para geração de declarações e atestados médicos com interface moderna e responsiva.

![Versão](https://img.shields.io/badge/versão-2.0-blue)
![Python](https://img.shields.io/badge/Python-3.11+-green)
![React](https://img.shields.io/badge/React-18+-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue)

---

## ✨ Novidades da Versão 2.0

### 🎨 Design Completamente Renovado
- ✅ Nova paleta de cores azul moderna
- ✅ Interface clara e profissional
- ✅ Animações suaves e responsivas
- ✅ Totalmente mobile-friendly

### 📄 Geração de PDF Otimizada
- ✅ Conversão DOCX → PDF preservando formatação
- ✅ Suporte Windows (docx2pdf) e Linux (LibreOffice)
- ✅ Download automático
- ✅ Formatação idêntica ao Word

### 🚀 Melhorias de UX
- ✅ Interface mais intuitiva
- ✅ Feedback visual aprimorado
- ✅ Modal de validação redesenhado
- ✅ Campos com labels descritivos

---

## 📋 Funcionalidades

- 📝 Geração de atestados médicos em **Word (.docx)**
- 📄 Geração de atestados médicos em **PDF**
- 💾 Salvamento automático dos dados no navegador
- 🔍 Busca de pacientes e médicos cadastrados
- ✅ Validação completa de campos obrigatórios
- 📱 Interface responsiva (Mobile, Tablet, Desktop)
- 🗄️ Banco de dados SQLite/PostgreSQL
- 🔗 API REST com FastAPI

---

## 🛠️ Tecnologias

### Backend
- **Python 3.11+**
- **FastAPI** - Framework web moderno
- **SQLAlchemy** - ORM para banco de dados
- **python-docx** - Manipulação de documentos Word
- **docx2pdf** - Conversão para PDF (Windows)
- **LibreOffice** - Conversão para PDF (Linux/Mac)
- **PostgreSQL/SQLite** - Banco de dados

### Frontend
- **React 18** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool
- **Tailwind CSS** - Framework CSS
- **Lucide React** - Ícones modernos
- **Axios** - Cliente HTTP

---

## 📦 Instalação

### 1️⃣ Pré-requisitos

#### Backend
```bash
# Python 3.11 ou superior
python --version

# Criar ambiente virtual
python -m venv venv

# Ativar ambiente virtual
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# Instalar dependências
pip install -r backend/requirements.txt
```

#### Conversão para PDF

**Windows (Recomendado):**
```bash
pip install docx2pdf
```
*Requer Microsoft Word instalado*

**Linux:**
```bash
sudo apt-get update
sudo apt-get install -y libreoffice libreoffice-writer
```

**macOS:**
```bash
brew install --cask libreoffice
```

**Verificar instalação:**
```bash
python verificar_pdf_dependencies.py
```

### 2️⃣ Frontend

```bash
cd frontend
npm install
```

---

## 🚀 Como Executar

### Desenvolvimento Local

#### Backend (Terminal 1)
```bash
# Ativar ambiente virtual
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Executar servidor
python -m uvicorn backend.main:app --reload --port 8000
```

API disponível em: `http://localhost:8000`
Documentação: `http://localhost:8000/docs`

#### Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```

Interface disponível em: `http://localhost:5173`

---

## 📖 Como Usar

### 1. Preencher Dados do Paciente
- Nome completo
- Tipo de documento (CPF/RG)
- Número do documento
- Cargo
- Empresa

### 2. Preencher Dados do Atestado
- Data do atestado
- Dias de afastamento
- Código CID (ou marcar "Não Informado")

### 3. Preencher Dados do Médico
- Nome completo
- Tipo de registro (CRM/CRO/RMs)
- Número do registro
- UF do registro

### 4. Gerar Documento
- **Gerar Word:** Cria arquivo `.docx`
- **Gerar PDF:** Cria `.docx` e converte para `.pdf`

---

## 📁 Estrutura do Projeto

```
sistema_clinica_homologacao/
├── backend/
│   ├── main.py                 # API FastAPI
│   └── requirements.txt        # Dependências Python
├── core/
│   ├── document_generator.py   # Geração de DOCX
│   ├── pdf_generator.py        # Conversão para PDF
│   ├── database.py             # Conexão com banco
│   └── validators.py           # Validações
├── frontend/
│   ├── src/
│   │   ├── App.tsx             # Componente principal
│   │   ├── components/         # Componentes React
│   │   ├── services/           # APIs
│   │   └── index.css           # Estilos globais
│   └── package.json
├── models/
│   └── modelo homologação.docx # Template Word
├── data/
│   └── generated_documents/    # Documentos gerados
├── CONVERSAO_PDF.md            # Guia de conversão PDF
├── MELHORIAS_IMPLEMENTADAS.md  # Changelog detalhado
└── README.md                   # Este arquivo
```

---

## 🎨 Screenshots

### Desktop
![Desktop](https://via.placeholder.com/800x500/3B82F6/FFFFFF?text=Interface+Desktop)

### Mobile
![Mobile](https://via.placeholder.com/375x667/3B82F6/FFFFFF?text=Interface+Mobile)

---

## 🔧 Configuração

### Variáveis de Ambiente

Criar arquivo `.env` na raiz:

```env
# Backend
VITE_API_URL=http://localhost:8000

# Banco de dados (opcional - PostgreSQL)
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Render/Railway (produção)
RENDER=false
RAILWAY_ENVIRONMENT=false
```

---

## 📊 API Endpoints

### Documentos
- `POST /api/generate-document` - Gera documento Word
- `POST /api/generate-pdf` - Gera documento PDF

### Pacientes
- `GET /api/patients?search={termo}` - Busca pacientes

### Médicos
- `GET /api/doctors?search={termo}` - Busca médicos

### Health Check
- `GET /api/health` - Status da API

**Documentação completa:** `http://localhost:8000/docs`

---

## 🧪 Testes

### Verificar Dependências PDF
```bash
python verificar_pdf_dependencies.py
```

### Testar Backend
```bash
# Health check
curl http://localhost:8000/api/health
```

### Testar Frontend
```bash
cd frontend
npm run build
npm run preview
```

---

## 🚀 Deploy

### Backend (Render.com)

1. Criar `Aptfile`:
```
libreoffice
libreoffice-writer
```

2. Build command:
```bash
pip install -r backend/requirements.txt
```

3. Start command:
```bash
uvicorn backend.main:app --host 0.0.0.0 --port $PORT
```

### Frontend (Vercel)

```bash
cd frontend
vercel --prod
```

---

## 📝 Notas Importantes

### Conversão PDF

#### Windows (Desenvolvimento)
- ✅ Use `docx2pdf` (melhor qualidade)
- ✅ Requer MS Word instalado
- ✅ Preservação perfeita da formatação

#### Linux/Produção
- ✅ Use LibreOffice
- ✅ Adicione ao Dockerfile/Aptfile
- ✅ Boa preservação de formatação

### Banco de Dados
- **Desenvolvimento:** SQLite (automático)
- **Produção:** PostgreSQL (recomendado)

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE.md](LICENSE.md) para mais detalhes.

---

## 👨‍💻 Autor

**Kauan Kelvin**

- GitHub: [@kauankelvin7](https://github.com/kauankelvin7)
- Email: seu-email@exemplo.com

---

## 📚 Documentação Adicional

- [Guia de Conversão PDF](CONVERSAO_PDF.md)
- [Melhorias Implementadas](MELHORIAS_IMPLEMENTADAS.md)
- [API Docs](http://localhost:8000/docs)

---

## 🆘 Suporte

Encontrou um bug ou tem uma sugestão?

1. Verifique as [Issues existentes](https://github.com/kauankelvin7/sistema-clinica/issues)
2. Crie uma nova Issue com detalhes
3. Ou entre em contato diretamente

---

## 🎯 Roadmap

- [ ] Assinatura digital
- [ ] Múltiplos templates
- [ ] Dark mode
- [ ] Exportação para Excel
- [ ] Histórico de documentos
- [ ] Autenticação de usuários
- [ ] Múltiplos idiomas (i18n)
- [ ] PWA (Progressive Web App)

---

## ⭐ Agradecimentos

Obrigado por usar o Sistema de Homologação!

Se este projeto foi útil, considere dar uma ⭐

---

**Versão:** 2.0  
**Data:** 30/10/2025  
**Status:** ✅ Produção
