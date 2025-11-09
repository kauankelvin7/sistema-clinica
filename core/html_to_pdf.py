"""
Módulo de conversão HTML para PDF
Sistema de Homologação de Atestados Médicos
Autor: Kauan Kelvin
Data: 09/11/2025

Este módulo implementa:
- Conversão RÁPIDA de HTML para PDF
- Preservação perfeita de formatação (CSS)
- Suporte para imagens base64
- Múltiplas estratégias de conversão
"""

import os
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


class PDFConversionError(Exception):
    """Exceção para erros de conversão PDF"""
    pass


def convert_html_to_pdf_weasyprint(html_content: str, output_path: str) -> str:
    """
    Converte HTML para PDF usando WeasyPrint
    
    Vantagens:
    - Excelente suporte CSS3
    - Imagens base64
    - Rápido e confiável
    - Multiplataforma
    
    Args:
        html_content: Conteúdo HTML
        output_path: Caminho do PDF de saída
        
    Returns:
        str: Caminho do PDF gerado
    """
    try:
        from weasyprint import HTML, CSS
        
        logger.info("Convertendo HTML para PDF com WeasyPrint...")
        
        # Garantir diretório de saída
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        
        # Converter
        HTML(string=html_content).write_pdf(output_path)
        
        if not os.path.exists(output_path):
            raise PDFConversionError("PDF não foi gerado")
        
        logger.info(f"✅ PDF gerado com WeasyPrint: {output_path}")
        return output_path
        
    except ImportError:
        raise PDFConversionError(
            "WeasyPrint não instalado. Instale com: pip install weasyprint"
        )
    except Exception as e:
        logger.error(f"Erro com WeasyPrint: {e}")
        raise PDFConversionError(f"Erro WeasyPrint: {e}")


def convert_html_to_pdf_pdfkit(html_content: str, output_path: str) -> str:
    """
    Converte HTML para PDF usando pdfkit (wkhtmltopdf wrapper)
    
    Requer wkhtmltopdf instalado no sistema
    
    Args:
        html_content: Conteúdo HTML
        output_path: Caminho do PDF de saída
        
    Returns:
        str: Caminho do PDF gerado
    """
    try:
        import pdfkit
        
        logger.info("Convertendo HTML para PDF com pdfkit...")
        
        # Garantir diretório de saída
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        
        # Opções para melhor qualidade
        options = {
            'page-size': 'A4',
            'margin-top': '20mm',
            'margin-right': '20mm',
            'margin-bottom': '20mm',
            'margin-left': '20mm',
            'encoding': 'UTF-8',
            'enable-local-file-access': None,
        }
        
        # Converter
        pdfkit.from_string(html_content, output_path, options=options)
        
        if not os.path.exists(output_path):
            raise PDFConversionError("PDF não foi gerado")
        
        logger.info(f"✅ PDF gerado com pdfkit: {output_path}")
        return output_path
        
    except ImportError:
        raise PDFConversionError(
            "pdfkit não instalado. Instale com: pip install pdfkit\n"
            "Também instale wkhtmltopdf: https://wkhtmltopdf.org/downloads.html"
        )
    except Exception as e:
        logger.error(f"Erro com pdfkit: {e}")
        raise PDFConversionError(f"Erro pdfkit: {e}")


def convert_html_to_pdf_xhtml2pdf(html_content: str, output_path: str) -> str:
    """
    Converte HTML para PDF usando xhtml2pdf (reportlab)
    
    Mais leve, mas suporte CSS limitado
    
    Args:
        html_content: Conteúdo HTML
        output_path: Caminho do PDF de saída
        
    Returns:
        str: Caminho do PDF gerado
    """
    try:
        from xhtml2pdf import pisa
        
        logger.info("Convertendo HTML para PDF com xhtml2pdf...")
        
        # Garantir diretório de saída
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        
        # Converter
        with open(output_path, 'wb') as pdf_file:
            pisa_status = pisa.CreatePDF(
                html_content.encode('utf-8'),
                dest=pdf_file,
                encoding='utf-8'
            )
        
        if pisa_status.err or not os.path.exists(output_path):
            raise PDFConversionError("Erro ao gerar PDF com xhtml2pdf")
        
        logger.info(f"✅ PDF gerado com xhtml2pdf: {output_path}")
        return output_path
        
    except ImportError:
        raise PDFConversionError(
            "xhtml2pdf não instalado. Instale com: pip install xhtml2pdf"
        )
    except Exception as e:
        logger.error(f"Erro com xhtml2pdf: {e}")
        raise PDFConversionError(f"Erro xhtml2pdf: {e}")


