# 📄 Conversão DOCX para PDF

## Visão Geral

O sistema agora suporta **conversão automática de DOCX para PDF** mantendo a formatação original do documento Word.

## Métodos de Conversão

### 1. **docx2pdf (Windows - Recomendado)**
- ✅ **Preservação perfeita** da formatação
- ✅ Usa Microsoft Word COM automation
- ⚠️ Requer Windows + Microsoft Word instalado
- ⚠️ Não funciona em Linux/Mac/Servidores

**Instalação:**
```bash
pip install docx2pdf
```

### 2. **LibreOffice (Multiplataforma)**
- ✅ Funciona em Windows, Linux e Mac
- ✅ Boa preservação de formatação
- ✅ Ideal para produção/servidores
- ⚠️ Requer LibreOffice instalado

**Instalação:**

**Windows:**
```bash
# Baixar e instalar do site oficial
https://www.libreoffice.org/download/download/
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install -y libreoffice libreoffice-writer
```

**Linux (CentOS/RHEL):**
```bash
sudo yum install -y libreoffice libreoffice-writer
```

**macOS:**
```bash
brew install --cask libreoffice
```

**Docker (para deploy em containers):**
```dockerfile
FROM python:3.11-slim

# Instalar LibreOffice
RUN apt-get update && \
    apt-get install -y libreoffice libreoffice-writer && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# ... resto do Dockerfile
```

## Como Funciona

1. **Backend gera documento DOCX** usando o template formatado
2. **Sistema tenta converter para PDF** na seguinte ordem:
   - Primeiro: `docx2pdf` (se disponível - Windows)
   - Segundo: `LibreOffice` (multiplataforma)
3. **Retorna PDF** para download

## Fluxo de Geração

```
Dados do Formulário
    ↓
Gerar DOCX (document_generator.py)
    ↓
Converter DOCX → PDF (pdf_generator.py)
    ├─→ Tentar docx2pdf (Windows COM)
    └─→ Tentar LibreOffice (multiplataforma)
    ↓
PDF Final (download automático)
```

## Verificar Instalação

**Verificar docx2pdf:**
```bash
python -c "import docx2pdf; print('docx2pdf OK')"
```

**Verificar LibreOffice:**
```bash
# Windows
"C:\Program Files\LibreOffice\program\soffice.exe" --version

# Linux/Mac
libreoffice --version
```

## Troubleshooting

### Erro: "docx2pdf não está instalado"
```bash
pip install docx2pdf
```

### Erro: "LibreOffice não encontrado"
- Instale o LibreOffice seguindo as instruções acima
- Adicione ao PATH do sistema (Windows)

### Erro: "Não foi possível converter para PDF"
1. Verifique se pelo menos um dos métodos está instalado
2. Teste manualmente a conversão:
   ```bash
   # docx2pdf
   python -c "from docx2pdf import convert; convert('teste.docx')"
   
   # LibreOffice
   libreoffice --headless --convert-to pdf teste.docx
   ```

## Desenvolvimento vs Produção

**Desenvolvimento (Windows):**
- Use `docx2pdf` para melhor qualidade

**Produção (Linux/Containers):**
- Use LibreOffice
- Adicione no Dockerfile/Aptfile

## Exemplo de Deploy (Render.com)

**Aptfile:**
```
libreoffice
libreoffice-writer
```

**render.yaml:**
```yaml
services:
  - type: web
    name: sistema-clinica-backend
    env: python
    buildCommand: |
      apt-get update
      apt-get install -y libreoffice libreoffice-writer
      pip install -r requirements.txt
    startCommand: uvicorn backend.main:app --host 0.0.0.0 --port $PORT
```

---

**Desenvolvido por Kauan Kelvin**
