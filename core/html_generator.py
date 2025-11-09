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
    """Exceção para erros na geração de HTML"""
    pass


def _format_date_brazil(date_input) -> str:
    """Formata data para padrão brasileiro DD/MM/YYYY"""
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
    Converte imagem para base64 para embedding no HTML
    
    Args:
        image_path: Caminho da imagem
        
    Returns:
        str: String base64 da imagem ou None se falhar
    """
    try:
        if not os.path.exists(image_path):
            logger.warning(f"Imagem não encontrada: {image_path}")
            return None
        
        with open(image_path, 'rb') as img_file:
            encoded = base64.b64encode(img_file.read()).decode('utf-8')
            
        # Detectar tipo MIME
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
        logger.error(f"Erro ao codificar imagem: {e}")
        return None


def get_html_template() -> str:
    """
    Retorna o template HTML que REPLICA EXATAMENTE o documento Word
    Baseado na imagem fornecida pelo usuário
    """
    return """<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Declaração</title>
    <style>
        @page {
            size: A4;
            margin: 0.5in;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Calibri', 'Carlito', 'Helvetica Neue', Arial, sans-serif;
            font-size: 11pt;
            line-height: 1.3;
            color: #000;
            background: #fff;
        }
        
        .page {
            width: 8.27in;
            min-height: 11.69in;
            margin: 0 auto;
            padding: 0.4in;
            background: white;
            position: relative;
            border: 3px double #000;
        }
        
        /* CABEÇALHO com logo e texto ao lado */
        .header {
            display: flex;
            align-items: flex-start;
            gap: 20px;
            margin-bottom: 5px;
            padding: 10px;
            border-bottom: 2px solid #000;
            padding-left: 30px;
        }
        
        .header-logo {
            width: 80px;
            height: 80px;
            flex-shrink: 0;
        }
        
        .header-text {
            flex: 1;
            text-align: center;
        }
        
        .header-title {
            font-size: 14pt;
            font-weight: bold;
            color: #000;
            margin-bottom: 3px;
        }
        
        .header-subtitle {
            font-size: 12pt;
            color: #333;
        }
        
        /* RODAPÉ verde */
        .footer {
            position: absolute;
            bottom: 0.3in;
            left: 0.4in;
            right: 0.4in;
            text-align: center;
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            color: #00a651;
            padding-top: 5px;
        }
        
        .footer-line1 {
            font-weight: bold;
            margin-bottom: 2px;
            font-size: 12pt;
        }
        
        .footer-line2 {
            font-size: 12pt;
        }
        
        /* Tabela título DECLARAÇÃO / PRONTUÁRIO */
        .title-table {
            width: 100%;
            border: 3px double #000;
            border-collapse: collapse;
            margin-bottom: 10px;
        }
        
        .title-table td {
            padding: 8px;
            text-align: center;
            font-size: 18pt;
            font-weight: bold;
            background: #fff;
        }
        
        /* Parágrafo principal */
        .main-text {
            text-align: justify;
            font-size: 14pt;
            margin-bottom: 10px;
            line-height: 1.4;
            padding: 10px;
            background: #f5f5f5;
        }
        
        /* Tabela de decisão com fundo BRANCO */
        .decision-box {
            width: 100%;
            border: 2px solid #000;
            border-collapse: collapse;
            margin: 10px 0;
            background: #fff;
            color: #000;
        }
        
        .decision-box td {
            padding: 12px;
            border: 1px solid #000;
        }
        
        .decision-title {
            font-weight: bold;
            text-align: left;
            margin-bottom: 8px;
            font-size: 11pt;
        }
        
        .decision-options {
            line-height: 1.8;
            font-size: 11pt;
        }
        
        .checkbox {
            display: inline-block;
            width: 14px;
            height: 14px;
            border: 2px solid #000;
            background: #fff;
            margin-right: 8px;
            vertical-align: middle;
        }
        
        .decision-note {
            font-size: 11pt;
            padding-top: 10px;
            border-top: 1px solid #000;
            text-align: center;
        }
        
        /* Tabela PRONTUÁRIO com fundo escuro */
        .prontuario-title {
            width: 100%;
            border: 3px double #000;
            border-collapse: collapse;
            margin-top: 10px;
            margin-bottom: 10px;
        }
        
        .prontuario-title td {
            padding: 8px;
            text-align: center;
            font-weight: bold;
            font-size: 11pt;
            background: #fff;
        }
        
        /* Tabela de dados do paciente com fundo BRANCO */
        .patient-table {
            width: 100%;
            border: 2px solid #000;
            border-collapse: collapse;
            margin-bottom: 10px;
            background: #fff;
            color: #000;
        }
        
        .patient-table td {
            padding: 10px;
            border: 1px solid #000;
            font-size: 11pt;
        }
        
        .patient-table strong {
            color: #000;
        }
        
        /* Assinatura */
        .signature-section {
            margin-top: 120px;
            text-align: center;
        }
        
        .signature-line {
            display: inline-block;
            width: 350px;
            border-top: 1px solid #000;
            margin-bottom: 5px;
        }
        
        .signature-label {
            font-weight: bold;
            font-size: 11pt;
            margin-top: 5px;
        }
        
        .date-line {
            font-weight: bold;
            margin-top: 30px;
            font-size: 11pt;
        }
        
        /* Quebra de página */
        .page-break {
            page-break-after: always;
        }
        
        @media print {
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
    Gera documento HTML a partir dos dados fornecidos
    
    Args:
        data: Dicionário com os dados do documento
        logo_left: Caminho para logo esquerda (opcional)
        logo_right: Caminho para logo direita (opcional)
        
    Returns:
        str: Conteúdo HTML gerado
        
    Raises:
        HTMLGenerationError: Se houver erro na geração
    """
    try:
        logger.info("Gerando documento HTML...")
        
        # Obter template
        html_template = get_html_template()
        
        # Obter logo em base64
        logo_base64 = get_logo_base64()
        
        # Preparar dados para substituição (seguindo estrutura do template Word)
        nome_medico_completo = str(data.get('nome_medico', '')).strip()
        tipo_registro = str(data.get('tipo_registro_medico', '')).strip()
        crm_numero = str(data.get('crm__medico', '')).strip()
        uf_crm = str(data.get('uf_crm_medico', '')).strip()
        
        # Formatar CRM completo: "CRM 12345" ou apenas o número
        crm_formatado = f"{tipo_registro} {crm_numero}" if tipo_registro else crm_numero
        
        # Data atual para assinatura (formato: "Brasília, 09 de novembro de 2024")
        from datetime import datetime
        data_atual = datetime.now()
        meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
                 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
        data_extenso = f"Brasília, {data_atual.day} de {meses[data_atual.month - 1]} de {data_atual.year}"
        
        replacements = {
            '{logo_base64}': logo_base64,
            '{nome_paciente}': str(data.get('nome_paciente', '')).strip(),
            '{documento_paciente_formatado}': f"{data.get('tipo_doc_paciente', '').upper()} nº: {data.get('numero_doc_paciente', '')}",
            '{data_atestado}': _format_date_brazil(data.get('data_atestado', '')),
            '{qtd_dias_atestado}': str(data.get('qtd_dias_atestado', '')),
            '{codigo_cid}': str(data.get('codigo_cid', '')).strip(),
            '{cargo_paciente}': str(data.get('cargo_paciente', '')).strip(),
            '{empresa_paciente}': str(data.get('empresa_paciente', '')).strip(),
            '{nome_medico}': nome_medico_completo,
            '{crm_medico}': crm_formatado,
            '{uf_crm_medico}': uf_crm,
            'Brasília, ___/___/____': data_extenso,
        }
        
        # Substituir placeholders
        html_content = html_template
        for key, value in replacements.items():
            html_content = html_content.replace(key, value)
        
        logger.info("✅ HTML gerado com sucesso")
        return html_content
        
    except Exception as e:
        logger.error(f"Erro ao gerar HTML: {e}", exc_info=True)
        raise HTMLGenerationError(f"Erro ao gerar HTML: {e}")


def save_html(html_content: str, output_path: Optional[str] = None) -> str:
    """
    Salva conteúdo HTML em arquivo
    
    Args:
        html_content: Conteúdo HTML
        output_path: Caminho do arquivo de saída (opcional)
        
    Returns:
        str: Caminho do arquivo salvo
    """
    try:
        if not output_path:
            # Gerar nome automático
            GENERATED_DOCS_DIR.mkdir(parents=True, exist_ok=True)
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = GENERATED_DOCS_DIR / f"Declaracao_{timestamp}.html"
        
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        logger.info(f"✅ HTML salvo em: {output_path}")
        return str(output_path)
        
    except Exception as e:
        logger.error(f"Erro ao salvar HTML: {e}")
        raise HTMLGenerationError(f"Erro ao salvar HTML: {e}")


def generate_and_save_html(data: Dict[str, Any], logo_left: Optional[str] = None,
                           logo_right: Optional[str] = None, 
                           output_path: Optional[str] = None) -> str:
    """
    Gera e salva documento HTML
    
    Args:
        data: Dados do documento
        logo_left: Caminho logo esquerda (opcional)
        logo_right: Caminho logo direita (opcional)
        output_path: Caminho de saída (opcional)
        
    Returns:
        str: Caminho do arquivo HTML salvo
    """
    html_content = generate_html(data, logo_left, logo_right)
    return save_html(html_content, output_path)


if __name__ == '__main__':
    # Teste rápido
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
