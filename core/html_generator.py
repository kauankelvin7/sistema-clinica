"""
Módulo de geração de documentos HTML
Sistema de Homologação de Atestados Médicos
Autor: Kauan Kelvin
Data: 09/11/2025

Este módulo implementa:
- Geração de documentos HTML com formatação profissional
- Suporte para logos e imagens em base64
- Template responsivo e imprimível
- Base para conversão rápida para PDF ou DOCX
"""

import os
import re
import base64
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

# Importar configurações
try:
    from .config import GENERATED_DOCS_DIR
except ImportError:
    GENERATED_DOCS_DIR = Path(os.path.dirname(os.path.dirname(__file__))) / 'data' / 'generated_documents'


class HTMLGenerationError(Exception):
    """Exceção customizada para erros na geração de HTML"""
    pass


def _format_date_brazil(date_input) -> str:
    """
    Formata data para o padrão brasileiro DD/MM/YYYY
    
    Args:
        date_input: Data em diversos formatos (datetime, string ISO, string BR)
        
    Returns:
        str: Data formatada no padrão brasileiro DD/MM/YYYY
    """
    if not date_input:
        return ""
    
    if hasattr(date_input, 'strftime'):
        return date_input.strftime("%d/%m/%Y")
    
    if isinstance(date_input, str):
        s = date_input.strip()
        if re.match(r"^\d{2}/\d{2}/\d{4}$", s):
            return s
        
        parse_formats = [
            "%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S",
            "%Y/%m/%d", "%d-%m-%Y", "%d.%m.%Y",
        ]
        
        for fmt in parse_formats:
            try:
                dt = datetime.strptime(s, fmt)
                return dt.strftime("%d/%m/%Y")
            except:
                continue
        
        return s
    
    return str(date_input)


def encode_image_to_base64(image_path: str) -> Optional[str]:
    """
    Converte imagem para formato base64 para incorporação direta no HTML
    Isso elimina a necessidade de arquivos externos de imagem
    
    Args:
        image_path: Caminho completo do arquivo de imagem
        
    Returns:
        str: String base64 com prefixo data URI (ex: data:image/png;base64,...)
        None: Se a imagem não existir ou houver erro na conversão
    """
    try:
        if not os.path.exists(image_path):
            logger.warning(f"⚠️ Imagem não encontrada: {image_path}")
            return None
        
        # Ler arquivo e converter para base64
        with open(image_path, 'rb') as img_file:
            encoded = base64.b64encode(img_file.read()).decode('utf-8')
            
        # Detectar tipo MIME baseado na extensão do arquivo
        ext = Path(image_path).suffix.lower()
        mime_types = {
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
        }
        mime = mime_types.get(ext, 'image/png')
        
        return f"data:{mime};base64,{encoded}"
    except Exception as e:
        logger.error(f"❌ Erro ao codificar imagem: {e}")
        return None


