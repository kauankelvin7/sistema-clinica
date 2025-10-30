"""
Script de Verificação do Executável
Verifica metadados, ícone e integridade do executável gerado
"""

import os
import sys
from pathlib import Path

def verificar_executavel():
    """Verifica o executável gerado"""
    exe_paths = [
        Path('dist/SistemaHomologacao.exe'),
        Path('release/SistemaHomologacao.exe')
    ]
    
    exe_path = None
    for path in exe_paths:
        if path.exists():
            exe_path = path
            break
    
    if not exe_path:
        print("❌ Executável não encontrado!")
        print("Execute primeiro: python gerar_executavel.py")
        return False
    
    print(f"✓ Executável encontrado: {exe_path}")
    
    # Verificar tamanho
    tamanho_mb = exe_path.stat().st_size / (1024 * 1024)
    print(f"✓ Tamanho: {tamanho_mb:.2f} MB")
    
    # Verificar se tem ícone (Windows)
    if sys.platform == 'win32':
        try:
            import win32api
            import win32con
            
            # Tentar extrair ícone
            icon_handles = win32api.ExtractIconEx(str(exe_path), 0)
            if icon_handles[0]:
                print("✓ Ícone embutido detectado!")
                # Limpar handles
                for handle in icon_handles[0]:
                    win32api.DestroyIcon(handle)
                for handle in icon_handles[1]:
                    win32api.DestroyIcon(handle)
            else:
                print("⚠ Ícone não detectado!")
        except ImportError:
            print("⚠ Não foi possível verificar ícone (win32api não instalado)")
        except Exception as e:
            print(f"⚠ Erro ao verificar ícone: {e}")
    
    # Verificar metadados (Windows)
    if sys.platform == 'win32':
        try:
            import win32api
            
            info = win32api.GetFileVersionInfo(str(exe_path), '\\')
            version = "%d.%d.%d.%d" % (
                info['FileVersionMS'] >> 16,
                info['FileVersionMS'] & 0xFFFF,
                info['FileVersionLS'] >> 16,
                info['FileVersionLS'] & 0xFFFF
            )
            print(f"✓ Versão detectada: {version}")
            
            # Tentar obter strings de versão
            lang, codepage = win32api.GetFileVersionInfo(str(exe_path), '\\VarFileInfo\\Translation')[0]
            string_file_info = f'\\StringFileInfo\\{lang:04X}{codepage:04X}\\'
            
            campos = [
                'CompanyName',
                'FileDescription',
                'ProductName',
                'LegalCopyright'
            ]
            
            for campo in campos:
                try:
                    valor = win32api.GetFileVersionInfo(str(exe_path), string_file_info + campo)
                    if valor:
                        print(f"  {campo}: {valor}")
                except:
                    pass
                    
        except ImportError:
            print("⚠ Não foi possível verificar metadados (pywin32 não instalado)")
        except Exception as e:
            print(f"⚠ Erro ao verificar metadados: {e}")
    
    print("\n" + "="*70)
    print("VERIFICAÇÃO CONCLUÍDA!")
    print("="*70)
    
    return True

if __name__ == "__main__":
    verificar_executavel()
