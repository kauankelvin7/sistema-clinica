"""
Script Automatizado para Geração de Executável
Sistema de Homologação de Atestados Médicos
Autor: Kauan Kelvin
Data: 28/10/2025

Este script:
1. Verifica se PyInstaller está instalado
2. Limpa builds anteriores
3. Gera o executável com todas as configurações
4. Cria estrutura de pastas para distribuição
5. Copia arquivos necessários
"""

import os
import sys
import shutil
import subprocess
from pathlib import Path

# Cores para terminal (Windows)
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_header(text):
    """Imprime cabeçalho estilizado"""
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*70}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{text.center(70)}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*70}{Colors.ENDC}\n")

def print_step(step_num, total_steps, text):
    """Imprime passo da execução"""
    print(f"{Colors.OKCYAN}[{step_num}/{total_steps}]{Colors.ENDC} {text}")

def print_success(text):
    """Imprime mensagem de sucesso"""
    print(f"{Colors.OKGREEN}[OK] {text}{Colors.ENDC}")

def print_error(text):
    """Imprime mensagem de erro"""
    print(f"{Colors.FAIL}[X] {text}{Colors.ENDC}")

def print_warning(text):
    """Imprime mensagem de aviso"""
    print(f"{Colors.WARNING}[!] {text}{Colors.ENDC}")

def verificar_pyinstaller():
    """Verifica se PyInstaller está instalado"""
    try:
        import PyInstaller
        versao = PyInstaller.__version__
        print_success(f"PyInstaller {versao} encontrado")
        return True
    except ImportError:
        print_error("PyInstaller não está instalado")
        print(f"{Colors.WARNING}Instalando PyInstaller...{Colors.ENDC}")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller"])
            print_success("PyInstaller instalado com sucesso")
            return True
        except subprocess.CalledProcessError:
            print_error("Falha ao instalar PyInstaller")
            return False

def limpar_builds_anteriores():
    """Remove builds e distribuições anteriores"""
    diretorios_para_limpar = ['build', 'dist']
    arquivos_para_limpar = ['*.spec.bak']
    
    for diretorio in diretorios_para_limpar:
        if Path(diretorio).exists():
            print(f"Removendo diretório: {diretorio}")
            shutil.rmtree(diretorio, ignore_errors=True)
            print_success(f"Diretório {diretorio} removido")
    
    print_success("Limpeza concluída")

def verificar_arquivos_necessarios():
    """Verifica se todos os arquivos necessários existem"""
    arquivos_obrigatorios = {
        'main.py': 'Arquivo principal',
        'requirements.txt': 'Dependências',
        'core/config.py': 'Configurações',
        'core/database.py': 'Banco de dados',
        'core/document_generator.py': 'Gerador de documentos',
        'ui/main_window.py': 'Interface gráfica',
        'file_version_info.txt': 'Informações de versão (metadados)',
    }
    
    pastas_obrigatorias = {
        'assets': 'Recursos (ícones, imagens)',
        'models': 'Templates de documentos',
        'core': 'Módulos principais',
        'ui': 'Interface',
    }
    
    arquivos_importantes = {
        'assets/app_icon.ico': 'Ícone do aplicativo',
    }
    
    tudo_ok = True
    
    # Verificar arquivos obrigatórios
    for arquivo, descricao in arquivos_obrigatorios.items():
        if not Path(arquivo).exists():
            print_error(f"Arquivo não encontrado: {arquivo} ({descricao})")
            tudo_ok = False
        else:
            print_success(f"Encontrado: {arquivo}")
    
    # Verificar pastas obrigatórias
    for pasta, descricao in pastas_obrigatorias.items():
        if not Path(pasta).exists():
            print_error(f"Pasta não encontrada: {pasta} ({descricao})")
            tudo_ok = False
        else:
            print_success(f"Encontrado: {pasta}")
    
    # Verificar arquivos importantes (avisos, não erros)
    for arquivo, descricao in arquivos_importantes.items():
        if not Path(arquivo).exists():
            print_warning(f"Arquivo recomendado não encontrado: {arquivo} ({descricao})")
        else:
            print_success(f"Encontrado: {arquivo}")
    
    return tudo_ok

