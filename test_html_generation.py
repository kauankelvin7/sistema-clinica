#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Teste Rápido de Geração HTML
=============================
Testa a geração de documento HTML com fundo branco
"""

import sys
from pathlib import Path

# Adicionar diretório raiz ao path
sys.path.insert(0, str(Path(__file__).parent))

from core.unified_generator import generate_document_unified

def test_html_generation():
    """Teste de geração HTML"""
    
    print("=" * 60)
    print("  TESTE DE GERAÇÃO HTML COM FUNDO BRANCO")
    print("=" * 60)
    print()
    
    # Dados de teste
    data = {
        "paciente": {
            "nome": "João Silva Santos",
            "tipo_documento": "CPF",
            "numero_documento": "123.456.789-00",
            "cargo": "Analista de Sistemas",
            "empresa": "Tech Solutions Ltda"
        },
        "atestado": {
            "data_atestado": "09/11/2024",
            "dias_afastamento": 3,
            "cid": "J06.9",
            "cid_nao_informado": False
        },
        "medico": {
            "nome": "Dr. Carlos Eduardo Mendes",
            "tipo_registro": "CRM",
            "numero_registro": "12345",
            "uf_registro": "SP"
        }
    }
    
    print("📝 Gerando documento HTML...")
    print()
    
    try:
        # Gerar HTML
        resultado = generate_document_unified(data, output_format='html')
        
        caminho_html = resultado.get('html')
        
        if caminho_html:
            print("✅ HTML gerado com sucesso!")
            print(f"📄 Arquivo: {caminho_html}")
            print()
            
            # Verificar tamanho
            from pathlib import Path
            tamanho = Path(caminho_html).stat().st_size
            print(f"📊 Tamanho: {tamanho:,} bytes ({tamanho/1024:.1f} KB)")
            print()
            
            # Abrir no navegador
            import webbrowser
            webbrowser.open(f'file:///{caminho_html}')
            print("🌐 Documento aberto no navegador!")
            print()
            print("💡 Verifique:")
            print("   • Fundo branco (não cinza escuro)")
            print("   • Checkboxes pretos (visíveis para impressão)")
            print("   • Logo NOVA no cabeçalho")
            print("   • Rodapé verde")
            print()
            print("🖨️  Para imprimir como PDF: Ctrl+P → Salvar como PDF")
            
        else:
            print("❌ Erro: HTML não foi gerado")
            
    except Exception as e:
        print(f"❌ Erro ao gerar HTML: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_html_generation()
