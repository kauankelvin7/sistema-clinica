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

# Cache global para logo em base64 (melhora performance)
_LOGO_CACHE = None

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
    Usa cache global para melhorar performance em múltiplas gerações
    
    Args:
        image_path: Caminho completo do arquivo de imagem
        
    Returns:
        str: String base64 com prefixo data URI (ex: data:image/png;base64,...)
        None: Se a imagem não existir ou houver erro na conversão
    """
    global _LOGO_CACHE
    
    # Usar cache se disponível
    if _LOGO_CACHE is not None:
        return _LOGO_CACHE
    
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
        
        # Criar string base64 completa com prefixo data URI
        result = f"data:{mime};base64,{encoded}"
        
        # Armazenar no cache para próximas gerações
        _LOGO_CACHE = result
        
        return result
        
    except Exception as e:
        logger.error(f"❌ Erro ao converter imagem para base64: {e}")
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
    
    Returns:
        str: Template HTML completo com CSS incorporado
    """
    return """<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Declaração Médica</title>
    <style>
        @page {
            size: A4;
            margin: 10mm 10mm 2mm 10mm; /* margem inferior mínima */
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 11pt;
            line-height: 1.4;
            color: #000;
            background: #f5f5f5;
            padding: 20px;
        }
        
        .page {
            width: 210mm;
            min-height: 297mm;
            margin: 0 auto 20px auto;
            background: white;
            border: 2px solid #000;
            padding: 0;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            position: relative;
            display: flex;
            flex-direction: column;
            height: 297mm;
        }
        
        /* CABEÇALHO COM LOGO */
        .header {
            display: flex;
            align-items: center;
            padding: 15px 20px;
            gap: 15px;
            border-bottom: 2px solid #000;
        }
        
        .header-logo {
            width: 80px;
            height: 80px;
            flex-shrink: 0;
            margin-left: 70px;
        }
        
        .header-text {
            flex: 1;
            text-align: center;
        }
        
        .header-title {
            font-size: 16pt;
            font-weight: bold;
            color: #000;
            margin-bottom: 2px;
        }
        
        .header-subtitle {
            font-size: 12pt;
            color: #000;
        }
        
        /* TÍTULO DECLARAÇÃO */
        .declaration-title {
            text-align: center;
            font-size: 18pt;
            font-weight: bold;
            padding: 15px;
            border-bottom: 2px solid #000;
            background: white;
        }
        
        /* TEXTO PRINCIPAL */
        .main-content {
            padding: 20px 25px;
        }
        
        .main-text {
            text-align: justify;
            font-size: 13pt;
            line-height: 1.8;
            margin-bottom: 25px;
        }
        
        /* CAIXA DE DECISÃO */
        .decision-box {
            border: 2px solid #000;
            margin: 20px 0;
        }
        
        .decision-header {
            background: white;
            padding: 10px 15px;
            border-bottom: 2px solid #000;
        }
        
        .decision-title {
            font-weight: bold;
            font-size: 12pt;
            margin-bottom: 10px;
        }
        
        .decision-options {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        
        .decision-option {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12pt;
        }
        
        .checkbox {
            width: 14px;
            height: 14px;
            border: 2px solid #000;
            background: white;
            flex-shrink: 0;
        }
        
        .decision-footer {
            padding: 10px 15px;
            font-size: 11pt;
            text-align: center;
            background: white;
            font-style: italic;
        }
        
        /* ASSINATURA */
        .signature-section {
            margin-top: 80px;
            margin-bottom: 100px;
            text-align: center;
            padding: 0 25px;
        }
        
        .signature-line {
            width: 450px;
            margin: 0 auto;
            border-top: 1px solid #000;
            padding-top: 8px;
        }
        
        .signature-label {
            font-size: 12pt;
            font-weight: normal;
            margin-top: 5px;
        }
        
        .signature-date {
            margin-top: 25px;
            font-size: 13pt;
            font-weight: bold;
        }
        
        /* RODAPÉ */
        .footer {
            text-align: center;
            padding: 0;
            background: white;
            min-height: 35px;
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        
        .footer-line1 {
            font-size: 11pt;
            font-weight: bold;
            color: #000;
            margin-bottom: 3px;
        }
        
        .footer-line2 {
            font-size: 10pt;
            color: #000;
        }
        
        /* PÁGINA 2 - PRONTUÁRIO */
        .prontuario-title {
            text-align: center;
            font-size: 16pt;
            font-weight: bold;
            padding: 15px;
            border-bottom: 2px solid #000;
            border-top: 2px solid #000;
            background: white;
        }
        
        .patient-info {
            border: 2px solid #000;
            margin: 15px 25px 15px 25px;
        }
        
        .patient-row {
            padding: 8px 15px;
            border-bottom: 1px solid #000;
            font-size: 12pt;
            line-height: 1.3;
        }
        
        .patient-row:last-child {
            border-bottom: none;
        }
        
        .patient-row strong {
            font-weight: bold;
        }
        
        .observacoes-box {
            border: 2px solid #000;
            margin: 15px 25px;
            min-height: 120px;
        }
        
        .observacoes-header {
            padding: 10px 15px;
            border-bottom: 2px solid #000;
            font-weight: bold;
            font-size: 12pt;
        }
        
        .observacoes-content {
            padding: 12px;
            min-height: 100px;
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .page {
                margin: 0;
                box-shadow: none;
                page-break-after: always !important;
                min-height: 297mm;
                height: 297mm;
            }
            .page:last-child {
                page-break-after: auto;
            }
            @page {
                size: A4;
                margin: 10mm;
            }
        }
    </style>
</head>
<body>
    <!-- PÁGINA 1 -->
    <div class="page">
        <!-- CABEÇALHO -->
        <div class="header">
            <img src="{logo_base64}" class="header-logo" alt="Logo NOVA" />
            <div class="header-text">
                <div class="header-title">NOVA | Medicina e Segurança do Trabalho.</div>
                <div class="header-subtitle">Exames: Admissionais, Demissionais, Periódicos e Outros.</div>
            </div>
        </div>
        
        <!-- TÍTULO -->
        <div class="declaration-title">DECLARAÇÃO</div>
        
        <!-- CONTEÚDO PRINCIPAL -->
        <div class="main-content" style="flex: 1 0 auto;">
            <div class="main-text">
                Declaro que o Sr. (A) <strong>{nome_paciente}</strong> de <strong>{documento_paciente_formatado}</strong>. 
                Compareceu a esta clínica com objetivo de submeter-se a avaliação médica administrativa em virtude do 
                atestado médico data do <strong>{data_atestado}</strong> em que foi sugerido afastamento pelo período de 
                <strong>{qtd_dias_atestado} dia(s)</strong> com CID: <strong>{codigo_cid}</strong> emitido (a) pelo (a) 
                Dr. (a) <strong>{nome_medico} {crm_medico}-{uf_crm_medico}</strong>.
            </div>
            
            <!-- CAIXA DE DECISÃO -->
            <div class="decision-box">
                <div class="decision-header">
                    <div class="decision-title">APÓS AVALIAÇÃO CLÍNICA, FOI DECIDIDO:</div>
                    <div class="decision-options">
                        <div class="decision-option">
                            <div class="checkbox"></div>
                            <span>Afastamento Total:</span>
                        </div>
                        <div class="decision-option">
                            <div class="checkbox"></div>
                            <span>Afastamento parcial pelo período de:</span>
                        </div>
                        <div class="decision-option">
                            <div class="checkbox"></div>
                            <span>Negada licença médica por motivo de doença:</span>
                        </div>
                    </div>
                </div>
                <div class="decision-footer">
                    Caso o paciente não se sinta apto para retornar ao trabalho, deverá retornar ao médico assistente para uma nova avaliação.
                </div>
            </div>
            
            <!-- ASSINATURA -->
            <div class="signature-section">
                <div class="signature-line">
                    <div class="signature-label">Médico do trabalho / Examinador</div>
                </div>
                <div class="signature-date">Brasília, {data_atual}</div>
            </div>
        </div>
        
        <!-- RODAPÉ -->
        <div class="footer">
            <div class="footer-line1">NOVA MEDICINA E SEGURANÇA DO TRABALHO LTDA.</div>
            <div class="footer-line2">SDS, Bloco D, Ed. Eldorado, Entrada B, 1.º Subsolo - Sala 01 CEP 70.392.901 Brasília–DF.</div>
        </div>
    </div>
    
    <!-- PÁGINA 2 - PRONTUÁRIO -->
    <div class="page">
        <!-- CABEÇALHO (repetido) -->
        <div class="header">
            <img src="{logo_base64}" class="header-logo" alt="Logo NOVA" />
            <div class="header-text">
                <div class="header-title">NOVA | Medicina e Segurança do Trabalho.</div>
                <div class="header-subtitle">Exames: Admissionais, Demissionais, Periódicos e Outros.</div>
            </div>
        </div>
        
        <!-- TÍTULO PRONTUÁRIO -->
        <div class="prontuario-title">PRONTUÁRIO DE PERÍCIA MÉDICA</div>
        
        <!-- INFORMAÇÕES DO PACIENTE -->
        <div class="patient-info">
            <div class="patient-row">
                <strong>NOME:</strong> {nome_paciente}
            </div>
            <div class="patient-row">
                <strong>EMPRESA:</strong> {empresa_paciente}
            </div>
            <div class="patient-row">
                <strong>CARGO:</strong> {cargo_paciente}
            </div>
            <div class="patient-row">
                <strong>CID10:</strong> {codigo_cid}
            </div>
            <div class="patient-row">
                <strong>DATA DO ATESTADO:</strong> {data_atestado} | <strong>Nº DE DIAS DE AFASTAMENTO:</strong> {qtd_dias_atestado}
            </div>
            <div class="patient-row">
                <strong>IDENTIFICAÇÃO DO PROFISSIONAL DE SAÚDE QUE FORNECEU O ATESTADO:</strong><br>
                Dr. (a) {nome_medico} {crm_medico}-{uf_crm_medico}
            </div>
        </div>
        
        <!-- OBSERVAÇÕES MÉDICAS -->
        <div class="observacoes-box">
            <div class="observacoes-header">
                OBSERVAÇÕES / ANOTAÇÕES DO MÉDICO EXAMINADOR:
            </div>
            <div class="observacoes-content">
                <!-- Espaço para anotações -->
            </div>
        </div>
        
        <!-- CAIXA DE DECISÃO (repetida) -->
        <div class="decision-box" style="margin: 20px 25px;">
            <div class="decision-header">
                <div class="decision-title">APÓS AVALIAÇÃO CLÍNICA, FOI DECIDIDO:</div>
                <div class="decision-options">
                    <div class="decision-option">
                        <div class="checkbox"></div>
                        <span>Afastamento Total:</span>
                    </div>
                    <div class="decision-option">
                        <div class="checkbox"></div>
                        <span>Afastamento parcial pelo período de:</span>
                    </div>
                    <div class="decision-option">
                        <div class="checkbox"></div>
                        <span>Negada licença médica por motivo de doença:</span>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- ASSINATURA -->
        <div class="signature-section">
            <div class="signature-line">
                <div class="signature-label">Médico do trabalho / Examinador</div>
            </div>
            <div class="signature-date">Brasília, {data_atual}</div>
        </div>
        
        <!-- RODAPÉ -->
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
            with open(logo_path, 'rb') as f:
                img_data = base64.b64encode(f.read()).decode('utf-8')
            return f'data:image/png;base64,{img_data}'
    except Exception as e:
        logger.warning(f"⚠️ Erro ao carregar logo: {e}")
    return ''


def generate_html(data: Dict[str, Any], logo_left: Optional[str] = None, 
                  logo_right: Optional[str] = None) -> str:
    """
    Gera documento HTML completo a partir dos dados fornecidos
    
    Args:
        data: Dicionário contendo todos os dados do atestado médico
        
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
        crm_numero = str(data.get('crm_medico', '')).strip()
        uf_crm = str(data.get('uf_crm_medico', '')).strip()
        
        # Formatar registro profissional: "CRM 12345" ou apenas número se tipo não informado
        crm_formatado = f"{tipo_registro} {crm_numero}" if tipo_registro else crm_numero
        
        # SEMPRE usa a data atual do sistema para assinatura
        data_atual_sistema = datetime.now()
        replacements = {
            '{logo_base64}': logo_base64,
            '{nome_paciente}': str(data.get('nome_paciente', '')).strip(),
            '{documento_paciente_formatado}': f"{data.get('tipo_doc_paciente', '').upper()} nº: {data.get('numero_doc_paciente', '')}",
            '{data_atestado}': _format_date_brazil(data.get('data_atestado', '')),
            '{data_atual}': _format_date_brazil(data_atual_sistema),
            '___/___/____': _format_date_brazil(data_atual_sistema),
            '{qtd_dias_atestado}': str(data.get('qtd_dias_atestado', '')),
            '{codigo_cid}': str(data.get('codigo_cid', '')).strip(),
            '{cargo_paciente}': str(data.get('cargo_paciente', '')).strip(),
            '{empresa_paciente}': str(data.get('empresa_paciente', '')).strip(),
            '{nome_medico}': nome_medico_completo,
            '{crm_medico}': crm_formatado,
            '{uf_crm_medico}': uf_crm,
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


def _get_base_styles() -> str:
    """CSS base compartilhado entre todos os templates de atestado"""
    return """
        @page { size: A4; margin: 10mm 10mm 2mm 10mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 11pt; line-height: 1.4; color: #000;
            background: #f5f5f5; padding: 20px;
        }
        .page {
            width: 210mm; min-height: 297mm; height: 297mm;
            margin: 0 auto 20px auto; background: white;
            border: 2px solid #000; padding: 0;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            position: relative; display: flex; flex-direction: column;
        }
        .header {
            display: flex; align-items: center;
            padding: 15px 20px; gap: 15px;
            border-bottom: 2px solid #000;
        }
        .header-logo { width: 80px; height: 80px; flex-shrink: 0; margin-left: 70px; }
        .header-text { flex: 1; text-align: center; }
        .header-title { font-size: 16pt; font-weight: bold; color: #000; margin-bottom: 2px; }
        .header-subtitle { font-size: 12pt; color: #000; }
        .doc-title {
            text-align: center; font-size: 18pt; font-weight: bold;
            padding: 15px; border-bottom: 2px solid #000; background: white;
        }
        .main-content { padding: 20px 25px; flex: 1 0 auto; }
        .main-text { text-align: justify; font-size: 13pt; line-height: 1.8; margin-bottom: 25px; }
        .info-table { border: 2px solid #000; margin: 15px 0; width: 100%; }
        .info-row {
            padding: 8px 15px; border-bottom: 1px solid #000;
            font-size: 12pt; line-height: 1.3;
        }
        .info-row:last-child { border-bottom: none; }
        .info-row strong { font-weight: bold; }
        .signature-section {
            margin-top: 60px; margin-bottom: 80px;
            text-align: center; padding: 0 25px;
        }
        .signature-line {
            width: 450px; margin: 0 auto;
            border-top: 1px solid #000; padding-top: 8px;
        }
        .signature-label { font-size: 12pt; font-weight: normal; margin-top: 5px; }
        .signature-date { margin-top: 25px; font-size: 13pt; font-weight: bold; }
        .footer {
            text-align: center; padding: 0; background: white;
            min-height: 35px; display: flex; flex-direction: column;
            justify-content: center;
        }
        .footer-line1 { font-size: 11pt; font-weight: bold; color: #000; margin-bottom: 3px; }
        .footer-line2 { font-size: 10pt; color: #000; }
        .checkbox {
            width: 14px; height: 14px; border: 2px solid #000;
            background: white; flex-shrink: 0; display: inline-block;
            vertical-align: middle; margin-right: 8px;
        }
        @media print {
            body { background: white; padding: 0; }
            .page {
                margin: 0; box-shadow: none;
                page-break-after: always !important;
                min-height: 297mm; height: 297mm;
            }
            .page:last-child { page-break-after: auto; }
            @page { size: A4; margin: 10mm; }
        }
    """


def get_vigilante_template() -> str:
    """Template HTML para Atestado Vigilante"""
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Atestado de Capacidade - Vigilante</title>
    <style>{_get_base_styles()}</style>
</head>
<body>
    <div class="page">
        <div class="header">
            <img src="{{logo_base64}}" class="header-logo" alt="Logo NOVA" />
            <div class="header-text">
                <div class="header-title">NOVA | Medicina e Segurança do Trabalho.</div>
                <div class="header-subtitle">Exames: Admissionais, Demissionais, Periódicos e Outros.</div>
            </div>
        </div>
        
        <div class="doc-title">ATESTADO DE SAÚDE - VIGILANTE</div>
        
        <div class="main-content">
            <div class="main-text">
                Declaro para os devidos fins que o(a) Sr(a). <strong>{{nome_paciente}}</strong>,
                portador(a) do <strong>{{documento_paciente_formatado}}</strong>,
                ocupante do cargo de <strong>{{cargo_paciente}}</strong> na empresa
                <strong>{{empresa_paciente}}</strong>, foi submetido(a) a exame médico
                em <strong>{{data_atestado}}</strong> e encontra-se em condições de saúde
                física e mental compatíveis com o exercício da atividade de
                <strong>VIGILANTE</strong>, conforme exigido pela Lei nº 7.102/83
                e Portaria nº 3.233/2012-DG/DPF.
            </div>
            
            <div class="info-table">
                <div class="info-row"><strong>NOME:</strong> {{nome_paciente}}</div>
                <div class="info-row"><strong>DOCUMENTO:</strong> {{documento_paciente_formatado}}</div>
                <div class="info-row"><strong>EMPRESA:</strong> {{empresa_paciente}}</div>
                <div class="info-row"><strong>CARGO:</strong> {{cargo_paciente}}</div>
                <div class="info-row"><strong>CNV:</strong> {{cnv_registro}}</div>
                <div class="info-row"><strong>VALIDADE CNV:</strong> {{validade_cnv}}</div>
                <div class="info-row"><strong>DATA DO EXAME:</strong> {{data_atestado}}</div>
            </div>
            
            <div class="main-text" style="margin-top: 20px;">
                O(A) profissional acima identificado(a) apresenta aptidão para o exercício
                da atividade de vigilância, não possuindo impedimentos de saúde que contraindiquem
                o desempenho das funções inerentes ao cargo.
            </div>
            
            <div class="signature-section">
                <div class="signature-line">
                    <div class="signature-label">Médico do Trabalho / Examinador</div>
                </div>
                <div style="margin-top: 10px; font-size: 12pt;">
                    Dr(a). {{nome_medico}} — {{crm_medico}}-{{uf_crm_medico}}
                </div>
                <div class="signature-date">Brasília, {{data_atual}}</div>
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-line1">NOVA MEDICINA E SEGURANÇA DO TRABALHO LTDA.</div>
            <div class="footer-line2">SDS, Bloco D, Ed. Eldorado, Entrada B, 1.º Subsolo - Sala 01 CEP 70.392.901 Brasília–DF.</div>
        </div>
    </div>
</body>
</html>"""


def get_saude_template() -> str:
    """Template HTML para Atestado de Saúde Ocupacional (ASO)"""
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Atestado de Saúde Ocupacional</title>
    <style>{_get_base_styles()}</style>
</head>
<body>
    <div class="page">
        <div class="header">
            <img src="{{logo_base64}}" class="header-logo" alt="Logo NOVA" />
            <div class="header-text">
                <div class="header-title">NOVA | Medicina e Segurança do Trabalho.</div>
                <div class="header-subtitle">Exames: Admissionais, Demissionais, Periódicos e Outros.</div>
            </div>
        </div>
        
        <div class="doc-title">ATESTADO DE SAÚDE OCUPACIONAL – ASO</div>
        
        <div class="main-content">
            <div class="info-table">
                <div class="info-row"><strong>NOME DO TRABALHADOR:</strong> {{nome_paciente}}</div>
                <div class="info-row"><strong>DOCUMENTO:</strong> {{documento_paciente_formatado}}</div>
                <div class="info-row"><strong>EMPRESA:</strong> {{empresa_paciente}}</div>
                <div class="info-row"><strong>CARGO / FUNÇÃO:</strong> {{cargo_paciente}}</div>
                <div class="info-row"><strong>TIPO DE EXAME:</strong> {{tipo_exame}}</div>
                <div class="info-row"><strong>RISCO OCUPACIONAL:</strong> {{risco_ocupacional}}</div>
                <div class="info-row"><strong>DATA DO EXAME:</strong> {{data_atestado}}</div>
            </div>
            
            <div style="border: 2px solid #000; margin: 20px 0; padding: 15px;">
                <div style="font-weight: bold; font-size: 14pt; text-align: center; margin-bottom: 15px;">
                    RESULTADO DA AVALIAÇÃO CLÍNICA
                </div>
                <div style="font-size: 13pt; display: flex; flex-direction: column; gap: 10px;">
                    <div><span class="checkbox"></span> APTO para exercer a função</div>
                    <div><span class="checkbox"></span> INAPTO para exercer a função</div>
                    <div><span class="checkbox"></span> APTO COM RESTRIÇÕES (ver observações)</div>
                </div>
                <div style="margin-top: 15px; font-size: 12pt; font-weight: bold;">
                    Parecer: <span style="font-weight: normal;">{{aptidao}}</span>
                </div>
            </div>
            
            <div class="main-text">
                Atesto para os devidos fins que o(a) trabalhador(a) acima identificado(a)
                foi submetido(a) a exame médico de <strong>{{tipo_exame}}</strong>,
                conforme disposto na NR-7 (PCMSO), sendo considerado(a)
                <strong>{{aptidao}}</strong> para o exercício de suas funções.
            </div>
            
            <div class="signature-section">
                <div class="signature-line">
                    <div class="signature-label">Médico do Trabalho / Examinador</div>
                </div>
                <div style="margin-top: 10px; font-size: 12pt;">
                    Dr(a). {{nome_medico}} — {{crm_medico}}-{{uf_crm_medico}}
                </div>
                <div class="signature-date">Brasília, {{data_atual}}</div>
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-line1">NOVA MEDICINA E SEGURANÇA DO TRABALHO LTDA.</div>
            <div class="footer-line2">SDS, Bloco D, Ed. Eldorado, Entrada B, 1.º Subsolo - Sala 01 CEP 70.392.901 Brasília–DF.</div>
        </div>
    </div>
</body>
</html>"""


def get_atividades_fisicas_template() -> str:
    """Template HTML para Atestado de Aptidão para Atividades Físicas"""
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Atestado para Atividades Físicas</title>
    <style>{_get_base_styles()}</style>
</head>
<body>
    <div class="page">
        <div class="header">
            <img src="{{logo_base64}}" class="header-logo" alt="Logo NOVA" />
            <div class="header-text">
                <div class="header-title">NOVA | Medicina e Segurança do Trabalho.</div>
                <div class="header-subtitle">Exames: Admissionais, Demissionais, Periódicos e Outros.</div>
            </div>
        </div>
        
        <div class="doc-title">ATESTADO MÉDICO PARA ATIVIDADE FÍSICA</div>
        
        <div class="main-content">
            <div class="main-text">
                Atesto para os devidos fins que o(a) Sr(a). <strong>{{nome_paciente}}</strong>,
                portador(a) do <strong>{{documento_paciente_formatado}}</strong>,
                após avaliação clínica realizada em <strong>{{data_atestado}}</strong>,
                encontra-se em condições de saúde compatíveis com a prática de
                <strong>ATIVIDADES FÍSICAS</strong>.
            </div>
            
            <div class="info-table">
                <div class="info-row"><strong>NOME:</strong> {{nome_paciente}}</div>
                <div class="info-row"><strong>DOCUMENTO:</strong> {{documento_paciente_formatado}}</div>
                <div class="info-row"><strong>EMPRESA:</strong> {{empresa_paciente}}</div>
                <div class="info-row"><strong>CARGO:</strong> {{cargo_paciente}}</div>
                <div class="info-row"><strong>DATA DO EXAME:</strong> {{data_atestado}}</div>
                <div class="info-row"><strong>ATIVIDADE FÍSICA:</strong> {{tipo_atividade}}</div>
                <div class="info-row"><strong>VALIDADE:</strong> {{validade_atestado}}</div>
            </div>
            
            <div style="border: 2px solid #000; margin: 20px 0;">
                <div style="padding: 10px 15px; border-bottom: 2px solid #000; font-weight: bold; font-size: 12pt;">
                    RESTRIÇÕES / OBSERVAÇÕES MÉDICAS:
                </div>
                <div style="padding: 15px; min-height: 100px; font-size: 12pt;">
                    {{restricoes}}
                </div>
            </div>
            
            <div class="main-text">
                Este atestado é emitido com base em avaliação clínica e não substitui
                avaliação de aptidão cardiológica específica, quando recomendada.
                O(A) paciente está liberado(a) para a prática da modalidade indicada,
                respeitadas as restrições acima mencionadas, se houver.
            </div>
            
            <div class="signature-section">
                <div class="signature-line">
                    <div class="signature-label">Médico do Trabalho / Examinador</div>
                </div>
                <div style="margin-top: 10px; font-size: 12pt;">
                    Dr(a). {{nome_medico}} — {{crm_medico}}-{{uf_crm_medico}}
                </div>
                <div class="signature-date">Brasília, {{data_atual}}</div>
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-line1">NOVA MEDICINA E SEGURANÇA DO TRABALHO LTDA.</div>
            <div class="footer-line2">SDS, Bloco D, Ed. Eldorado, Entrada B, 1.º Subsolo - Sala 01 CEP 70.392.901 Brasília–DF.</div>
        </div>
    </div>
</body>
</html>"""


def _apply_replacements(template: str, data: Dict[str, Any], extra_replacements: Optional[Dict[str, str]] = None) -> str:
    """Aplica substituições comuns a qualquer template"""
    logo_base64 = get_logo_base64()
    nome_medico = str(data.get('nome_medico', '')).strip()
    tipo_registro = str(data.get('tipo_registro_medico', '')).strip()
    crm_numero = str(data.get('crm_medico', '')).strip()
    uf_crm = str(data.get('uf_crm_medico', '')).strip()
    crm_formatado = f"{tipo_registro} {crm_numero}" if tipo_registro else crm_numero
    data_atual_sistema = datetime.now()

    replacements = {
        '{logo_base64}': logo_base64,
        '{nome_paciente}': str(data.get('nome_paciente', '')).strip(),
        '{documento_paciente_formatado}': f"{data.get('tipo_doc_paciente', '').upper()} nº: {data.get('numero_doc_paciente', '')}",
        '{data_atestado}': _format_date_brazil(data.get('data_atestado', '')),
        '{data_atual}': _format_date_brazil(data_atual_sistema),
        '{cargo_paciente}': str(data.get('cargo_paciente', '')).strip(),
        '{empresa_paciente}': str(data.get('empresa_paciente', '')).strip(),
        '{nome_medico}': nome_medico,
        '{crm_medico}': crm_formatado,
        '{uf_crm_medico}': uf_crm,
    }

    if extra_replacements:
        replacements.update(extra_replacements)

    html = template
    for key, value in replacements.items():
        html = html.replace(key, value)
    return html


def generate_vigilante_html(data: Dict[str, Any]) -> str:
    """Gera HTML do Atestado Vigilante"""
    try:
        logger.info("📄 Gerando Atestado Vigilante HTML...")
        template = get_vigilante_template()
        html = _apply_replacements(template, data, {
            '{cnv_registro}': str(data.get('cnv_registro', '')).strip(),
            '{validade_cnv}': _format_date_brazil(data.get('validade_cnv', '')),
        })
        logger.info("✅ Atestado Vigilante HTML gerado!")
        return html
    except Exception as e:
        logger.error(f"❌ Erro ao gerar Atestado Vigilante: {e}", exc_info=True)
        raise HTMLGenerationError(f"Erro ao gerar Atestado Vigilante: {e}")


def generate_saude_html(data: Dict[str, Any]) -> str:
    """Gera HTML do Atestado de Saúde (ASO)"""
    try:
        logger.info("📄 Gerando ASO HTML...")
        template = get_saude_template()
        html = _apply_replacements(template, data, {
            '{tipo_exame}': str(data.get('tipo_exame', 'Admissional')).strip(),
            '{risco_ocupacional}': str(data.get('risco_ocupacional', '')).strip() or 'Não especificado',
            '{aptidao}': str(data.get('aptidao', 'Apto')).strip(),
        })
        logger.info("✅ ASO HTML gerado!")
        return html
    except Exception as e:
        logger.error(f"❌ Erro ao gerar ASO: {e}", exc_info=True)
        raise HTMLGenerationError(f"Erro ao gerar ASO: {e}")


def generate_atividades_html(data: Dict[str, Any]) -> str:
    """Gera HTML do Atestado para Atividades Físicas"""
    try:
        logger.info("📄 Gerando Atestado Atividades Físicas HTML...")
        template = get_atividades_fisicas_template()
        html = _apply_replacements(template, data, {
            '{tipo_atividade}': str(data.get('tipo_atividade', '')).strip() or 'Atividades físicas em geral',
            '{restricoes}': str(data.get('restricoes', '')).strip() or 'Nenhuma restrição relatada.',
            '{validade_atestado}': _format_date_brazil(data.get('validade', '')) or '1 ano a partir da data do exame',
        })
        logger.info("✅ Atestado Atividades Físicas HTML gerado!")
        return html
    except Exception as e:
        logger.error(f"❌ Erro ao gerar Atestado Atividades Físicas: {e}", exc_info=True)
        raise HTMLGenerationError(f"Erro ao gerar Atestado Atividades Físicas: {e}")


if __name__ == '__main__':
    print("🧪 Testando geração de HTML...")
    
    test_data = {
        'nome_paciente': 'KAUAN KELVIN SANTOS BARBOSA',
        'tipo_doc_paciente': 'CPF',
        'numero_doc_paciente': '714.237.091-28',
        'data_atestado': '09/11/2025',
        'qtd_dias_atestado': '1',
        'codigo_cid': 'Não Informado',
        'cargo_paciente': 'Desenvolvedor de Sistemas',
        'empresa_paciente': 'Tech Solutions LTDA',
        'nome_medico': 'SAVIO RIBEIRO DA CRUZ',
        'tipo_registro_medico': 'CRM',
        'crm_medico': '25621',
        'uf_crm_medico': 'DF',
    }

    try:
        output = generate_and_save_html(
            test_data,
            output_path=Path(__file__).parent.parent / 'data' / 'generated_documents' / 'TESTE_NOVO_TEMPLATE.html'
        )
        print(f"✅ HTML de teste gerado: {output}")
    except Exception as e:
        print(f"❌ Erro: {e}")