def criar_arquivo_spec():
    """Cria ou atualiza o arquivo .spec para PyInstaller"""
    spec_content = """# -*- mode: python ; coding: utf-8 -*-
\"\"\"
Arquivo de especificação PyInstaller
Sistema de Homologação de Atestados Médicos
Gerado automaticamente por gerar_executavel.py
\"\"\"

from PyInstaller.utils.hooks import collect_data_files, collect_submodules
import os

# Coletar todos os submódulos
hidden_imports = collect_submodules('PyQt5')
hidden_imports += collect_submodules('docx')

# Dados adicionais
datas = []

# Adicionar assets (IMPORTANTE: inclui ícones e imagens)
if os.path.exists('assets'):
    datas.append(('assets', 'assets'))

# Adicionar models (templates de documentos)
if os.path.exists('models'):
    datas.append(('models', 'models'))

# Adicionar core (módulos principais)
if os.path.exists('core'):
    datas.append(('core/*.py', 'core'))

# Análise
a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=[],
    datas=datas,
    hiddenimports=hidden_imports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)

# PYZ (arquivo comprimido com bytecode Python)
pyz = PYZ(a.pure)

# Executável com TODOS os metadados
exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='SistemaHomologacao',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,  # Compressão UPX para reduzir tamanho
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,  # Interface gráfica (sem janela de console)
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    # ÍCONE DO EXECUTÁVEL (aparece no .exe e na barra de tarefas)
    icon='assets/app_icon.ico' if os.path.exists('assets/app_icon.ico') else None,
    # ARQUIVO DE VERSÃO (metadados do Windows)
    version='file_version_info.txt' if os.path.exists('file_version_info.txt') else None,
)
"""
    
    spec_file = Path('main.spec')
    with open(spec_file, 'w', encoding='utf-8') as f:
        f.write(spec_content)
    
    print_success(f"Arquivo {spec_file} criado/atualizado")
    return spec_file

def gerar_executavel(spec_file):
    """Executa o PyInstaller para gerar o executável"""
    print(f"\n{Colors.BOLD}Iniciando compilação com PyInstaller...{Colors.ENDC}")
    print(f"{Colors.WARNING}Isso pode levar alguns minutos...{Colors.ENDC}\n")
    
    try:
        # Executar PyInstaller
        cmd = [sys.executable, "-m", "PyInstaller", "--clean", str(spec_file)]
        
        processo = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True
        )
        
        # Mostrar saída em tempo real
        for linha in processo.stdout:
            print(linha, end='')
        
        processo.wait()
        
        if processo.returncode == 0:
            print_success("\nCompilação concluída com sucesso!")
            return True
        else:
            print_error(f"\nCompilação falhou com código: {processo.returncode}")
            return False
            
    except Exception as e:
        print_error(f"Erro durante compilação: {e}")
        return False

def criar_estrutura_distribuicao():
    """Cria estrutura de pastas para distribuição"""
    dist_dir = Path('dist')
    
    if not dist_dir.exists():
        print_error("Pasta dist não encontrada. Compilação falhou?")
        return False
    
    # Criar pasta de distribuição final
    release_dir = Path('release')
    if release_dir.exists():
        shutil.rmtree(release_dir)
    release_dir.mkdir()
    
    print(f"\nCriando estrutura de distribuição em: {release_dir}")
    
    # Copiar executável
    exe_name = 'SistemaHomologacao.exe'
    exe_source = dist_dir / exe_name
    
    if exe_source.exists():
        shutil.copy2(exe_source, release_dir / exe_name)
        print_success(f"Executável copiado: {exe_name}")
    else:
        print_error(f"Executável não encontrado: {exe_source}")
        return False
    
    # Criar README de instalação
    readme_content = """# Sistema de Homologação de Atestados Médicos
## Instruções de Instalação

### Instalação
1. Copie o arquivo SistemaHomologacao.exe para uma pasta de sua preferência
   Sugestão: C:\\Program Files\\SistemaHomologacao\\

2. Crie um atalho na área de trabalho (opcional):
   - Clique com botão direito no SistemaHomologacao.exe
   - Selecione "Criar atalho"
   - Mova o atalho para a área de trabalho

### Primeira Execução
- Na primeira vez que executar, o sistema criará automaticamente:
  - Banco de dados em: %LOCALAPPDATA%\\SistemaHomologacao\\data\\
  - Pasta de documentos: %LOCALAPPDATA%\\SistemaHomologacao\\data\\generated_documents\\
  - Pasta de logs: %LOCALAPPDATA%\\SistemaHomologacao\\data\\logs\\

### Uso
- Execute o arquivo SistemaHomologacao.exe
- Preencha os dados solicitados
- Clique em "Gerar Declaração"

### Localização dos Arquivos
- Banco de dados: C:\\Users\\[SEU_USUARIO]\\AppData\\Local\\SistemaHomologacao\\data\\homologacao.db
- Documentos gerados: C:\\Users\\[SEU_USUARIO]\\AppData\\Local\\SistemaHomologacao\\data\\generated_documents\\
- Logs: C:\\Users\\[SEU_USUARIO]\\AppData\\Local\\SistemaHomologacao\\data\\logs\\

### Desinstalação
1. Delete o executável SistemaHomologacao.exe
2. Delete a pasta: C:\\Users\\[SEU_USUARIO]\\AppData\\Local\\SistemaHomologacao\\

### Suporte
Para reportar problemas ou sugestões:
- GitHub: https://github.com/kauankelvin7/sistema_clinica_homologacao

---
Desenvolvido por: Kauan Kelvin
Versão: 2.0.0
"""
    
    readme_file = release_dir / 'LEIA-ME.txt'
    with open(readme_file, 'w', encoding='utf-8') as f:
        f.write(readme_content)
    print_success(f"README criado: {readme_file}")
    
    # Copiar licença se existir
    if Path('LICENSE.md').exists():
        shutil.copy2('LICENSE.md', release_dir / 'LICENSE.txt')
        print_success("Licença copiada")
    
    return True

