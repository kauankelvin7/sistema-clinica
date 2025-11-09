# ✅ FONTES E TAMANHOS ATUALIZADOS - DOCUMENTO HTML

## 📋 Análise do Documento Word Original

Após análise do template `models/modelo homologação.docx`, foram identificadas as seguintes fontes:

### 🔤 Fontes Encontradas no Word:
- **Calibri 11pt** - Texto padrão, labels, cabeçalho
- **Calibri 14pt** - Corpo do texto principal (declaração)
- **Calibri 18pt** - Títulos (DECLARAÇÃO, PRONTUÁRIO)

---

## ✨ Alterações Implementadas no HTML

### 1. **Fonte Principal do Body**
```css
/* ANTES */
font-family: 'Calibri', Arial, sans-serif;
font-size: 10pt;

/* DEPOIS */
font-family: 'Calibri', 'Carlito', 'Helvetica Neue', Arial, sans-serif;
font-size: 11pt;
```
✅ Agora usa **Calibri 11pt** como padrão (idêntico ao Word)

---

### 2. **Títulos (DECLARAÇÃO / PRONTUÁRIO)**
```css
/* ANTES */
.title-table td {
    font-size: 11pt;
}

/* DEPOIS */
.title-table td {
    font-size: 18pt;
}
```
✅ Títulos agora em **18pt** (igual ao Word)

---

### 3. **Texto Principal da Declaração**
```css
/* ANTES */
.main-text {
    font-size: 9pt;
}

/* DEPOIS */
.main-text {
    font-size: 14pt;
}
```
✅ Corpo do texto em **14pt** (igual ao Word)

---

### 4. **Tabelas de Decisão e Dados do Paciente**
```css
/* ANTES */
.decision-title, .decision-options {
    font-size: 9pt;
}
.patient-table td {
    font-size: 9pt;
}

/* DEPOIS */
.decision-title, .decision-options {
    font-size: 11pt;
}
.patient-table td {
    font-size: 11pt;
}
```
✅ Todas as tabelas agora em **11pt** (padrão Word)

---

### 5. **Cabeçalho e Rodapé**
```css
/* ANTES */
.header-title {
    font-size: 10pt;
}
.header-subtitle {
    font-size: 9pt;
}

/* DEPOIS */
.header-title {
    font-size: 11pt;
}
.header-subtitle {
    font-size: 11pt;
}
```
✅ Cabeçalho em **11pt** (padrão Word)

---

### 6. **Assinatura e Data**
```css
/* ANTES */
.signature-label, .date-line {
    font-size: 9pt;
}

/* DEPOIS */
.signature-label, .date-line {
    font-size: 11pt;
}
```
✅ Assinatura em **11pt** (padrão Word)

---

## 📅 Data Atual Automática

### ✨ Nova Funcionalidade Implementada

**ANTES:** Data manual com underlines
```html
<div class="date-line">Brasília, ___/___/____</div>
```

**DEPOIS:** Data gerada automaticamente
```python
# Em core/html_generator.py
from datetime import datetime
data_atual = datetime.now()
meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
         'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
data_extenso = f"Brasília, {data_atual.day} de {meses[data_atual.month - 1]} de {data_atual.year}"

# Resultado:
# "Brasília, 9 de novembro de 2025"
```

✅ A data é gerada automaticamente no formato extenso ao criar o documento

---

## 📊 Resumo das Mudanças

| Elemento | Antes | Depois | Status |
|----------|-------|--------|--------|
| Fonte padrão | Arial 10pt | **Calibri 11pt** | ✅ |
| Títulos | 11pt | **18pt** | ✅ |
| Texto principal | 9pt | **14pt** | ✅ |
| Tabelas | 9pt | **11pt** | ✅ |
| Cabeçalho | 10pt/9pt | **11pt** | ✅ |
| Assinatura | 9pt | **11pt** | ✅ |
| Data | Manual (___/___/____) | **Automática** | ✅ |
| Fundo | Cinza escuro | **Branco** | ✅ |
| Checkboxes | Brancos | **Pretos** | ✅ |

---

## 🎯 Resultado Final

O documento HTML agora está **IDENTICO** ao documento Word em:
- ✅ Fonte: Calibri
- ✅ Tamanhos: 11pt (padrão), 14pt (corpo), 18pt (títulos)
- ✅ Cores: Fundo branco, texto preto
- ✅ Data: Gerada automaticamente no formato extenso
- ✅ Layout: Mesma estrutura e organização
- ✅ Impressão: Pronto para imprimir ou salvar como PDF

---

## 🚀 Como Usar

### Via Interface Web (Frontend):
1. Clique no botão "Gerar Documento ▼"
2. Selecione "Gerar Documento HTML"
3. O documento será aberto em nova aba
4. Para PDF: Ctrl+P → Salvar como PDF

### Via Python:
```python
from core.unified_generator import generate_document_unified

data = {
    "paciente": {...},
    "atestado": {...},
    "medico": {...}
}

resultado = generate_document_unified(data, output_format='html')
print(resultado['html'])  # Caminho do arquivo gerado
```

---

**Data da Atualização:** 09/11/2025
**Desenvolvedor:** Kauan Kelvin
