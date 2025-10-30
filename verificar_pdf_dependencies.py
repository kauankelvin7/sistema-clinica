#!/usr/bin/env python3
"""
Script de verificação de dependências para conversão PDF
Sistema de Homologação v2.0
Autor: Kauan Kelvin
"""

import sys
import subprocess
import platform

def print_header(text):
    """Imprime cabeçalho formatado"""
    print("\n" + "="*60)
    print(f"  {text}")
    print("="*60)

def check_docx2pdf():
    """Verifica se docx2pdf está instalado"""
    print("\n📦 Verificando docx2pdf...")
    try:
        import docx2pdf
        print("✅ docx2pdf instalado com sucesso!")
        print(f"   Caminho: {docx2pdf.__file__}")
        return True
    except ImportError:
        print("❌ docx2pdf NÃO instalado")
        print("   Para instalar: pip install docx2pdf")
        return False

def check_libreoffice():
    """Verifica se LibreOffice está instalado"""
    print("\n📦 Verificando LibreOffice...")
    
    # Possíveis caminhos do LibreOffice
    commands = []
    
    if platform.system() == "Windows":
        commands = [
            r"C:\Program Files\LibreOffice\program\soffice.exe",
            r"C:\Program Files (x86)\LibreOffice\program\soffice.exe",
        ]
    else:
        commands = ["libreoffice", "soffice"]
    
    for cmd in commands:
        try:
            result = subprocess.run(
                [cmd, "--version"],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                version = result.stdout.strip().split('\n')[0]
                print(f"✅ LibreOffice encontrado: {cmd}")
                print(f"   {version}")
                return True
        except (FileNotFoundError, subprocess.TimeoutExpired):
            continue
    
    print("❌ LibreOffice NÃO encontrado")
    print("\n   Para instalar:")
    if platform.system() == "Windows":
        print("   - Baixe em: https://www.libreoffice.org/download/")
    elif platform.system() == "Linux":
        print("   - Ubuntu/Debian: sudo apt-get install libreoffice libreoffice-writer")
        print("   - CentOS/RHEL: sudo yum install libreoffice libreoffice-writer")
    elif platform.system() == "Darwin":
        print("   - macOS: brew install --cask libreoffice")
    
    return False

def check_python_docx():
    """Verifica python-docx"""
    print("\n📦 Verificando python-docx...")
    try:
        import docx
        print(f"✅ python-docx instalado: {docx.__version__}")
        return True
    except ImportError:
        print("❌ python-docx NÃO instalado")
        print("   Para instalar: pip install python-docx")
        return False

def main():
    print_header("🔍 Verificação de Dependências - Conversão PDF")
    
    print(f"\n🖥️  Sistema Operacional: {platform.system()} {platform.release()}")
    print(f"🐍 Python: {sys.version.split()[0]}")
    
    # Verificar dependências
    results = {
        "python-docx": check_python_docx(),
        "docx2pdf": check_docx2pdf(),
        "LibreOffice": check_libreoffice()
    }
    
    # Resumo
    print_header("📊 Resumo")
    
    for name, status in results.items():
        icon = "✅" if status else "❌"
        print(f"{icon} {name}")
    
    # Recomendações
    print("\n💡 Recomendações:")
    
    if platform.system() == "Windows":
        if results["docx2pdf"]:
            print("   ✅ Use docx2pdf (melhor qualidade no Windows)")
        else:
            print("   ⚠️  Instale docx2pdf para melhor qualidade")
    else:
        if results["LibreOffice"]:
            print("   ✅ Use LibreOffice (multiplataforma)")
        else:
            print("   ⚠️  Instale LibreOffice para conversão PDF")
    
    # Status final
    print("\n" + "="*60)
    if results["python-docx"] and (results["docx2pdf"] or results["LibreOffice"]):
        print("✅ Sistema pronto para gerar PDFs!")
    else:
        print("⚠️  Instale ao menos um método de conversão PDF")
        print("   (docx2pdf OU LibreOffice)")
    print("="*60 + "\n")

if __name__ == "__main__":
    main()