def criar_instalador_bat():
    """Cria um script .bat para facilitar instalação"""
    bat_content = """@echo off
chcp 65001 >nul
title Instalador - Sistema de Homologação de Atestados Médicos

echo ====================================================================
echo   Sistema de Homologação de Atestados Médicos - Instalador
echo   Versão 2.0.0
echo   Desenvolvido por: Kauan Kelvin
echo ====================================================================
echo.

set "INSTALL_DIR=%ProgramFiles%\\SistemaHomologacao"

echo Instalação será realizada em:
echo %INSTALL_DIR%
echo.

REM Verificar permissões de administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERRO] Este instalador requer permissões de administrador.
    echo Por favor, execute como Administrador.
    echo.
    pause
    exit /b 1
)

echo [1/3] Criando diretório de instalação...
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
echo [OK] Diretório criado

echo [2/3] Copiando arquivos...
copy /Y "SistemaHomologacao.exe" "%INSTALL_DIR%\\" >nul
echo [OK] Executável copiado

echo [3/3] Criando atalho na área de trabalho...
set SCRIPT="%TEMP%\\create_shortcut.vbs"
echo Set oWS = WScript.CreateObject("WScript.Shell") > %SCRIPT%
echo sLinkFile = "%USERPROFILE%\\Desktop\\Sistema Homologação.lnk" >> %SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
echo oLink.TargetPath = "%INSTALL_DIR%\\SistemaHomologacao.exe" >> %SCRIPT%
echo oLink.WorkingDirectory = "%INSTALL_DIR%" >> %SCRIPT%
echo oLink.Description = "Sistema de Homologação de Atestados Médicos" >> %SCRIPT%
echo oLink.Save >> %SCRIPT%
cscript /nologo %SCRIPT%
del %SCRIPT%
echo [OK] Atalho criado na área de trabalho

echo.
echo ====================================================================
echo Instalação concluída com sucesso!
echo.
echo Executável instalado em: %INSTALL_DIR%
echo Atalho criado na área de trabalho
echo.
echo Os dados do sistema serão salvos em:
echo %LOCALAPPDATA%\\SistemaHomologacao\\
echo ====================================================================
echo.

choice /C SN /M "Deseja executar o sistema agora"
if errorlevel 2 goto fim
if errorlevel 1 start "" "%INSTALL_DIR%\\SistemaHomologacao.exe"

:fim
pause
"""
    
    bat_file = Path('release') / 'INSTALAR.bat'
    with open(bat_file, 'w', encoding='utf-8') as f:
        f.write(bat_content)
    print_success(f"Script de instalação criado: {bat_file}")

