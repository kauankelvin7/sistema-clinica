"""
Módulo de conversão DOCX para PDF
Sistema de Homologação de Atestados Médicos
Autor: Kauan Kelvin
Data: 30/10/2025

Este módulo converte documentos DOCX para PDF mantendo a formatação original.
Prioriza docx2pdf (Windows COM) para preservação perfeita da formatação.
"""

import os
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

class PDFGenerationError(Exception):
    """Exceção personalizada para erros de geração de PDF"""
    pass


def convert_docx_to_pdf_com(docx_path: str) -> str:
    """
    Converte DOCX para PDF usando Word COM automation (Windows).
    Preserva TODA formatação original do documento.
    
    Args:
        docx_path: Caminho do arquivo DOCX
        
    Returns:
        str: Caminho do arquivo PDF gerado
        
    Raises:
        Exception: Se a conversão falhar
    """
    try:
        from docx2pdf import convert
        
        # Caminho do PDF (mesmo nome, extensão .pdf)
        pdf_path = str(Path(docx_path).with_suffix('.pdf'))
        
        # Converter usando Word COM (preserva 100% da formatação)
        logger.info(f"Convertendo DOCX para PDF via Word COM: {docx_path}")
        convert(docx_path, pdf_path)
        
        if not os.path.exists(pdf_path):
            raise PDFGenerationError("PDF não foi gerado corretamente")
        
        logger.info(f"✅ PDF gerado com sucesso via Word COM: {pdf_path}")
        return pdf_path
        
    except ImportError:
        logger.warning("Biblioteca docx2pdf não instalada")
        raise PDFGenerationError("docx2pdf não está instalado. Execute: pip install docx2pdf")
    except Exception as e:
        logger.error(f"Erro ao converter com docx2pdf: {e}")
        raise PDFGenerationError(f"Erro na conversão COM: {e}")


def convert_docx_to_pdf_libreoffice(docx_path: str) -> str:
    """
    Converte DOCX para PDF usando LibreOffice (multiplataforma).
    Boa preservação de formatação, funciona em Linux/Mac/Windows.
    
    Args:
        docx_path: Caminho do arquivo DOCX
        
    Returns:
        str: Caminho do arquivo PDF gerado
        
    Raises:
        Exception: Se a conversão falhar
    """
    try:
        import subprocess
        
        # Caminho do PDF (mesmo diretório do DOCX)
        pdf_path = str(Path(docx_path).with_suffix('.pdf'))
        output_dir = str(Path(docx_path).parent)
        
        # Tentar encontrar LibreOffice
        libreoffice_paths = [
            'libreoffice',  # Linux/Mac
            'soffice',      # Alternativa
            r'C:\Program Files\LibreOffice\program\soffice.exe',  # Windows padrão
            r'C:\Program Files (x86)\LibreOffice\program\soffice.exe',
        ]
        
        libreoffice_cmd = None
        for cmd in libreoffice_paths:
            try:
                result = subprocess.run([cmd, '--version'], 
                                       capture_output=True, 
                                       timeout=5)
                if result.returncode == 0:
                    libreoffice_cmd = cmd
                    logger.info(f"LibreOffice encontrado: {cmd}")
                    break
            except (FileNotFoundError, subprocess.TimeoutExpired):
                continue
        
        if not libreoffice_cmd:
            raise PDFGenerationError("LibreOffice não encontrado no sistema")
        
        # Converter para PDF
        logger.info(f"Convertendo DOCX para PDF via LibreOffice: {docx_path}")
        
        cmd = [
            libreoffice_cmd,
            '--headless',
            '--convert-to', 'pdf',
            '--outdir', output_dir,
            docx_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode != 0:
            raise PDFGenerationError(f"LibreOffice retornou erro: {result.stderr}")
        
        if not os.path.exists(pdf_path):
            raise PDFGenerationError("PDF não foi gerado pelo LibreOffice")
        
        logger.info(f"✅ PDF gerado com sucesso via LibreOffice: {pdf_path}")
        return pdf_path
        
    except subprocess.TimeoutExpired:
        raise PDFGenerationError("Timeout na conversão com LibreOffice")
    except Exception as e:
        logger.error(f"Erro ao converter com LibreOffice: {e}")
        raise PDFGenerationError(f"Erro na conversão LibreOffice: {e}")


def generate_pdf_direct(data: dict, output_dir: Optional[str] = None) -> str:
    """
    Gera PDF a partir dos dados do documento.
    
    Fluxo otimizado:
    1. Gera DOCX usando document_generator (mantém formatação do template)
    2. Converte DOCX → PDF preservando formatação
    
    Métodos de conversão (em ordem de prioridade):
    1. docx2pdf (Windows COM) - Preservação perfeita
    2. LibreOffice (multiplataforma) - Boa preservação
    
    Args:
        data: Dicionário com os dados do documento
        output_dir: Diretório de saída (opcional)
        
    Returns:
        str: Caminho do arquivo PDF gerado
        
    Raises:
        PDFGenerationError: Se houver erro na geração
    """
    try:
        from core.document_generator import generate_document
        
        # 1. Gerar DOCX primeiro (usa template formatado)
        logger.info("Gerando documento DOCX...")
        docx_path = generate_document(data)
        
        if not docx_path or not os.path.exists(docx_path):
            raise PDFGenerationError("Falha ao gerar documento Word")
        
        logger.info(f"✅ DOCX gerado: {docx_path}")
        
        # 2. Converter DOCX para PDF
        pdf_path = None
        conversion_errors = []
        
        # Tentar método 1: docx2pdf (Windows COM - melhor qualidade)
        try:
            logger.info("Tentando conversão via docx2pdf (Word COM)...")
            pdf_path = convert_docx_to_pdf_com(docx_path)
            logger.info("✅ Conversão bem-sucedida via docx2pdf")
            return pdf_path
        except Exception as e:
            error_msg = f"docx2pdf falhou: {e}"
            logger.warning(error_msg)
            conversion_errors.append(error_msg)
        
        # Tentar método 2: LibreOffice (multiplataforma)
        try:
            logger.info("Tentando conversão via LibreOffice...")
            pdf_path = convert_docx_to_pdf_libreoffice(docx_path)
            logger.info("✅ Conversão bem-sucedida via LibreOffice")
            return pdf_path
        except Exception as e:
            error_msg = f"LibreOffice falhou: {e}"
            logger.warning(error_msg)
            conversion_errors.append(error_msg)
        
        # Se nenhum método funcionou
        error_details = "; ".join(conversion_errors)
        raise PDFGenerationError(
            f"Não foi possível converter para PDF. Tentativas: {error_details}"
        )
        
    except PDFGenerationError:
        raise
    except Exception as e:
        logger.error(f"Erro ao gerar PDF: {e}", exc_info=True)
        raise PDFGenerationError(f"Erro inesperado ao gerar PDF: {e}")

