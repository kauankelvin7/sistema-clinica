"""
Módulo UNIFICADO de geração de documentos
Sistema de Homologação de Atestados Médicos
Autor: Kauan Kelvin
Data: 09/11/2025

Este módulo implementa:
- Geração de documentos em HTML base
- Exportação para PDF (RÁPIDO!) ou DOCX
- Interface única e simplificada
- Mesma formatação visual para todos os formatos
"""

import os
import logging
from pathlib import Path
from typing import Dict, Any, Optional, Literal
from datetime import datetime

logger = logging.getLogger(__name__)

# Importar módulos de geração
try:
    from .html_generator import generate_html, save_html
    from .html_to_pdf import convert_html_to_pdf
    from .html_to_docx import convert_html_to_docx
    from .config import GENERATED_DOCS_DIR
except ImportError as e:
    logger.warning(f"Erro ao importar módulos: {e}")
    GENERATED_DOCS_DIR = Path('data/generated_documents')


class UnifiedDocumentError(Exception):
    """Exceção para erros no gerador unificado"""
    pass


def sanitizar_nome_arquivo(nome: str, max_length: int = 50) -> str:
    """Sanitiza nome de arquivo"""
    import re
    
    if not nome:
        return "Arquivo_Sem_Nome"
    
    nome_limpo = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '', nome)
    nome_limpo = '_'.join(nome_limpo.split())
    nome_limpo = nome_limpo.strip('.')
    
    if len(nome_limpo) > max_length:
        nome_limpo = nome_limpo[:max_length]
    
    if not nome_limpo:
        nome_limpo = "Arquivo_Sanitizado"
    
    return nome_limpo


def generate_document_unified(
    data: Dict[str, Any],
    output_format: Literal['html', 'pdf', 'docx', 'all'] = 'pdf',
    logo_left: Optional[str] = None,
    logo_right: Optional[str] = None,
    output_dir: Optional[str] = None,
    open_file: bool = True
) -> Dict[str, str]:
    """
    Gera documento em formato HTML, PDF ou DOCX
    
    FLUXO:
    1. Gera HTML base (rápido, com CSS inline)
    2. Converte para PDF ou DOCX conforme solicitado
    
    Args:
        data: Dicionário com dados do documento
        output_format: Formato de saída ('html', 'pdf', 'docx', 'all')
        logo_left: Caminho logo esquerda (opcional)
        logo_right: Caminho logo direita (opcional)
        output_dir: Diretório de saída (opcional)
        open_file: Abrir arquivo automaticamente (padrão: True)
        
    Returns:
        Dict com caminhos dos arquivos gerados:
        {
            'html': 'caminho/arquivo.html',  # se gerado
            'pdf': 'caminho/arquivo.pdf',    # se gerado
            'docx': 'caminho/arquivo.docx',  # se gerado
        }
        
    Raises:
        UnifiedDocumentError: Se houver erro na geração
        
    Examples:
        >>> # Gerar apenas PDF (padrão, RÁPIDO!)
        >>> result = generate_document_unified(data, output_format='pdf')
        >>> print(result['pdf'])  # caminho do PDF
        
        >>> # Gerar apenas DOCX
        >>> result = generate_document_unified(data, output_format='docx')
        
        >>> # Gerar todos os formatos
        >>> result = generate_document_unified(data, output_format='all')
        >>> print(result['html'], result['pdf'], result['docx'])
    """
    try:
        logger.info(f"Gerando documento no formato: {output_format}")
        
        # Validar formato
        valid_formats = ['html', 'pdf', 'docx', 'all']
        if output_format not in valid_formats:
            raise UnifiedDocumentError(
                f"Formato inválido '{output_format}'. Use: {', '.join(valid_formats)}"
            )
        
        # Preparar diretório de saída
        if not output_dir:
            output_dir = GENERATED_DOCS_DIR
        
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Gerar nome base do arquivo
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        nome_paciente_sanitizado = sanitizar_nome_arquivo(
            data.get('nome_paciente', 'Paciente'),
            max_length=30
        )
        base_filename = f"Declaracao_{nome_paciente_sanitizado}_{timestamp}"
        
        # Dicionário de resultados
        results = {}
        
        # PASSO 1: Gerar HTML base
        logger.info("📄 Gerando HTML base...")
        html_content = generate_html(data, logo_left, logo_right)
        
        # Se solicitou HTML ou ALL, salvar HTML
        if output_format in ['html', 'all']:
            html_path = output_dir / f"{base_filename}.html"
            with open(html_path, 'w', encoding='utf-8') as f:
                f.write(html_content)
            results['html'] = str(html_path)
            logger.info(f"✅ HTML salvo: {html_path}")
        
        # PASSO 2: Gerar PDF se solicitado
        if output_format in ['pdf', 'all']:
            try:
                logger.info("📄 Convertendo para PDF...")
                pdf_path = output_dir / f"{base_filename}.pdf"
                convert_html_to_pdf(html_content, str(pdf_path))
                results['pdf'] = str(pdf_path)
                logger.info(f"✅ PDF gerado: {pdf_path}")
                
                # Abrir PDF se solicitado
                if open_file and output_format == 'pdf':
                    _open_file(pdf_path)
                    
            except Exception as e:
                error_msg = f"Erro ao gerar PDF: {e}"
                logger.error(error_msg)
                if output_format == 'pdf':  # Se era só PDF, propagar erro
                    raise UnifiedDocumentError(error_msg)
        
        # PASSO 3: Gerar DOCX se solicitado
        if output_format in ['docx', 'all']:
            try:
                logger.info("📄 Convertendo para DOCX...")
                docx_path = output_dir / f"{base_filename}.docx"
                convert_html_to_docx(html_content, str(docx_path))
                results['docx'] = str(docx_path)
                logger.info(f"✅ DOCX gerado: {docx_path}")
                
                # Abrir DOCX se solicitado
                if open_file and output_format == 'docx':
                    _open_file(docx_path)
                    
            except Exception as e:
                error_msg = f"Erro ao gerar DOCX: {e}"
                logger.error(error_msg)
                if output_format == 'docx':  # Se era só DOCX, propagar erro
                    raise UnifiedDocumentError(error_msg)
        
        # Verificar se gerou algum arquivo
        if not results:
            raise UnifiedDocumentError("Nenhum arquivo foi gerado")
        
        logger.info(f"✅ Geração concluída! Arquivos: {list(results.keys())}")
        return results
        
    except UnifiedDocumentError:
        raise
    except Exception as e:
        logger.error(f"Erro inesperado ao gerar documento: {e}", exc_info=True)
        raise UnifiedDocumentError(f"Erro inesperado: {e}")