def gerar_informacoes_versao():
    """Gera arquivo com informações da versão"""
    info_content = """Sistema de Homologação de Atestados Médicos
Versão: 2.0.0
Data de Compilação: 28/10/2025
Desenvolvedor: Kauan Kelvin

Informações Técnicas:
- Python 3.8+
- PyQt5 5.15.10
- python-docx 1.1.0
- SQLite3

Recursos:
✓ Interface gráfica moderna
✓ Banco de dados local
✓ Geração de documentos Word
✓ Autocompletar inteligente
✓ Validação de CPF/RG
✓ Sistema de logging
✓ Consulta online de registros profissionais

Localização dos Dados:
- Banco: %LOCALAPPDATA%\\SistemaHomologacao\\data\\homologacao.db
- Documentos: %LOCALAPPDATA%\\SistemaHomologacao\\data\\generated_documents\\
- Logs: %LOCALAPPDATA%\\SistemaHomologacao\\data\\logs\\

GitHub: https://github.com/kauankelvin7/sistema_clinica_homologacao
"""
    
    info_file = Path('release') / 'VERSAO.txt'
    with open(info_file, 'w', encoding='utf-8') as f:
        f.write(info_content)
    print_success(f"Informações de versão criadas: {info_file}")

def main():
    """Função principal"""
    print_header("GERADOR DE EXECUTÁVEL")
    print_header("Sistema de Homologação de Atestados Médicos v2.0.0")
    
    total_steps = 8
    
    # Passo 1: Verificar PyInstaller
    print_step(1, total_steps, "Verificando PyInstaller")
    if not verificar_pyinstaller():
        print_error("Não foi possível continuar sem PyInstaller")
        return False
    
    # Passo 2: Verificar arquivos necessários
    print_step(2, total_steps, "Verificando arquivos necessários")
    if not verificar_arquivos_necessarios():
        print_error("Alguns arquivos necessários estão faltando")
        return False
    
    # Passo 3: Limpar builds anteriores
    print_step(3, total_steps, "Limpando builds anteriores")
    limpar_builds_anteriores()
    
    # Passo 4: Criar arquivo .spec
    print_step(4, total_steps, "Criando arquivo de especificação")
    spec_file = criar_arquivo_spec()
    
    # Passo 5: Gerar executável
    print_step(5, total_steps, "Gerando executável")
    if not gerar_executavel(spec_file):
        print_error("Falha ao gerar executável")
        return False
    
    # Passo 6: Criar estrutura de distribuição
    print_step(6, total_steps, "Criando estrutura de distribuição")
    if not criar_estrutura_distribuicao():
        print_error("Falha ao criar estrutura de distribuição")
        return False
    
    # Passo 7: Criar instalador
    print_step(7, total_steps, "Criando script de instalação")
    criar_instalador_bat()
    
    # Passo 8: Gerar informações
    print_step(8, total_steps, "Gerando informações de versão")
    gerar_informacoes_versao()
    
    # Sucesso!
    print_header("COMPILAÇÃO CONCLUÍDA COM SUCESSO!")
    
    print(f"\n{Colors.OKGREEN}{Colors.BOLD}Arquivos gerados:{Colors.ENDC}")
    print(f"  📁 Pasta de distribuição: {Colors.OKCYAN}release/{Colors.ENDC}")
    print(f"  🚀 Executável: {Colors.OKCYAN}release/SistemaHomologacao.exe{Colors.ENDC}")
    print(f"  📋 Instalador: {Colors.OKCYAN}release/INSTALAR.bat{Colors.ENDC}")
    print(f"  📄 Leia-me: {Colors.OKCYAN}release/LEIA-ME.txt{Colors.ENDC}")
    print(f"  ℹ️  Versão: {Colors.OKCYAN}release/VERSAO.txt{Colors.ENDC}")
    
    print(f"\n{Colors.WARNING}{Colors.BOLD}Próximos passos:{Colors.ENDC}")
    print(f"  1. Teste o executável: {Colors.OKCYAN}release\\SistemaHomologacao.exe{Colors.ENDC}")
    print(f"  2. Para instalar no sistema: {Colors.OKCYAN}Execute release\\INSTALAR.bat como Administrador{Colors.ENDC}")
    print(f"  3. Para distribuir: {Colors.OKCYAN}Compacte a pasta 'release' em um arquivo .zip{Colors.ENDC}")
    
    print(f"\n{Colors.OKGREEN}✓ Processo concluído com sucesso!{Colors.ENDC}\n")
    
    return True

if __name__ == "__main__":
    try:
        sucesso = main()
        sys.exit(0 if sucesso else 1)
    except KeyboardInterrupt:
        print(f"\n\n{Colors.WARNING}Processo interrompido pelo usuário{Colors.ENDC}")
        sys.exit(1)
    except Exception as e:
        print(f"\n{Colors.FAIL}Erro inesperado: {e}{Colors.ENDC}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
