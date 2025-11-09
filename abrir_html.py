"""
Script para abrir o HTML gerado no navegador padrão
"""

import webbrowser
import os
from pathlib import Path

# Procurar o HTML mais recente
docs_dir = Path('data/generated_documents')
html_files = list(docs_dir.glob('*.html'))

if html_files:
    # Pegar o mais recente
    latest_html = max(html_files, key=os.path.getmtime)
    
    print(f"📂 Abrindo documento no navegador...")
    print(f"📄 Arquivo: {latest_html.name}\n")
    
    # Abrir no navegador
    webbrowser.open(f'file:///{latest_html.absolute()}')
    
    print("✅ Documento aberto!")
    print(f"\n💡 Caminho completo: {latest_html.absolute()}")
else:
    print("❌ Nenhum documento HTML encontrado!")
    print("Execute primeiro: python test_document_generation.py")