def convert_html_to_pdf(html_content: str, output_path: str, 
                        method: Optional[str] = None) -> str:
    """
    Converte HTML para PDF usando a melhor estratégia disponível
    
    Ordem de prioridade (se method não especificado):
    1. WeasyPrint (melhor qualidade CSS)
    2. pdfkit (boa qualidade, requer wkhtmltopdf)
    3. xhtml2pdf (mais leve, CSS limitado)
    
    Args:
        html_content: Conteúdo HTML
        output_path: Caminho do PDF de saída
        method: Método específico ('weasyprint', 'pdfkit', 'xhtml2pdf') ou None para auto
        
    Returns:
        str: Caminho do PDF gerado
        
    Raises:
        PDFConversionError: Se nenhum método funcionar
    """
    errors = []
    
    # Se método específico foi solicitado
    if method:
        method = method.lower()
        if method == 'weasyprint':
            return convert_html_to_pdf_weasyprint(html_content, output_path)
        elif method == 'pdfkit':
            return convert_html_to_pdf_pdfkit(html_content, output_path)
        elif method == 'xhtml2pdf':
            return convert_html_to_pdf_xhtml2pdf(html_content, output_path)
        else:
            raise PDFConversionError(f"Método inválido: {method}")
    
    # Tentar métodos na ordem de prioridade
    methods = [
        ('WeasyPrint', convert_html_to_pdf_weasyprint),
        ('pdfkit', convert_html_to_pdf_pdfkit),
        ('xhtml2pdf', convert_html_to_pdf_xhtml2pdf),
    ]
    
    for name, converter in methods:
        try:
            logger.info(f"Tentando conversão com {name}...")
            return converter(html_content, output_path)
        except PDFConversionError as e:
            error_msg = f"{name}: {e}"
            logger.warning(error_msg)
            errors.append(error_msg)
    
    # Se todos falharam
    error_details = "\n".join(errors)
    raise PDFConversionError(
        f"Nenhum conversor PDF disponível. Instale pelo menos um:\n"
        f"• WeasyPrint (recomendado): pip install weasyprint\n"
        f"• pdfkit: pip install pdfkit + wkhtmltopdf\n"
        f"• xhtml2pdf: pip install xhtml2pdf\n\n"
        f"Erros:\n{error_details}"
    )


def convert_html_file_to_pdf(html_path: str, output_path: Optional[str] = None,
                            method: Optional[str] = None) -> str:
    """
    Converte arquivo HTML para PDF
    
    Args:
        html_path: Caminho do arquivo HTML
        output_path: Caminho do PDF de saída (opcional, usa mesmo nome)
        method: Método de conversão (opcional)
        
    Returns:
        str: Caminho do PDF gerado
    """
    # Ler HTML
    with open(html_path, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    # Determinar caminho de saída
    if not output_path:
        output_path = str(Path(html_path).with_suffix('.pdf'))
    
    # Converter
    return convert_html_to_pdf(html_content, output_path, method)


if __name__ == '__main__':
    # Teste rápido
    import sys
    
    if len(sys.argv) < 2:
        print("Uso: python html_to_pdf.py <arquivo.html> [saida.pdf]")
        sys.exit(1)
    
    html_file = sys.argv[1]
    pdf_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    try:
        result = convert_html_file_to_pdf(html_file, pdf_file)
        print(f"✅ PDF gerado: {result}")
    except PDFConversionError as e:
        print(f"❌ Erro: {e}")
        sys.exit(1)
