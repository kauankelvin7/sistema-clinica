"""
Script de Teste - Geração de Documentos
Sistema de Homologação de Atestados Médicos

Execute este script para testar a geração de documentos em diferentes formatos.
"""

import sys
import os
from pathlib import Path

# Adicionar diretório raiz ao path
sys.path.insert(0, str(Path(__file__).parent))

from core.unified_generator import generate_document_unified


def print_header(text):
    """Imprime cabeçalho formatado"""
    print("\n" + "="*60)
    print(f"  {text}")
    print("="*60)


def print_success(text):
    """Imprime mensagem de sucesso"""
    print(f"✅ {text}")


def print_error(text):
    """Imprime mensagem de erro"""
    print(f"❌ {text}")


def print_info(text):
    """Imprime informação"""
    print(f"ℹ️  {text}")


def get_test_data():
    """Retorna dados de teste"""
    return {
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


def test_pdf_generation():
    """Testa geração de PDF"""
    print_header("TESTE 1: Geração de PDF")
    
    try:
        data = get_test_data()
        print_info("Gerando PDF...")
        
        result = generate_document_unified(
            data,
            output_format='pdf',
            open_file=False  # Não abrir automaticamente
        )
        
        if 'pdf' in result:
            pdf_path = result['pdf']
            if os.path.exists(pdf_path):
                file_size = os.path.getsize(pdf_path)
                print_success(f"PDF gerado com sucesso!")
                print_info(f"Caminho: {pdf_path}")
                print_info(f"Tamanho: {file_size:,} bytes")
                return True
            else:
                print_error("Arquivo PDF não encontrado")
                return False
        else:
            print_error("PDF não foi retornado no resultado")
            return False
            
    except Exception as e:
        print_error(f"Erro ao gerar PDF: {e}")
        print_info("Verifique se tem um conversor PDF instalado:")
        print_info("  pip install weasyprint")
        return False


def test_docx_generation():
    """Testa geração de DOCX"""
    print_header("TESTE 2: Geração de DOCX")
    
    try:
        data = get_test_data()
        print_info("Gerando DOCX...")
        
        result = generate_document_unified(
            data,
            output_format='docx',
            open_file=False
        )
        
        if 'docx' in result:
            docx_path = result['docx']
            if os.path.exists(docx_path):
                file_size = os.path.getsize(docx_path)
                print_success(f"DOCX gerado com sucesso!")
                print_info(f"Caminho: {docx_path}")
                print_info(f"Tamanho: {file_size:,} bytes")
                return True
            else:
                print_error("Arquivo DOCX não encontrado")
                return False
        else:
            print_error("DOCX não foi retornado no resultado")
            return False
            
    except Exception as e:
        print_error(f"Erro ao gerar DOCX: {e}")
        print_info("Verifique se tem um conversor DOCX instalado:")
        print_info("  pip install htmldocx")
        return False


def test_html_generation():
    """Testa geração de HTML"""
    print_header("TESTE 3: Geração de HTML")
    
    try:
        data = get_test_data()
        print_info("Gerando HTML...")
        
        result = generate_document_unified(
            data,
            output_format='html',
            open_file=False
        )
        
        if 'html' in result:
            html_path = result['html']
            if os.path.exists(html_path):
                file_size = os.path.getsize(html_path)
                print_success(f"HTML gerado com sucesso!")
                print_info(f"Caminho: {html_path}")
                print_info(f"Tamanho: {file_size:,} bytes")
                print_info(f"Abra no navegador: file:///{html_path}")
                return True
            else:
                print_error("Arquivo HTML não encontrado")
                return False
        else:
            print_error("HTML não foi retornado no resultado")
            return False
            
    except Exception as e:
        print_error(f"Erro ao gerar HTML: {e}")
        return False


def test_all_formats():
    """Testa geração de todos os formatos"""
    print_header("TESTE 4: Geração de TODOS os Formatos")
    
    try:
        data = get_test_data()
        print_info("Gerando HTML, PDF e DOCX...")
        
        result = generate_document_unified(
            data,
            output_format='all',
            open_file=False
        )
        
        success_count = 0
        total_count = 3
        
        # Verificar HTML
        if 'html' in result and os.path.exists(result['html']):
            print_success(f"HTML: {result['html']}")
            success_count += 1
        else:
            print_error("HTML não gerado")
        
        # Verificar PDF
        if 'pdf' in result and os.path.exists(result['pdf']):
            print_success(f"PDF: {result['pdf']}")
            success_count += 1
        else:
            print_error("PDF não gerado")
        
        # Verificar DOCX
        if 'docx' in result and os.path.exists(result['docx']):
            print_success(f"DOCX: {result['docx']}")
            success_count += 1
        else:
            print_error("DOCX não gerado")
        
        print_info(f"Formatos gerados: {success_count}/{total_count}")
        return success_count == total_count
            
    except Exception as e:
        print_error(f"Erro ao gerar todos os formatos: {e}")
        return False


def main():
    """Função principal"""
    print_header("TESTE DE GERAÇÃO DE DOCUMENTOS")
    print_info("Sistema de Homologação de Atestados Médicos")
    print_info("Testando diferentes formatos de saída...\n")
    
    results = {
        'HTML': test_html_generation(),
        'PDF': test_pdf_generation(),
        'DOCX': test_docx_generation(),
        'ALL': test_all_formats(),
    }
    
    # Resumo
    print_header("RESUMO DOS TESTES")
    
    passed = sum(1 for r in results.values() if r)
    total = len(results)
    
    for test_name, passed_test in results.items():
        status = "✅ PASSOU" if passed_test else "❌ FALHOU"
        print(f"{test_name:12} {status}")
    
    print(f"\n{'='*60}")
    print(f"Total: {passed}/{total} testes passaram")
    print(f"{'='*60}\n")
    
    if passed == total:
        print_success("Todos os testes passaram! 🎉")
        print_info("O sistema está pronto para uso!")
    else:
        print_error(f"{total - passed} teste(s) falharam")
        print_info("Verifique as dependências instaladas:")
        print_info("  pip install weasyprint htmldocx python-docx beautifulsoup4")
    
    return passed == total


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