def _open_file(file_path: Path) -> bool:
    """Abre arquivo automaticamente com aplicativo padrão"""
    try:
        # Detectar ambiente de produção
        is_production = os.getenv('RENDER') or os.getenv('VERCEL') or os.getenv('RAILWAY')
        if is_production:
            return False
        
        import subprocess
        
        if os.name == 'nt':  # Windows
            os.startfile(str(file_path))
        elif os.uname().sysname == 'Darwin':  # macOS
            subprocess.Popen(['open', str(file_path)])
        else:  # Linux
            subprocess.Popen(['xdg-open', str(file_path)])
        
        logger.info(f"📂 Arquivo aberto: {file_path}")
        return True
    except Exception as e:
        logger.warning(f"Não foi possível abrir arquivo: {e}")
        return False


# Funções de compatibilidade com código legado
def generate_document(data: Dict[str, Any]) -> str:
    """
    Compatibilidade com código legado (gera DOCX)
    
    DEPRECADO: Use generate_document_unified() para mais opções
    """
    logger.warning("Usando função legada generate_document(). Use generate_document_unified()")
    results = generate_document_unified(data, output_format='docx')
    return results.get('docx', '')


def generate_pdf_document(data: Dict[str, Any]) -> str:
    """
    Gera documento PDF diretamente (RÁPIDO!)
    
    Args:
        data: Dados do documento
        
    Returns:
        str: Caminho do PDF gerado
    """
    results = generate_document_unified(data, output_format='pdf')
    return results.get('pdf', '')


# Alias amigável
gerar_documento = generate_document_unified


if __name__ == '__main__':
    # Teste completo
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
    
    print("🧪 Testando geração de documentos...\n")
    
    # Teste 1: PDF
    print("1️⃣ Gerando PDF...")
    try:
        result = generate_document_unified(test_data, output_format='pdf')
        print(f"✅ PDF: {result.get('pdf')}\n")
    except Exception as e:
        print(f"❌ Erro PDF: {e}\n")
    
    # Teste 2: DOCX
    print("2️⃣ Gerando DOCX...")
    try:
        result = generate_document_unified(test_data, output_format='docx')
        print(f"✅ DOCX: {result.get('docx')}\n")
    except Exception as e:
        print(f"❌ Erro DOCX: {e}\n")
    
    # Teste 3: TODOS
    print("3️⃣ Gerando TODOS os formatos...")
    try:
        result = generate_document_unified(test_data, output_format='all', open_file=False)
        print(f"✅ HTML: {result.get('html')}")
        print(f"✅ PDF: {result.get('pdf')}")
        print(f"✅ DOCX: {result.get('docx')}\n")
    except Exception as e:
        print(f"❌ Erro ALL: {e}\n")
    
    print("🎉 Testes concluídos!")
