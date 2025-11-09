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
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.5;
            color: #000;
            background: #ffffff;
            padding: 20px; /* Restaura padding do body */
            margin: 0;
        }
        
        .page {
            width: 100%;
            max-width: 210mm;
            min-height: 297mm; /* Altura exata A4 - força rodapé ao final */
            margin: 0 auto 20px auto;
            padding: 15mm 18mm 15mm 18mm; /* Margem normal nos cantos */
            background: white;
            position: relative;
            border: 3px solid #000; /* BORDA SIMPLES PRETA ao redor de TUDO */
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
        }
        
        .page-content {
            flex: 1; /* Preenche espaço disponível */
            display: flex;
            flex-direction: column;
        }
        
        /* ========== CABEÇALHO ========== */
        .header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 15px; /* AUMENTADO de 8px para 15px - mais espaço antes da DECLARAÇÃO */
            padding-bottom: 10px; /* AUMENTADO de 6px para 10px */
            border-bottom: 1px solid #000;
        }
        
        /* ========== LOGO ========== */
        .header-logo {
            width: 70px; /* Reduzido de 80px */
            height: 70px;
            flex-shrink: 0;
            object-fit: contain;
        }
        
        .header-text {
            flex: 1;
            text-align: center;
            font-family: 'Times New Roman', Times, serif;
        }
        
        .header-title {
            font-size: 18pt; /* AUMENTADO de 13pt para 18pt */
            font-weight: bold;
            color: #003366;
            margin-bottom: 3px;
            font-family: 'Times New Roman', Times, serif;
        }
        
        .header-subtitle {
            font-size: 11pt;
            color: #003366;
            font-family: 'Times New Roman', Times, serif;
        }
        
        /* ========== RODAPÉ ========== */
        .footer {
            margin-top: auto;
            padding-top: 8px; /* Reduzido */
            padding-bottom: 6px; /* Reduzido */
            border-top: none;
            text-align: center;
            font-family: 'Times New Roman', Times, serif;
            font-size: 9pt; /* Reduzido de 10pt */
            color: #00a651;
            flex-shrink: 0;
        }
        
        .footer-line1 {
            font-weight: bold;
            margin-bottom: 2px;
        }
        
        .footer-line2 {
            font-size: 9pt; /* Reduzido de 10pt */
        }
        
        /* ========== ASSINATURA ========== */
        .signature-section {
            margin-top: 30px; /* Reduzido */
            margin-bottom: 10px; /* Reduzido */
            text-align: center;
        }
        
        .signature-line {
            display: inline-block;
            width: 350px; /* Reduzido de 400px */
            border-top: 1px solid #000;
            margin-bottom: 5px;
        }
        
        .signature-label {
            font-weight: bold;
            font-size: 10pt; /* Reduzido de 11pt */
            margin-top: 5px;
            font-family: 'Times New Roman', Times, serif;
        }
        
        .date-line {
            font-weight: bold;
            margin-top: 15px; /* Reduzido de 20px */
            font-size: 10pt; /* Reduzido de 11pt */
            font-family: 'Times New Roman', Times, serif;
        }
        
        /* ========== TABELA TÍTULO ========== */
        .title-table {
            width: 100%;
            border: 3px double #000;
            border-collapse: collapse;
            margin-bottom: 5px; /* Menor espaço abaixo da tabela */
        }
        
        .title-table td {
            padding: 8px; /* AUMENTADO de 6px para 8px */
            text-align: center;
            font-size: 13pt;
            font-weight: bold;
            background: #fff;
            font-family: 'Times New Roman', Times, serif;
        }
        
        /* ========== TEXTO PRINCIPAL ========== */
        .main-text {
            text-align: justify;
            font-size: 12pt; /* AUMENTADO de 11pt para 12pt */
            margin-top: 15px; /* ESPAÇAMENTO maior entre DECLARAÇÃO e texto */
            margin-bottom: 15px;
            line-height: 1.6; /* AUMENTADO de 1.5 para 1.6 */
            padding: 0;
            background: #ffffff;
            font-family: 'Times New Roman', Times, serif;
        }
        
        /* ========== CAIXA DE DECISÃO ========== */
        .decision-box {
            width: 100%;
            border: 2px solid #000;
            border-collapse: collapse;
            margin: 8px 0; /* Reduzido */
            background: #fff;
            color: #000;
        }
        
        .decision-box td {
            padding: 8px; /* Reduzido */
            border: 1px solid #000;
            font-family: 'Times New Roman', Times, serif;
        }
        
        .decision-title {
            font-weight: bold;
            text-align: left;
            margin-bottom: 6px;
            font-size: 11pt; /* AUMENTADO de 10pt para 11pt */
            font-family: 'Times New Roman', Times, serif;
        }
        
        .decision-options {
            line-height: 1.5;
            font-size: 11pt; /* AUMENTADO de 10pt para 11pt */
            font-family: 'Times New Roman', Times, serif;
        }
        
        .checkbox {
            display: inline-block;
            width: 12px; /* Reduzido de 14px */
            height: 12px;
            border: 2px solid #000;
            background: #fff;
            margin-right: 5px; /* Reduzido de 6px */
            vertical-align: middle;
        }
        
        .decision-note {
            font-size: 10pt; /* AUMENTADO de 9pt para 10pt */
            padding-top: 6px;
            border-top: 1px solid #000;
            text-align: center;
            font-family: 'Times New Roman', Times, serif;
        }
        
        /* ========== TABELA PRONTUÁRIO ========== */
        .prontuario-title {
            width: 100%;
            border: 3px double #000;
            border-collapse: collapse;
            margin-top: 8px; /* Reduzido de 10px */
            margin-bottom: 10px; /* Reduzido */
        }
        
        .prontuario-title td {
            padding: 6px; /* Reduzido de 8px */
            text-align: center;
            font-weight: bold;
            font-size: 13pt; /* Reduzido de 14pt */
            background: #fff;
            font-family: 'Times New Roman', Times, serif;
        }
        
        /* ========== TABELA PACIENTE ========== */
        .patient-table {
            width: 100%;
            border: 2px solid #000;
            border-collapse: collapse;
            margin-bottom: 10px; /* Reduzido */
            background: #fff;
            color: #000;
        }
        
        .patient-table td {
            padding: 8px; /* Reduzido de 10px */
            border: 1px solid #000;
            font-size: 10pt; /* Reduzido de 11pt */
            word-wrap: break-word;
            font-family: 'Times New Roman', Times, serif;
        }
        
        .patient-table strong {
            color: #000;
            font-family: 'Times New Roman', Times, serif;
        }
        
        /* ========== ÁREA DE OBSERVAÇÕES MÉDICAS ========== */
        .observacoes-medicas {
            width: 100%;
            border: 2px solid #000;
            border-collapse: collapse;
            margin-bottom: 10px;
            background: #fff;
            min-height: 100px; /* AUMENTADO para 100px - mais espaço para médico escrever */
        }
        
        .observacoes-medicas td {
            padding: 10px;
            border: 1px solid #000;
            font-family: 'Times New Roman', Times, serif;
            vertical-align: top;
        }
        
        .observacoes-title {
            font-weight: bold;
            font-size: 10pt; /* Reduzido */
            margin-bottom: 8px;
            font-family: 'Times New Roman', Times, serif;
        }
        
        .observacoes-content {
            min-height: 80px; /* AUMENTADO para 80px - área maior de escrita */
            border-top: 1px dotted #ccc;
            padding-top: 10px;
        }
        
        /* ========== PREENCHIMENTO VERTICAL (invisível) ========== */
        .vertical-spacer {
            flex: 1; /* Preenche espaço restante para empurrar rodapé ao final */
            min-height: 20px; /* Mínimo de 20px */
        }
        
        /* ========== ASSINATURA ========== */
        .signature-section {
            margin-top: 60px;
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
            font-family: 'Times New Roman', Times, serif;
        }
        
        .date-line {
            font-weight: bold;
            margin-top: 15px;
            font-size: 11pt;
            font-family: 'Times New Roman', Times, serif;
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
                background: #ffffff;
            }
            
            .page {
                box-shadow: 0 8px 30px rgba(0,0,0,0.2);
                max-width: 1000px; /* Limita largura em telas muito grandes */
            }
        }
        
        /* Impressão - Otimizado para A4 */
        @media print {
            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            
            @page {
                size: A4;
                margin: 0; /* Margem 0 permite que usuário ajuste no diálogo */
            }
            
            body {
                padding: 0;
                margin: 0;
                background: white;
            }
            
            .page {
                width: 100%;
                max-width: 100%; /* Permite escala ajustável */
                min-height: 297mm; /* Altura exata A4 */
                margin: 0;
                padding: 15mm 18mm 15mm 18mm; /* Margem normal */
                border: 3px solid #000; /* BORDA SIMPLES PRETA */
                box-shadow: none;
                box-sizing: border-box;
                position: relative;
                display: flex;
                flex-direction: column;
                page-break-inside: avoid;
            }
            
            .page:first-child {
                page-break-after: always;
            }
            
            .page:last-child {
                page-break-after: avoid !important;
            }
            
            .page-content {
                flex: 1;
            }
            
            .footer {
                margin-top: auto;
                padding-top: 10px;
                padding-bottom: 8px;
                border-top: none; /* Sem linha no rodapé */
                flex-shrink: 0;
                page-break-inside: avoid;
            }
            
            .header {
                border-bottom: 1px solid #000; /* Linha simples */
            }
            
            .header, .title-table, .decision-box, .signature-section {
                page-break-inside: avoid;
            }
            
            .main-text {
                page-break-inside: avoid;
            }
            
            .page-break {
                display: none !important;
                height: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                visibility: hidden !important;
            }
            
            /* Remover espaços em branco desnecessários */
            br:last-child {
                display: none;
            }
        }
    </style>
    <script>
        // Script para remover páginas vazias ao carregar
        window.addEventListener('DOMContentLoaded', function() {
            // Remover elementos .page-break vazios
            const pageBreaks = document.querySelectorAll('.page-break');
            pageBreaks.forEach(pb => {
                if (!pb.textContent.trim()) {
                    pb.style.display = 'none';
                    pb.style.height = '0';
                    pb.style.margin = '0';
                    pb.style.padding = '0';
                }
            });
            
            // Verificar se há páginas vazias
            const pages = document.querySelectorAll('.page');
            pages.forEach(page => {
                const content = page.textContent.trim();
                if (content.length < 50) { // Página muito vazia
                    page.style.display = 'none';
                }
            });
            
            // Abrir automaticamente o diálogo de impressão após carregar
            setTimeout(function() {
                window.print();
            }, 500); // Aguarda 500ms para garantir que tudo foi carregado
        });
        
        // Ajustar altura das páginas antes de imprimir
        window.addEventListener('beforeprint', function() {
            const pages = document.querySelectorAll('.page');
            pages.forEach(page => {
                const footer = page.querySelector('.footer');
                if (footer) {
                    footer.style.marginTop = 'auto';
                }
            });
        });
    </script>