def get_html_template() -> str:
    """
    Retorna o template HTML completo e totalmente responsivo
    
    O template replica EXATAMENTE o layout do documento Word oficial com:
    - Cabeçalho com logo e título
    - Corpo do documento com declaração médica
    - Tabelas de decisão e prontuário do paciente
    - Assinatura do médico com carimbo
    - Rodapé com mensagem institucional
    
    Recursos de responsividade:
    - Tamanhos de texto ajustáveis via clamp() (min, ideal, max)
    - Media queries para: mobile, tablet, desktop, widescreen, ultrawide, 4K
    - Espaçamentos e padding proporcionais ao tamanho da tela
    - Otimizado para impressão mantendo layout original
    
    Returns:
        str: Template HTML completo com CSS incorporado
    """
    return """<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
    <title>Declaração</title>
    <style>
        /* ========== CONFIGURAÇÃO DE IMPRESSÃO ========== */
        @page {
            size: A4;
            margin: 0.5in;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        /* ========== ESTILOS BASE (Desktop) ========== */
        body {
            font-family: 'Calibri', 'Carlito', 'Helvetica Neue', Arial, sans-serif;
            font-size: clamp(10pt, 1.5vw, 11pt); /* Responsivo: min 10pt, ideal 1.5vw, max 11pt */
            line-height: 1.3;
            color: #000;
            background: #f5f5f5;
            padding: 10px;
        }
        
        .page {
            width: 100%;
            max-width: 8.27in;
            min-height: 11.69in;
            margin: 0 auto;
            padding: clamp(0.2in, 3vw, 0.4in); /* Padding responsivo */
            background: white;
            position: relative;
            border: 3px double #000;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        
        /* ========== CABEÇALHO RESPONSIVO ========== */
        .header {
            display: flex;
            align-items: flex-start;
            flex-wrap: wrap; /* Permite quebra em telas pequenas */
            gap: clamp(10px, 2vw, 20px);
            margin-bottom: 5px;
            padding: clamp(5px, 1.5vw, 10px);
            border-bottom: 2px solid #000;
            padding-left: clamp(10px, 3vw, 30px);
        }
        
        /* ========== LOGO RESPONSIVO ========== */
        .header-logo {
            width: clamp(50px, 8vw, 80px); /* Min 50px, ideal 8vw, max 80px */
            height: clamp(50px, 8vw, 80px);
            flex-shrink: 0;
            object-fit: contain;
        }
        
        .header-text {
            flex: 1;
            text-align: center;
            min-width: 200px; /* Garante largura mínima */
        }
        
        .header-title {
            font-size: clamp(12pt, 2vw, 14pt); /* Título responsivo */
            font-weight: bold;
            color: #000;
            margin-bottom: 3px;
        }
        
        .header-subtitle {
            font-size: clamp(10pt, 1.8vw, 12pt); /* Subtítulo responsivo */
            color: #333;
        }
        
        /* ========== RODAPÉ RESPONSIVO ========== */
        .footer {
            position: absolute;
            bottom: clamp(0.2in, 2vh, 0.3in);
            left: clamp(0.2in, 3vw, 0.4in);
            right: clamp(0.2in, 3vw, 0.4in);
            text-align: center;
            font-family: 'Times New Roman', Times, serif;
            font-size: clamp(10pt, 1.8vw, 12pt);
            color: #00a651;
            padding-top: 5px;
        }
        
        .footer-line1 {
            font-weight: bold;
            margin-bottom: 2px;
            font-size: clamp(10pt, 1.8vw, 12pt);
        }
        
        .footer-line2 {
            font-size: clamp(10pt, 1.8vw, 12pt);
        }
        
        /* ========== TABELA TÍTULO RESPONSIVA ========== */
        .title-table {
            width: 100%;
            border: 3px double #000;
            border-collapse: collapse;
            margin-bottom: 10px;
            overflow-x: auto; /* Scroll horizontal em telas pequenas */
        }
        
        .title-table td {
            padding: clamp(4px, 1.2vw, 8px);
            text-align: center;
            font-size: clamp(14pt, 2.5vw, 18pt); /* Título grande responsivo */
            font-weight: bold;
            background: #fff;
        }
        
        /* ========== TEXTO PRINCIPAL RESPONSIVO ========== */
        .main-text {
            text-align: justify;
            font-size: clamp(12pt, 2vw, 14pt); /* Texto principal responsivo */
            margin-bottom: 10px;
            line-height: 1.4;
            padding: clamp(5px, 1.5vw, 10px);
            background: #f5f5f5;
            hyphens: auto; /* Hifenização automática */
            word-wrap: break-word;
        }
        
        /* ========== CAIXA DE DECISÃO RESPONSIVA ========== */
        .decision-box {
            width: 100%;
            border: 2px solid #000;
            border-collapse: collapse;
            margin: 10px 0;
            background: #fff;
            color: #000;
            overflow-x: auto;
        }
        
        .decision-box td {
            padding: clamp(6px, 1.5vw, 12px);
            border: 1px solid #000;
        }
        
        .decision-title {
            font-weight: bold;
            text-align: left;
            margin-bottom: 8px;
            font-size: clamp(10pt, 1.6vw, 11pt);
        }
        
        .decision-options {
            line-height: 1.8;
            font-size: clamp(10pt, 1.6vw, 11pt); /* Opções responsivas */
        }
        
        .checkbox {
            display: inline-block;
            width: clamp(12px, 2vw, 14px); /* Checkbox responsivo */
            height: clamp(12px, 2vw, 14px);
            border: 2px solid #000;
            background: #fff;
            margin-right: clamp(4px, 1vw, 8px);
            vertical-align: middle;
        }
        
        .decision-note {
            font-size: clamp(10pt, 1.6vw, 11pt);
            padding-top: clamp(5px, 1.5vw, 10px);
            border-top: 1px solid #000;
            text-align: center;
        }
        
        /* ========== TABELA PRONTUÁRIO RESPONSIVA ========== */
        .prontuario-title {
            width: 100%;
            border: 3px double #000;
            border-collapse: collapse;
            margin-top: 10px;
            margin-bottom: 10px;
            overflow-x: auto;
        }
        
        .prontuario-title td {
            padding: clamp(4px, 1.2vw, 8px);
            text-align: center;
            font-weight: bold;
            font-size: clamp(10pt, 1.6vw, 11pt);
            background: #fff;
        }
        
        /* ========== TABELA PACIENTE RESPONSIVA ========== */
        .patient-table {
            width: 100%;
            border: 2px solid #000;
            border-collapse: collapse;
            margin-bottom: 10px;
            background: #fff;
            color: #000;
            overflow-x: auto;
        }
        
        .patient-table td {
            padding: clamp(6px, 1.5vw, 10px);
            border: 1px solid #000;
            font-size: clamp(10pt, 1.6vw, 11pt);
            word-wrap: break-word;
        }
        
        .patient-table strong {
            color: #000;
        }
        
        /* ========== ASSINATURA RESPONSIVA ========== */
        .signature-section {
            margin-top: clamp(60px, 12vh, 120px); /* Espaço responsivo */
            text-align: center;
        }
        
        .signature-line {
            display: inline-block;
            width: clamp(200px, 50vw, 350px); /* Linha responsiva */
            border-top: 1px solid #000;
            margin-bottom: 5px;
        }
        
        .signature-label {
            font-weight: bold;
            font-size: clamp(10pt, 1.6vw, 11pt);
            margin-top: 5px;
        }
        
        .date-line {
            font-weight: bold;
            margin-top: clamp(15px, 3vh, 30px);
            font-size: clamp(10pt, 1.6vw, 11pt);
        }
        
        /* ========== QUEBRA DE PÁGINA ========== */
        .page-break {
            page-break-after: always;
        }
        
        /* ========== MEDIA QUERIES PARA DIFERENTES DISPOSITIVOS ========== */
        
        /* Mobile Portrait (até 576px) */
        @media screen and (max-width: 576px) {
            body {
                padding: 5px;
                font-size: 9pt;
            }
            
            .page {
                border-width: 2px;
                padding: 0.15in;
            }
            
            .header {
                flex-direction: column;
                align-items: center;
                text-align: center;
                padding-left: 10px;
            }
            
            .header-logo {
                width: 60px;
                height: 60px;
            }
            
            .title-table td {
                font-size: 14pt;
                padding: 4px;
            }
            
            .main-text {
                font-size: 11pt;
                padding: 5px;
            }
            
            .signature-section {
                margin-top: 40px;
            }
            
            .signature-line {
                width: 90%;
            }
        }
        
        /* Tablet Portrait (577px - 768px) */
        @media screen and (min-width: 577px) and (max-width: 768px) {
            body {
                font-size: 10pt;
            }
            
            .page {
                padding: 0.25in;
            }
            
            .header-logo {
                width: 70px;
                height: 70px;
            }
            
            .title-table td {
                font-size: 16pt;
            }
            
            .main-text {
                font-size: 12pt;
            }
        }
        
        /* Tablet Landscape / Desktop Small (769px - 1024px) */
        @media screen and (min-width: 769px) and (max-width: 1024px) {
            .page {
                padding: 0.3in;
            }
        }
        
        /* Desktop / Widescreen (1025px - 1920px) */
        @media screen and (min-width: 1025px) and (max-width: 1920px) {
            body {
                padding: 20px;
            }
            
            .page {
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            }
        }
        
        /* Ultrawide / 4K (acima de 1920px) */
        @media screen and (min-width: 1921px) {
            body {
                padding: 40px;
                background: #e0e0e0;
            }
            
            .page {
                box-shadow: 0 8px 30px rgba(0,0,0,0.2);
                max-width: 1000px; /* Limita largura em telas muito grandes */
            }
        }
        
        /* Impressão */
        @media print {
            body {
                padding: 0;
                background: white;
            }
            
            .page {
                margin: 0;
                padding: 0.4in;
            }
            
            body {
                background: white;
            }
            
            .page-break {
                page-break-after: always;
            }
        }
    </style>
</head>
<body>
    <!-- PÁGINA 1 -->
    <div class="page">
        
        <!-- CABEÇALHO com logo e texto -->
        <div class="header">
            <img src="{logo_base64}" class="header-logo" alt="Logo NOVA" />
            <div class="header-text">
                <div class="header-title">NOVA | Medicina e Segurança do Trabalho.</div>
                <div class="header-subtitle">Exames: Admissionais, Demissionais, Periódicos e Outros.</div>
            </div>
        </div>
        
        <!-- Título DECLARAÇÃO -->
        <table class="title-table">
            <tr>
                <td>DECLARAÇÃO</td>
            </tr>
        </table>
        
        <!-- Texto principal -->
        <div class="main-text">
            Declaro que o Sr. (A) <strong>{nome_paciente}</strong> de <strong>{documento_paciente_formatado}</strong>. 
            Compareceu a esta clínica com objetivo de submeter-se a avaliação médica administrativa em virtude do 
            atestado médico data do <strong>{data_atestado}</strong> em que foi sugerido afastamento pelo período de 
            <strong>{qtd_dias_atestado} dia(s)</strong> com CID: <strong>{codigo_cid}</strong> emitido (a) pelo (a) 
            Dr. (a) <strong>{nome_medico} {crm_medico}-{uf_crm_medico}</strong>.
        </div>
        
        <!-- Caixa de decisão -->
        <table class="decision-box">
            <tr>
                <td>
                    <div class="decision-title">APÓS AVALIAÇÃO CLÍNICA, FOI DECIDIDO:</div>
                    <div class="decision-options">
                        <div><span class="checkbox"></span> Afastamento Total:</div>
                        <div><span class="checkbox"></span> Afastamento parcial pelo período de:</div>
                        <div><span class="checkbox"></span> Negada licença médica por motivo de doença:</div>
                    </div>
                </td>
            </tr>
            <tr>
                <td class="decision-note">
                    Caso o paciente não se sinta apto para retornar ao trabalho, deverá retornar ao médico assistente para uma nova avaliação.
                </td>
            </tr>
        </table>
        
        <!-- Assinatura -->
        <div class="signature-section">
            <div class="signature-line"></div><br>
            <div class="signature-label">Médico do trabalho / Examinador</div><br>
            <div class="date-line">Brasília, ___/___/____</div>
        </div>
        
        <!-- RODAPÉ -->
        <div class="footer">
            <div class="footer-line1">NOVA MEDICINA E SEGURANÇA DO TRABALHO LTDA.</div>
            <div class="footer-line2">SDS, Bloco D, Ed. Eldorado, Entrada B, 1.º Subsolo - Sala 01 CEP 70.392.901 Brasília–DF.</div>
        </div>
    </div>
    
    <!-- QUEBRA DE PÁGINA -->
    <div class="page-break"></div>
    
    <!-- PÁGINA 2 -->
    <div class="page">
        
        <!-- CABEÇALHO (repetido) -->
        <div class="header">
            <img src="{logo_base64}" class="header-logo" alt="Logo NOVA" />
            <div class="header-text">
                <div class="header-title">NOVA | Medicina e Segurança do Trabalho.</div>
                <div class="header-subtitle">Exames: Admissionais, Demissionais, Periódicos e Outros.</div>
            </div>
        </div>
        
        <!-- Título PRONTUÁRIO -->
        <table class="prontuario-title">
            <tr>
                <td>PRONTUÁRIO DE PERÍCIA MÉDICA</td>
            </tr>
        </table>
        
        <!-- Tabela de dados do paciente -->
        <table class="patient-table">
            <tr>
                <td><strong>NOME:</strong> {nome_paciente}</td>
            </tr>
            <tr>
                <td><strong>EMPRESA:</strong> {empresa_paciente}</td>
            </tr>
            <tr>
                <td><strong>CARGO:</strong> {cargo_paciente}</td>
            </tr>
            <tr>
                <td><strong>CID10:</strong> {codigo_cid}</td>
            </tr>
            <tr>
                <td><strong>DATA DO ATESTADO:</strong> {data_atestado} | <strong>Nº DE DIAS DE AFASTAMENTO:</strong> {qtd_dias_atestado}</td>
            </tr>
            <tr>
                <td>
                    <strong>IDENTIFICAÇÃO DO PROFISSIONAL DE SAÚDE QUE FORNECEU O ATESTADO:</strong><br>
                    Dr. (a) {nome_medico} {crm_medico}-{uf_crm_medico}
                </td>
            </tr>
        </table>
        
        <!-- Caixa de decisão (segunda página) -->
        <table class="decision-box">
            <tr>
                <td>
                    <div class="decision-title">APÓS AVALIAÇÃO CLÍNICA, FOI DECIDIDO:</div>
                    <div class="decision-options">
                        <div><span class="checkbox"></span> Afastamento Total:</div>
                        <div><span class="checkbox"></span> Afastamento parcial pelo período de:</div>
                        <div><span class="checkbox"></span> Negada licença médica por motivo de doença:</div>
                    </div>
                </td>
            </tr>
        </table>
        
        <!-- Assinatura (segunda página) -->
        <div class="signature-section">
            <div class="signature-line"></div><br>
            <div class="signature-label">Médico do trabalho / Examinador</div><br>
            <div class="date-line">Brasília, ___/___/____</div>
        </div>
        
        <!-- RODAPÉ (repetido) -->
        <div class="footer">
            <div class="footer-line1">NOVA MEDICINA E SEGURANÇA DO TRABALHO LTDA.</div>
            <div class="footer-line2">SDS, Bloco D, Ed. Eldorado, Entrada B, 1.º Subsolo - Sala 01 CEP 70.392.901 Brasília–DF.</div>
        </div>
    </div>
</body>
</html>"""


