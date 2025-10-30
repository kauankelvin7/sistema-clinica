"""
Sistema de Homologação de Atestados Médicos
Autor: Kauan Kelvin
Versão: 2.0.0
Data: 28/10/2025

Aplicação para gerenciamento e homologação de atestados médicos
com interface gráfica moderna e funcionalidades de autocompletar.

Características:
- Interface gráfica moderna com PyQt5
- Banco de dados SQLite para armazenamento
- Geração automática de documentos Word
- Sistema de logging integrado
- Validações e segurança aprimoradas
"""

import sys
import locale
import logging
from PyQt5.QtWidgets import QApplication, QMessageBox
from PyQt5.QtCore import Qt

# Importar módulos do sistema
from ui.main_window import MainWindow
from core.database import create_tables, DatabaseError

# Importar configurações
try:
    from core.config import APP_NAME, APP_VERSION, logger
except ImportError:
    # Configuração básica de logging se config não estiver disponível
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    logger = logging.getLogger(__name__)
    APP_NAME = "Sistema de Homologação"
    APP_VERSION = "2.0.0"

def configurar_locale():
    """
    Configura o locale do sistema para português brasileiro
    """
    try:
        # Tentar configurar locale para pt_BR
        locale.setlocale(locale.LC_ALL, 'pt_BR.UTF-8')
        logger.info("Locale configurado para pt_BR.UTF-8")
    except locale.Error:
        try:
            # Fallback para Portuguese_Brazil no Windows
            locale.setlocale(locale.LC_ALL, 'Portuguese_Brazil.1252')
            logger.info("Locale configurado para Portuguese_Brazil.1252")
        except locale.Error:
            # Se nenhum funcionar, usar o padrão do sistema
            logger.warning("Não foi possível configurar locale pt_BR, usando padrão do sistema")

def inicializar_banco_dados():
    """
    Inicializa o banco de dados e cria as tabelas necessárias
    
    Returns:
        bool: True se inicializado com sucesso, False caso contrário
    """
    try:
        logger.info("Inicializando banco de dados...")
        create_tables()
        logger.info("Banco de dados inicializado com sucesso")
        return True
    except DatabaseError as e:
        logger.error(f"Erro ao inicializar banco de dados: {e}")
        return False
    except Exception as e:
        logger.error(f"Erro inesperado ao inicializar banco: {e}", exc_info=True)
        return False

def configurar_aplicacao(app):
    """
    Configura atributos globais da aplicação Qt
    
    Args:
        app: Instância do QApplication
    """
    # Habilitar High DPI scaling
    QApplication.setAttribute(Qt.AA_EnableHighDpiScaling, True)
    QApplication.setAttribute(Qt.AA_UseHighDpiPixmaps, True)
    
    # Configurar informações da aplicação
    app.setApplicationName(APP_NAME)
    app.setApplicationVersion(APP_VERSION)
    app.setOrganizationName("Kauan Kelvin")
    
    logger.info(f"{APP_NAME} v{APP_VERSION} - Aplicação configurada")

def main():
    """
    Função principal que inicializa e executa a aplicação
    
    Returns:
        int: Código de saída da aplicação
    """
    try:
        # Configurar locale
        configurar_locale()
        
        # Inicializar banco de dados
        if not inicializar_banco_dados():
            QMessageBox.critical(
                None,
                "Erro Crítico",
                "Não foi possível inicializar o banco de dados.\n"
                "A aplicação será encerrada.\n\n"
                "Verifique as permissões de escrita na pasta 'data'."
            )
            logger.critical("Falha ao inicializar banco de dados. Encerrando aplicação.")
            return 1
        
        # Criar aplicação Qt
        logger.info("Criando aplicação Qt...")
        app = QApplication(sys.argv)
        
        # Configurar aplicação
        configurar_aplicacao(app)
        
        # Criar e mostrar janela principal
        logger.info("Criando janela principal...")
        window = MainWindow()
        window.show()
        
        logger.info("Aplicação iniciada com sucesso")
        logger.info("Aguardando interação do usuário...")
        
        # Executar loop de eventos
        exit_code = app.exec_()
        
        logger.info(f"Aplicação encerrada com código: {exit_code}")
        return exit_code
        
    except Exception as e:
        logger.critical(f"Erro crítico na aplicação: {e}", exc_info=True)
        QMessageBox.critical(
            None,
            "Erro Crítico",
            f"Ocorreu um erro inesperado:\n\n{str(e)}\n\n"
            "A aplicação será encerrada."
        )
        return 1

if __name__ == "__main__":
    # Executar aplicação
    sys.exit(main())
    