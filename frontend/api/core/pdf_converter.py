"""
Módulo de conversão de DOCX para PDF
Sistema de Homologação de Atestados Médicos
Autor: Kauan Kelvin
Data: 30/10/2025

Este módulo implementa:
- Conversão de documentos Word (.docx) para PDF
- Suporte para múltiplas estratégias (LibreOffice, docx2pdf)
- Tratamento robusto de erros
- Logging de operações
"""

import os
import logging
import subprocess
import platform
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

class PDFConversionError(Exception):
    """Exceção personalizada para erros de conversão PDF"""
    pass


def convert_docx_to_pdf_libreoffice(docx_path: str, output_dir: Optional[str] = None) -> str:
    """
    Converte DOCX para PDF usando LibreOffice headless.
    
    Args:
        docx_path: Caminho do arquivo DOCX de entrada
        output_dir: Diretório de saída (padrão: mesmo do arquivo de entrada)
        
    Returns:
        str: Caminho do arquivo PDF gerado
        
    Raises:
        PDFConversionError: Se houver erro na conversão
    """
    docx_path = Path(docx_path)
    if not docx_path.exists():
        raise PDFConversionError(f"Arquivo DOCX não encontrado: {docx_path}")
    
    if output_dir is None:
        output_dir = docx_path.parent
    else:
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
    
    # Caminho esperado do PDF
    pdf_path = output_dir / f"{docx_path.stem}.pdf"
    
    try:
        # Detectar comando do LibreOffice baseado no sistema operacional
        if platform.system() == "Windows":
            # Windows: procurar em locais comuns
            possible_paths = [
                r"C:\Program Files\LibreOffice\program\soffice.exe",
                r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
                os.path.expandvars(r"%ProgramFiles%\LibreOffice\program\soffice.exe"),
            ]
            libreoffice_cmd = None
            for path in possible_paths:
                if os.path.exists(path):
                    libreoffice_cmd = path
                    break
            
            if not libreoffice_cmd:
                # Tentar usar comando global
                libreoffice_cmd = "soffice"
        else:
            # Linux/Mac: usar comando padrão
            libreoffice_cmd = "libreoffice"
        
        # Comando para conversão headless
        cmd = [
            libreoffice_cmd,
            "--headless",
            "--convert-to", "pdf",
            "--outdir", str(output_dir),
            str(docx_path)
        ]
        
        logger.info(f"Executando conversão PDF: {' '.join(cmd)}")
        
        # Executar conversão
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=30,  # Timeout de 30 segundos
            check=True
        )
        
        logger.debug(f"Saída do LibreOffice: {result.stdout}")
        
        # Verificar se o PDF foi gerado
        if not pdf_path.exists():
            raise PDFConversionError(f"PDF não foi gerado em: {pdf_path}")
        
        logger.info(f"PDF gerado com sucesso: {pdf_path}")
        return str(pdf_path)
        
    except subprocess.TimeoutExpired:
        raise PDFConversionError("Timeout na conversão para PDF (>30s)")
    except subprocess.CalledProcessError as e:
        logger.error(f"Erro ao executar LibreOffice: {e.stderr}")
        raise PDFConversionError(f"Erro na conversão: {e.stderr}")
    except FileNotFoundError:
        raise PDFConversionError(
            "LibreOffice não encontrado. Instale com: apt-get install libreoffice (Linux) "
            "ou baixe de https://www.libreoffice.org/download/download/"
        )
    except Exception as e:
        logger.error(f"Erro inesperado na conversão PDF: {e}")
        raise PDFConversionError(f"Erro inesperado: {e}")


def convert_docx_to_pdf_docx2pdf(docx_path: str, output_dir: Optional[str] = None) -> str:
    """
    Converte DOCX para PDF usando biblioteca docx2pdf (somente Windows).
    
    Args:
        docx_path: Caminho do arquivo DOCX de entrada
        output_dir: Diretório de saída (padrão: mesmo do arquivo de entrada)
        
    Returns:
        str: Caminho do arquivo PDF gerado
        
    Raises:
        PDFConversionError: Se houver erro na conversão
    """
    try:
        from docx2pdf import convert
    except ImportError:
        raise PDFConversionError(
            "Biblioteca docx2pdf não instalada. Instale com: pip install docx2pdf"
        )
    
    docx_path = Path(docx_path)
    if not docx_path.exists():
        raise PDFConversionError(f"Arquivo DOCX não encontrado: {docx_path}")
    
    if output_dir is None:
        output_dir = docx_path.parent
    else:
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
    
    pdf_path = output_dir / f"{docx_path.stem}.pdf"
    
    try:
        logger.info(f"Convertendo DOCX para PDF usando docx2pdf: {docx_path} -> {pdf_path}")
        convert(str(docx_path), str(pdf_path))
        
        if not pdf_path.exists():
            raise PDFConversionError(f"PDF não foi gerado em: {pdf_path}")
        
        logger.info(f"PDF gerado com sucesso: {pdf_path}")
        return str(pdf_path)
        
    except Exception as e:
        logger.error(f"Erro ao converter com docx2pdf: {e}")
        raise PDFConversionError(f"Erro na conversão: {e}")


def convert_docx_to_pdf(docx_path: str, output_dir: Optional[str] = None) -> str:
    """
    Converte DOCX para PDF usando a melhor estratégia disponível.
    Tenta LibreOffice primeiro, depois docx2pdf (Windows).
    
    Args:
        docx_path: Caminho do arquivo DOCX de entrada
        output_dir: Diretório de saída (padrão: mesmo do arquivo de entrada)
        
    Returns:
        str: Caminho do arquivo PDF gerado
        
    Raises:
        PDFConversionError: Se nenhuma estratégia funcionar
    """
    errors = []
    
    # Estratégia 1: LibreOffice (funciona em todos os sistemas)
    try:
        return convert_docx_to_pdf_libreoffice(docx_path, output_dir)
    except PDFConversionError as e:
        logger.warning(f"LibreOffice falhou: {e}")
        errors.append(f"LibreOffice: {e}")
    
    # Estratégia 2: docx2pdf (somente Windows)
    if platform.system() == "Windows":
        try:
            return convert_docx_to_pdf_docx2pdf(docx_path, output_dir)
        except PDFConversionError as e:
            logger.warning(f"docx2pdf falhou: {e}")
            errors.append(f"docx2pdf: {e}")
    
    # Se todas as estratégias falharem
    error_msg = "Nenhum conversor PDF disponível. Erros:\n" + "\n".join(errors)
    raise PDFConversionError(error_msg)


if __name__ == '__main__':
    # Teste rápido
    import sys
    
    if len(sys.argv) < 2:
        print("Uso: python pdf_converter.py <arquivo.docx>")
        sys.exit(1)
    
    docx_file = sys.argv[1]
    try:
        pdf_file = convert_docx_to_pdf(docx_file)
        print(f"✅ PDF gerado: {pdf_file}")
    except PDFConversionError as e:
        print(f"❌ Erro: {e}")
        sys.exit(1)