def get_logo_base64() -> str:
    """Retorna logo em base64 do arquivo extraído"""
    try:
        logo_path = Path(__file__).parent.parent / 'assets' / 'extracted_images' / 'image1.png'
        if logo_path.exists():
            import base64
            with open(logo_path, 'rb') as f:
                img_data = base64.b64encode(f.read()).decode('utf-8')
            return f'data:image/png;base64,{img_data}'
    except:
        pass
    return ''


def generate_html(data: Dict[str, Any], logo_left: Optional[str] = None, 
                  logo_right: Optional[str] = None) -> str:
    """
    Gera documento HTML completo a partir dos dados fornecidos
    
    Esta função:
    1. Carrega o template HTML responsivo
    2. Converte o logo para base64
    3. Formata todos os dados conforme padrão brasileiro
    4. Substitui todos os placeholders no template
    5. Retorna HTML pronto para visualização ou impressão
    
    Args:
        data: Dicionário contendo todos os dados do atestado médico:
            - nome_paciente: Nome completo do paciente
            - tipo_doc_paciente: Tipo de documento (CPF, RG, etc)
            - numero_doc_paciente: Número do documento
            - cargo_paciente: Cargo do paciente
            - empresa_paciente: Empresa onde trabalha
            - data_atestado: Data de emissão do atestado
            - qtd_dias_atestado: Quantidade de dias de afastamento
            - codigo_cid: Código CID ou "NÃO INFORMADO"
            - nome_medico: Nome completo do médico
            - tipo_registro_medico: Tipo de registro (CRM, CRO, etc)
            - crm__medico: Número do registro
            - uf_crm_medico: UF do registro
        logo_left: Caminho do logo esquerdo (não usado atualmente)
        logo_right: Caminho do logo direito (não usado atualmente)
        
    Returns:
        str: HTML completo pronto para salvar ou exibir
        
    Raises:
        HTMLGenerationError: Se houver erro na geração do documento
    """
    try:
        logger.info("📄 Iniciando geração de documento HTML...")
        
        # Obter template HTML base
        html_template = get_html_template()
        
        # Converter logo para base64 (incorporado no HTML)
        logo_base64 = get_logo_base64()
        
        # Preparar dados do médico para formatação
        nome_medico_completo = str(data.get('nome_medico', '')).strip()
        tipo_registro = str(data.get('tipo_registro_medico', '')).strip()
        crm_numero = str(data.get('crm__medico', '')).strip()
        uf_crm = str(data.get('uf_crm_medico', '')).strip()
        
        # Formatar registro profissional: "CRM 12345" ou apenas número se tipo não informado
        crm_formatado = f"{tipo_registro} {crm_numero}" if tipo_registro else crm_numero
        
        # Gerar data por extenso para assinatura: "Brasília, 09 de novembro de 2024"
        from datetime import datetime
        data_atual = datetime.now()
        meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
                 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
        data_extenso = f"Brasília, {data_atual.day} de {meses[data_atual.month - 1]} de {data_atual.year}"
        
        # Dicionário de substituições - cada chave será substituída pelo valor correspondente
        replacements = {
            '{logo_base64}': logo_base64,
            '{nome_paciente}': str(data.get('nome_paciente', '')).strip(),
            '{documento_paciente_formatado}': f"{data.get('tipo_doc_paciente', '').upper()} nº: {data.get('numero_doc_paciente', '')}",
            '{data_atestado}': _format_date_brazil(data.get('data_atestado', '')),
            '{qtd_dias_atestado}': str(data.get('qtd_dias_atestado', '')),
            '{codigo_cid}': str(data.get('codigo_cid', '')).strip(),  # Já vem "NÃO INFORMADO" se marcado
            '{cargo_paciente}': str(data.get('cargo_paciente', '')).strip(),
            '{empresa_paciente}': str(data.get('empresa_paciente', '')).strip(),
            '{nome_medico}': nome_medico_completo,
            '{crm_medico}': crm_formatado,
            '{uf_crm_medico}': uf_crm,
            'Brasília, ___/___/____': data_extenso,
        }
        
        # Substituir todos os placeholders no template
        html_content = html_template
        for key, value in replacements.items():
            html_content = html_content.replace(key, value)
        
        logger.info("✅ HTML gerado com sucesso!")
        return html_content
        
    except Exception as e:
        logger.error(f"❌ Erro ao gerar HTML: {e}", exc_info=True)
        raise HTMLGenerationError(f"Erro ao gerar HTML: {e}")


