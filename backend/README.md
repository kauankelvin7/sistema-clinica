# 🚀 Backend FastAPI - Sistema de Homologação

API REST moderna para integração com frontend React.

## 📦 Instalação

```powershell
# Instalar dependências
pip install -r backend/requirements.txt
```

## ⚡ Executar

```powershell
# Rodar servidor
python backend/main.py

# Ou usar uvicorn diretamente
uvicorn backend.main:app --reload --port 8000
```

**API estará disponível em:** http://localhost:8000

## 📚 Documentação

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔗 Endpoints

### `GET /`
Status da API

### `POST /api/generate-document`
Gera documento de atestado médico

**Request Body:**
```json
{
  "paciente": {
    "nome": "João Silva",
    "tipo_documento": "CPF",
    "numero_documento": "123.456.789-00",
    "cargo": "Analista",
    "empresa": "Empresa XYZ"
  },
  "atestado": {
    "data_atestado": "2025-10-30",
    "dias_afastamento": 3,
    "cid": "A00",
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

**Response:** Arquivo .docx para download

### `GET /api/patients?search=nome`
Busca pacientes no banco de dados

### `GET /api/doctors?search=nome`
Busca médicos no banco de dados

### `GET /api/health`
Verifica status da API e banco de dados

## 🔒 CORS

Configurado para aceitar requisições de:
- http://localhost:3000
- http://localhost:3001
- http://localhost:5173

## 🛠️ Tecnologias

- **FastAPI** - Framework web moderno
- **Uvicorn** - ASGI server
- **Pydantic** - Validação de dados
- **SQLite** - Banco de dados (via módulos existentes)

---

**Desenvolvido por Kauan Kelvin**