</head>
<body>
    <!-- PÁGINA 1 -->
    <div class="page">
        <div class="page-content">
        
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
            <div class="signature-line"></div>
            <div class="signature-label">Médico do trabalho / Examinador</div>
            <div class="date-line">Brasília, ___/___/____</div>
        </div>
        
        <!-- Preenchimento vertical invisível (empurra rodapé para o final) -->
        <div class="vertical-spacer"></div>
        
        </div> <!-- Fim page-content -->
        
        <!-- RODAPÉ -->
        <div class="footer">
            <div class="footer-line1">NOVA MEDICINA E SEGURANÇA DO TRABALHO LTDA.</div>
            <div class="footer-line2">SDS, Bloco D, Ed. Eldorado, Entrada B, 1.º Subsolo - Sala 01 CEP 70.392.901 Brasília–DF.</div>
        </div>
    </div>
    
    <!-- PÁGINA 2 -->
    <div class="page">
        <div class="page-content">
        
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
        
        <!-- Área de Observações Médicas -->
        <table class="observacoes-medicas">
            <tr>
                <td>
                    <div class="observacoes-title">OBSERVAÇÕES / ANOTAÇÕES DO MÉDICO EXAMINADOR:</div>
                    <div class="observacoes-content">
                        <!-- Espaço em branco para o médico escrever -->
                    </div>
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
            <div class="signature-line"></div>
            <div class="signature-label">Médico do trabalho / Examinador</div>
            <div class="date-line">Brasília, ___/___/____</div>
        </div>
        
        <!-- Preenchimento vertical invisível (empurra rodapé para o final) -->
        <div class="vertical-spacer"></div>
        
        </div> <!-- Fim page-content -->
        
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
