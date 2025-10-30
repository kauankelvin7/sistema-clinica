# -*- mode: python ; coding: utf-8 -*-
"""
Arquivo de especificação PyInstaller
Sistema de Homologação de Atestados Médicos
Gerado automaticamente por gerar_executavel.py
"""

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