def save_html(html_content: str, output_path: Optional[str] = None) -> str:
    """
    Salva conteúdo HTML em arquivo no disco
    
    Args:
        html_content: String contendo o HTML completo
        output_path: Caminho onde salvar (opcional - gera automaticamente se não informado)
        
    Returns:
        str: Caminho completo do arquivo HTML salvo
        
    Raises:
        Exception: Se houver erro ao escrever o arquivo
    """
    try:
        if not output_path:
            # Gerar nome de arquivo automático com timestamp
            GENERATED_DOCS_DIR.mkdir(parents=True, exist_ok=True)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = GENERATED_DOCS_DIR / f"Declaracao_{timestamp}.html"
        
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Escrever HTML no arquivo com encoding UTF-8
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        logger.info(f"✅ HTML salvo em: {output_path}")
        return str(output_path)
        
    except Exception as e:
        logger.error(f"❌ Erro ao salvar HTML: {e}")
        raise HTMLGenerationError(f"Erro ao salvar HTML: {e}")


def generate_and_save_html(data: Dict[str, Any], logo_left: Optional[str] = None,
                           logo_right: Optional[str] = None, 
                           output_path: Optional[str] = None) -> str:
    """
    Função de conveniência que gera E salva o documento HTML em uma única chamada
    
    Args:
        data: Dicionário com dados do atestado médico
        logo_left: Caminho do logo esquerdo (não usado)
        logo_right: Caminho do logo direito (não usado)
        output_path: Onde salvar o arquivo (opcional - gera automaticamente)
        
    Returns:
        str: Caminho completo do arquivo HTML salvo
    """
    html_content = generate_html(data, logo_left, logo_right)
    return save_html(html_content, output_path)


if __name__ == '__main__':
    # Teste de geração de HTML
    print("🧪 Testando geração de HTML...")
    
    test_data = {
        'nome_paciente': 'João Silva Santos',
        'tipo_doc_paciente': 'CPF',
        'numero_doc_paciente': '123.456.789-00',
        'data_atestado': '09/11/2025',
        'qtd_dias_atestado': '3',
        'codigo_cid': 'Z76.5',
        'cargo_paciente': 'Analista de Sistemas',
        'empresa_paciente': 'Tech Solutions LTDA',
        'nome_medico': 'Maria Santos',
        'tipo_registro_medico': 'CRM',
        'crm__medico': '12345',
        'uf_crm_medico': 'DF',
    }
    
    try:
        output = generate_and_save_html(test_data)
        print(f"✅ HTML gerado: {output}")
    except Exception as e:
        print(f"❌ Erro: {e}")
