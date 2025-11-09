"""
Interface Gráfica Principal
Sistema de Homologação de Atestados Médicos
Autor: Kauan Kelvin
Versão: 2.0.0
Data: 28/10/2025

Características:
- Interface moderna com tema médico
- Autocompletar para pacientes e médicos
- Validação em tempo real
- Geração automática de documentos
- Sistema de logging integrado
"""

from PyQt5.QtWidgets import (
    QMainWindow, QVBoxLayout, QHBoxLayout, QWidget,
    QLabel, QLineEdit, QPushButton, QMessageBox,
    QDateEdit, QComboBox, QCompleter, QStatusBar, QSpacerItem, QSizePolicy, QFrame,
    QGridLayout, QScrollArea, QCheckBox
)
from PyQt5.QtCore import Qt, QDate, QStringListModel, QUrl
from PyQt5.QtGui import QFont, QIntValidator, QIcon, QPixmap
from PyQt5.Qt import QDesktopServices
import os
import sys
import logging

# Importar módulos de negócio e banco de dados
from core.database import get_db_connection, sanitizar_entrada, DatabaseError
from core.document_generator import generate_document, DocumentGenerationError

# Importar configurações e validadores
try:
    from core.config import (
        UFS_BRASIL, TIPOS_DOCUMENTO, TIPOS_REGISTRO, CONSULTA_URLS,
        MSG_CAMPO_OBRIGATORIO, MSG_CPF_INVALIDO, MSG_RG_INVALIDO,
        MSG_SUCESSO_GERACAO, MSG_ERRO_GERACAO, MSG_CAMPOS_LIMPOS,
        MSG_SISTEMA_PRONTO
    )
    from core.validators import (
        validar_cpf, limpar_documento, validar_nome,
        validar_numero_inteiro, validar_codigo_cid, normalizar_nome
    )
except ImportError:
    # Valores padrão se config não estiver disponível
    UFS_BRASIL = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
                  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
                  "RS", "RO", "RR", "SC", "SP", "SE", "TO"]
    TIPOS_DOCUMENTO = ["CPF", "RG"]
    TIPOS_REGISTRO = ["CRM", "CRO", "RMS"]
    CONSULTA_URLS = {
        "CRM": "https://portal.cfm.org.br/busca-medicos/",
        "CRO": "https://website.cfo.org.br/busca-profissionais/",
    }
    MSG_CAMPO_OBRIGATORIO = "O campo '{campo}' é obrigatório."
    MSG_CPF_INVALIDO = "O CPF deve conter 11 dígitos."
    MSG_RG_INVALIDO = "O RG parece estar incompleto."
    MSG_SUCESSO_GERACAO = "Declaração gerada com sucesso!\nSalvo em: {caminho}"
    MSG_ERRO_GERACAO = "Não foi possível gerar a declaração."
    MSG_CAMPOS_LIMPOS = "Campos limpos. Sistema pronto."
    MSG_SISTEMA_PRONTO = "Sistema pronto para uso."
    
    # Funções de validação básicas se validators não estiver disponível
    def validar_cpf(cpf):
        return len(limpar_documento(cpf)) == 11
    
    def limpar_documento(doc):
        return ''.join(filter(str.isdigit, doc))
    
    def validar_nome(nome, *args, **kwargs):
        return len(nome.strip()) > 2
    
    def validar_numero_inteiro(val, *args, **kwargs):
        try:
            return int(val) > 0
        except:
            return False
    
    def validar_codigo_cid(cid):
        return len(cid.strip()) > 0
    
    def normalizar_nome(nome):
        return nome.strip().title()

# Configurar logger
logger = logging.getLogger(__name__)

# --- Função auxiliar para lidar com caminhos de recursos no PyInstaller ---
def resource_path(relative_path):
    """
    Obtém o caminho absoluto para o recurso, funciona tanto em desenvolvimento
    quanto quando empacotado com PyInstaller.
    
    Args:
        relative_path: Caminho relativo do recurso
        
    Returns:
        str: Caminho absoluto do recurso
    """
    try:
        # PyInstaller cria uma pasta temp e armazena o caminho em _MEIPASS
        base_path = sys._MEIPASS
        logger.debug(f"Executando de pacote PyInstaller: {base_path}")
    except Exception:
        # Em desenvolvimento, usar o diretório do script
        base_path = os.path.abspath(os.path.dirname(sys.argv[0]))
        logger.debug(f"Executando em modo de desenvolvimento: {base_path}")
    
    full_path = os.path.join(base_path, relative_path)
    logger.debug(f"Caminho do recurso '{relative_path}': {full_path}")
    return full_path

# --- Classe CustomDateEdit para controle de eventos de data ---
class CustomDateEdit(QDateEdit):
    """
    QDateEdit personalizado que previne alterações acidentais de data
    através do scroll do mouse e teclas de seta.
    """
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setCalendarPopup(True)  # Mantém o popup do calendário
        self.setFocusPolicy(Qt.StrongFocus)  # Permite foco via Tab e clique
        self.setDisplayFormat("dd/MM/yyyy")  # Formato brasileiro
        self.setDate(QDate.currentDate())  # Define data inicial como hoje
        logger.debug("CustomDateEdit inicializado")

    def wheelEvent(self, event):
        """Ignora o evento da roda do mouse para não alterar a data."""
        event.ignore()

    def keyPressEvent(self, event):
        """Ignora as setas para cima/baixo para não alterar a data."""
        if event.key() == Qt.Key_Up or event.key() == Qt.Key_Down:
            event.ignore() 
        else:
            super().keyPressEvent(event)

    def mouseDoubleClickEvent(self, event):
        """Ignora o clique duplo para não alterar a data de forma inesperada."""
        event.ignore()

    def mousePressEvent(self, event):
        """
        Controla o comportamento do clique do mouse.
        Permite abrir o calendário mas previne alterações acidentais.
        """
        # Se o clique for no botão do calendário, chamamos o comportamento padrão
        if self.calendarPopup() and self.lineEdit().rect().contains(event.pos()):
            # Se o clique for na área de texto, ignora o evento de mudança, apenas foca
            event.ignore()
        else:
            super().mousePressEvent(event)  # Permite o clique para abrir o calendário
        
        # Certifica-se que o campo de texto recebe foco
        self.lineEdit().setFocus()


class MainWindow(QMainWindow):
    """
    Janela principal da aplicação Sistema de Homologação de Atestados Médicos.
    
    Implementa:
    - Interface gráfica moderna
    - Autocompletar para pacientes e médicos
    - Validação de dados em tempo real
    - Geração de documentos Word
    - Integração com banco de dados SQLite
    """
    
    def __init__(self):
        super().__init__()
        logger.info("Inicializando janela principal...")
        
        self.setWindowTitle("Sistema de Homologação de Atestados Médicos")
        self.setGeometry(100, 100, 950, 800)
        self.setMinimumSize(850, 700) 

        # Flag para controlar preenchimento automático e evitar loops
        self.is_autofilling = False

        # Configurar barra de status
        self._statusBar = QStatusBar()
        self.setStatusBar(self._statusBar)
        self.update_status("Sistema pronto. [Design Moderno]")

        # Configurar ícone da janela
        self._configurar_icone_janela()

        # Inicializar interface
        self.init_ui()
        self.apply_stylesheet()
        self.setup_completers()
        
        logger.info("Janela principal inicializada com sucesso")

    def _configurar_icone_janela(self):
        """Configura o ícone da janela principal"""
        try:
            icon_path_for_window = resource_path("assets/app_icon.ico")
            if not QPixmap(icon_path_for_window).isNull():
                self.setWindowIcon(QIcon(icon_path_for_window))
                logger.debug(f"Ícone da janela carregado: {icon_path_for_window}")
            else:
                # Tentar PNG como fallback
                icon_path_for_window_png = resource_path("assets/app_logo.png")
                if not QPixmap(icon_path_for_window_png).isNull():
                    self.setWindowIcon(QIcon(icon_path_for_window_png))
                    logger.warning("Usando app_logo.png como ícone da janela")
                else:
                    logger.warning("Nenhum ícone válido encontrado para a janela")
        except Exception as e:
            logger.error(f"Erro ao definir ícone da janela: {e}")
            pass


    def init_ui(self):
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        scroll_area = QScrollArea()
        scroll_area.setWidgetResizable(True) 
        scroll_area.setHorizontalScrollBarPolicy(Qt.ScrollBarAsNeeded)
        scroll_area.setVerticalScrollBarPolicy(Qt.ScrollBarAsNeeded)
        scroll_area.setFrameShape(QFrame.NoFrame) 
        
        scroll_widget = QWidget()
        scroll_area.setWidget(scroll_widget)
        
        main_layout = QVBoxLayout(scroll_widget)
        main_layout.setContentsMargins(25, 25, 25, 25) 
        main_layout.setSpacing(0) 

        header_widget = self.create_header()
        main_layout.addWidget(header_widget)
        main_layout.addSpacing(35) 

        content_container = QWidget()
        content_container.setObjectName("contentContainer")
        content_container.setMaximumWidth(800)
        content_container.setSizePolicy(QSizePolicy.Fixed, QSizePolicy.Preferred)
        
        content_layout = QVBoxLayout(content_container)
        content_layout.setContentsMargins(0, 0, 0, 0) 
        content_layout.setSpacing(25) # Espaçamento entre as seções

        content_layout.addWidget(self.create_patient_section())
        content_layout.addWidget(self.create_certificate_section())
        content_layout.addWidget(self.create_doctor_section())
        content_layout.addStretch()

        button_widget = self.create_buttons()
        content_layout.addWidget(button_widget)
        content_layout.addSpacing(25)

        container_layout = QHBoxLayout()
        container_layout.addStretch()
        container_layout.addWidget(content_container)
        container_layout.addStretch()
        
        main_layout.addLayout(container_layout) 
        
        main_window_layout = QVBoxLayout(central_widget)
        main_window_layout.setContentsMargins(0, 0, 0, 0)
        main_window_layout.addWidget(scroll_area)


    def create_header(self):
        """Cria o header com logo e título principal e subtítulo."""
        header_widget = QWidget()
        header_widget.setObjectName("headerWidget")
        header_layout = QHBoxLayout(header_widget)
        header_layout.setContentsMargins(20, 20, 20, 10)

        logo_container = QWidget()
        logo_container.setObjectName("logoContainer")
        logo_container.setFixedSize(85, 85)
        logo_layout = QVBoxLayout(logo_container)
        logo_layout.setContentsMargins(0, 0, 0, 0)
        
        self.logo_label = QLabel()
        self.logo_label.setObjectName("logoLabel")
        self.logo_label.setAlignment(Qt.AlignCenter)
        self.logo_label.setFixedSize(75, 75)

        logo_file_path = resource_path("assets/app_icon.png") 
        try:
            pixmap = QPixmap(logo_file_path)
            if not pixmap.isNull():
                scaled_pixmap = pixmap.scaled(75, 75, Qt.KeepAspectRatio, Qt.SmoothTransformation) 
                self.logo_label.setPixmap(scaled_pixmap)
                self.logo_label.setText("") 
            else:
                self.logo_label.setText("LOGO") 
                print(f"Aviso: QPixmap é nulo para o caminho: {logo_file_path}. Verifique o arquivo.")
        except Exception as e:
            print(f"Erro ao carregar logo para cabeçalho: {e}")
            self.logo_label.setText("LOGO") 
            pass

        logo_layout.addWidget(self.logo_label)

        title_container = QWidget()
        title_layout = QVBoxLayout(title_container)
        title_layout.setContentsMargins(20, 0, 0, 0) 
        title_layout.setSpacing(5) 
        title_layout.setAlignment(Qt.AlignCenter) 

        main_title = QLabel("Sistema de Homologação")
        main_title.setObjectName("mainTitle") 

        subtitle = QLabel("Por Kauan Kelvin") 
        subtitle.setObjectName("subtitle") 

        title_layout.addWidget(main_title)
        title_layout.addWidget(subtitle)
        title_layout.addStretch() 

        header_layout.addWidget(logo_container)
        header_layout.addWidget(title_container)
        header_layout.addStretch() 

        return header_widget

    def create_patient_section(self):
        """Cria a seção de dados do paciente com layout otimizado"""
        patient_frame = QFrame()
        patient_frame.setObjectName("sectionFrame")
        
        patient_grid_layout = QGridLayout(patient_frame) 
        patient_grid_layout.setContentsMargins(25, 25, 25, 25)
        patient_grid_layout.setHorizontalSpacing(20) 
        patient_grid_layout.setVerticalSpacing(16)  
        patient_grid_layout.setColumnStretch(0, 0) 
        patient_grid_layout.setColumnStretch(1, 1) 

        self.add_section_title_to_grid(patient_grid_layout, "Dados do Paciente", "sectionTitle") 
        
        # Linha 1: Nome Completo (PRIMEIRO - mais importante)
        patient_grid_layout.addWidget(QLabel("Nome Completo:", objectName="formLabel", alignment=Qt.AlignRight | Qt.AlignVCenter), 1, 0)
        self.nome_paciente_input = QLineEdit(placeholderText="Digite o nome completo do paciente")
        patient_grid_layout.addWidget(self.nome_paciente_input, 1, 1)
        
        # Linha 2: Documento (CPF/RG) em linha única
        patient_grid_layout.addWidget(QLabel("Documento:", objectName="formLabel", alignment=Qt.AlignRight | Qt.AlignVCenter), 2, 0)
        
        doc_widget = QWidget()
        doc_layout = QHBoxLayout(doc_widget)
        doc_layout.setContentsMargins(0, 0, 0, 0)
        doc_layout.setSpacing(12)
        
        self.tipo_doc_paciente_combo = QComboBox(objectName="comboBox")
        self.tipo_doc_paciente_combo.addItems(["CPF", "RG"])
        self.tipo_doc_paciente_combo.setFixedWidth(90)
        
        self.numero_doc_paciente_input = QLineEdit(placeholderText="000.000.000-00")
        self.numero_doc_paciente_input.setMaxLength(14)
        self.numero_doc_paciente_input.setInputMask("000.000.000-00; ")
        
        doc_layout.addWidget(self.tipo_doc_paciente_combo)
        doc_layout.addWidget(self.numero_doc_paciente_input)
        
        patient_grid_layout.addWidget(doc_widget, 2, 1)
        
        # Conectar sinal para mudar a máscara
        self.tipo_doc_paciente_combo.currentIndexChanged.connect(self.update_doc_mask)
        self.update_doc_mask()

        # Linha 3: Cargo
        patient_grid_layout.addWidget(QLabel("Cargo:", objectName="formLabel", alignment=Qt.AlignRight | Qt.AlignVCenter), 3, 0)
        self.cargo_paciente_input = QLineEdit(placeholderText="Ex: Analista de Sistemas")
        patient_grid_layout.addWidget(self.cargo_paciente_input, 3, 1)
        
        # Linha 4: Empresa
        patient_grid_layout.addWidget(QLabel("Empresa:", objectName="formLabel", alignment=Qt.AlignRight | Qt.AlignVCenter), 4, 0)
        self.empresa_paciente_input = QLineEdit(placeholderText="Nome da empresa ou instituição")
        patient_grid_layout.addWidget(self.empresa_paciente_input, 4, 1)
        
        # Conectar eventos de autofill
        self.nome_paciente_input.editingFinished.connect(self.autofill_patient_by_name_exact)
        self.numero_doc_paciente_input.textEdited.connect(self.autofill_patient_by_document)

        return patient_frame

    def create_certificate_section(self):
        """Cria a seção de dados do atestado com layout otimizado"""
        atestado_frame = QFrame()
        atestado_frame.setObjectName("sectionFrame")
        
        atestado_grid_layout = QGridLayout(atestado_frame)
        atestado_grid_layout.setContentsMargins(25, 25, 25, 25)
        atestado_grid_layout.setHorizontalSpacing(20)
        atestado_grid_layout.setVerticalSpacing(16)
        atestado_grid_layout.setColumnStretch(0, 0) 
        atestado_grid_layout.setColumnStretch(1, 1) 

        self.add_section_title_to_grid(atestado_grid_layout, "Dados do Atestado", "sectionTitle")

        # Linha 1: Data do Atestado
        atestado_grid_layout.addWidget(QLabel("Data:", objectName="formLabel", alignment=Qt.AlignRight | Qt.AlignVCenter), 1, 0)
        self.data_atestado_input = CustomDateEdit()
        self.data_atestado_input.setObjectName("dateEdit")
        atestado_grid_layout.addWidget(self.data_atestado_input, 1, 1)
        
        # Linha 2: Dias de Afastamento
        atestado_grid_layout.addWidget(QLabel("Dias de Afastamento:", objectName="formLabel", alignment=Qt.AlignRight | Qt.AlignVCenter), 2, 0)
        self.qtd_dias_atestado_input = QLineEdit(placeholderText="Ex: 3") 
        self.qtd_dias_atestado_input.setValidator(QIntValidator())
        atestado_grid_layout.addWidget(self.qtd_dias_atestado_input, 2, 1)
        
        # Linha 3: CID com checkbox
        atestado_grid_layout.addWidget(QLabel("CID:", objectName="formLabel", alignment=Qt.AlignRight | Qt.AlignVCenter), 3, 0)
        
        cid_widget = QWidget()
        cid_layout = QHBoxLayout(cid_widget)
        cid_layout.setContentsMargins(0, 0, 0, 0)
        cid_layout.setSpacing(12)
        
        self.codigo_cid_input = QLineEdit(placeholderText="Ex: A00, F32.9, J06.9")
        
        self.cid_nao_informado_checkbox = QCheckBox("Não Informado")
        self.cid_nao_informado_checkbox.setObjectName("cidCheckbox")
        self.cid_nao_informado_checkbox.toggled.connect(self.toggle_cid_input)
        
        cid_layout.addWidget(self.codigo_cid_input, 3)
        cid_layout.addWidget(self.cid_nao_informado_checkbox, 1)
        
        atestado_grid_layout.addWidget(cid_widget, 3, 1)
        
        return atestado_frame

    def create_doctor_section(self):
        """Cria a seção de dados do médico com layout otimizado"""
        medico_frame = QFrame()
        medico_frame.setObjectName("sectionFrame")
        
        medico_layout = QVBoxLayout(medico_frame)
        medico_layout.setContentsMargins(25, 25, 25, 25)
        medico_layout.setSpacing(20)

        title = QLabel("Dados do Médico")
        title.setObjectName("sectionTitle")
        medico_layout.addWidget(title)

        grid = QGridLayout()
        grid.setHorizontalSpacing(20)
        grid.setVerticalSpacing(16)
        grid.setColumnStretch(0, 0) 
        grid.setColumnStretch(1, 1) 

        # Linha 0: Nome do Médico
        grid.addWidget(QLabel("Nome Completo:", objectName="formLabel"), 0, 0)
        self.nome_medico_input = QLineEdit(placeholderText="Digite o nome completo do médico")
        grid.addWidget(self.nome_medico_input, 0, 1)
        
        # Linha 1: Registro Profissional (Tipo + Número + UF + Consultar)
        grid.addWidget(QLabel("Registro Profissional:", objectName="formLabel"), 1, 0)
        registro_widget = QWidget()
        registro_layout = QHBoxLayout(registro_widget)
        registro_layout.setContentsMargins(0, 0, 0, 0)
        registro_layout.setSpacing(12)

        self.tipo_registro_medico_combo = QComboBox(objectName="registroTypeCombo")
        self.tipo_registro_medico_combo.addItems(["CRM", "CRO", "RMs"])
        self.tipo_registro_medico_combo.setCurrentText("CRM")
        self.tipo_registro_medico_combo.setFixedWidth(90)

        self.numero_registro_medico_input = QLineEdit(placeholderText="Número", objectName="registroNumberInput")
        
        self.uf_crm_input = QComboBox(objectName="comboBox")
        self.uf_crm_input.addItems(["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"])
        self.uf_crm_input.setFixedWidth(90)

        self.consult_online_button = QPushButton("Consultar", objectName="consultOnlineButton")
        self.consult_online_button.setFixedWidth(120)
        self.consult_online_button.clicked.connect(self.open_online_consultation)

        registro_layout.addWidget(self.tipo_registro_medico_combo)
        registro_layout.addWidget(self.numero_registro_medico_input, 2)
        registro_layout.addWidget(self.uf_crm_input)
        registro_layout.addWidget(self.consult_online_button)
        registro_layout.addWidget(self.numero_registro_medico_input)
        registro_layout.addWidget(self.consult_online_button)
        
        grid.addWidget(registro_widget, 2, 1) 
        
        medico_layout.addLayout(grid) 
        
        self.nome_medico_input.editingFinished.connect(self.autofill_doctor_by_name_exact)
        self.numero_registro_medico_input.textEdited.connect(self.autofill_doctor_by_registro)
        self.tipo_registro_medico_combo.currentIndexChanged.connect(self.autofill_doctor_by_registro)
        
        return medico_frame

    def create_buttons(self):
        button_widget = QWidget()
        button_layout = QHBoxLayout(button_widget)
        button_layout.setSpacing(15)
        button_layout.setAlignment(Qt.AlignCenter)

        self.generate_button = QPushButton("Gerar Declaração", objectName="generateButton")
        self.generate_button.clicked.connect(self.generate_declaration)
        button_layout.addWidget(self.generate_button)

        self.clear_button = QPushButton("Limpar Campos", objectName="clearButton")
        self.clear_button.clicked.connect(self.clear_fields)
        button_layout.addWidget(self.clear_button)

        self.exit_button = QPushButton("Sair", objectName="exitButton")
        self.exit_button.clicked.connect(self.close)
        button_layout.addWidget(self.exit_button)

        return button_widget

    def create_line_edit(self, label_text, placeholder="", validator=None, max_length=None, input_mask=None):
        line_edit = QLineEdit()
        line_edit.setPlaceholderText(placeholder)
        if max_length:
            line_edit.setMaxLength(max_length)
        if validator == "int":
            line_edit.setValidator(QIntValidator())
        if input_mask:
            line_edit.setInputMask(input_mask)
        return line_edit

    def create_date_edit(self, label_text):
        date_edit = CustomDateEdit() # Usar CustomDateEdit
        date_edit.setObjectName("dateEdit") # Definir objectName AQUI, após a criação
        return date_edit

    def create_combo_box(self, label_text, items):
        combo_box = QComboBox()
        combo_box.addItems(items)
        combo_box.setObjectName("comboBox")
        return combo_box

    def add_section_title_to_grid(self, grid_layout, title_text, obj_name=None):
        title_label = QLabel(title_text)
        title_label.setFont(QFont("Arial", 12, QFont.Bold))
        if obj_name:
            title_label.setObjectName(obj_name)
        grid_layout.addWidget(title_label, 0, 0, 1, 2, alignment=Qt.AlignCenter)
        grid_layout.setRowStretch(0, 0)

    def apply_stylesheet(self):
        stylesheet = """
        /* ===== MODERN MEDICAL SYSTEM ===== */
        * {
            font-family: "Segoe UI", "Inter", "Roboto", -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* ===== BACKGROUND PRINCIPAL (GRADIENTE MODERNO) ===== */
        QMainWindow {
            background: qlineargradient(x1: 0, y1: 0, x2: 1, y2: 1,
                                      stop: 0 #667eea, stop: 0.5 #764ba2, stop: 1 #f093fb);
            color: #1a202c;
            font-size: 14px;
            font-weight: 400;
        }

        QScrollArea {
            border: none;
            background-color: transparent;
        }

        QScrollArea > QWidget > QWidget {
            background-color: transparent;
        }

        /* ===== CONTAINER PRINCIPAL (GLASSMORPHISM EFFECT) ===== */
        #contentContainer {
            background: rgba(255, 255, 255, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 30px;
            padding: 8px;
        }
        
        /* ===== HEADER MODERNO COM GRADIENTE VIBRANTE ===== */
        #headerWidget {
            background: qlineargradient(x1: 0, y1: 0, x2: 1, y2: 0,
                                      stop: 0 #667eea, stop: 0.5 #764ba2, stop: 1 #f093fb);
            border: none;
            border-radius: 25px;
            margin: 0px;
            padding: 40px;
            min-height: 140px;
        }

        #logoContainer {
            background: rgba(255, 255, 255, 0.2);
            border: 3px solid rgba(255, 255, 255, 0.5);
            border-radius: 22px;
            padding: 14px;
        }

        #logoLabel {
            color: #ffffff;
            font-weight: 900;
            font-size: 20px;
            background-color: transparent;
            border-radius: 14px;
        }

        #mainTitle {
            color: #ffffff;
            font-size: 38px;
            font-weight: 900;
            letter-spacing: -1.2px;
            margin: 0px;
            padding: 0px;
            qproperty-alignment: AlignLeft;
        }

        #subtitle {
            color: rgba(255, 255, 255, 0.95);
            font-size: 19px;
            font-weight: 600;
            margin: 0px;
            padding: 0px;
            letter-spacing: 0.4px;
        }

        /* ===== SEÇÕES COM DESIGN CARD ===== */
        QFrame#sectionFrame {
            background: qlineargradient(x1: 0, y1: 0, x2: 0, y2: 1,
                                      stop: 0 #ffffff, stop: 1 #fafbfc);
            border: 2px solid rgba(102, 126, 234, 0.15);
            border-radius: 22px;
            padding: 32px;
            margin: 10px 0px;
        }
        
        QFrame#sectionFrame:hover {
            border-color: rgba(102, 126, 234, 0.3);
            background: qlineargradient(x1: 0, y1: 0, x2: 0, y2: 1,
                                      stop: 0 #ffffff, stop: 1 #f0f4ff);
        }

        /* ===== TÍTULOS DE SEÇÕES ===== */
        #sectionTitle {
            color: #667eea;
            font-size: 22px;
            font-weight: 800;
            letter-spacing: -0.5px;
            padding: 0px 0px 20px 0px;
            border-bottom: 4px solid qlineargradient(x1: 0, y1: 0, x2: 1, y2: 0,
                                      stop: 0 #667eea, stop: 0.5 #764ba2, stop: 1 #f093fb);
            margin-bottom: 24px;
            qproperty-alignment: AlignLeft;
        }

        /* ===== LABELS DE FORMULÁRIO ===== */
        QLabel#formLabel {
            font-size: 14px;
            color: #64748b;
            font-weight: 600;
            qproperty-alignment: AlignRight | AlignVCenter;
            min-height: 44px;
            padding-right: 16px;
            letter-spacing: 0.1px;
        }

        /* ===== CAMPOS DE ENTRADA ULTRA MODERNOS ===== */
        QLineEdit {
            background: qlineargradient(x1: 0, y1: 0, x2: 0, y2: 1,
                                      stop: 0 #ffffff, stop: 1 #f8f9fa);
            border: 2px solid #e0e7ff;
            border-radius: 16px;
            padding: 18px 24px;
            font-size: 15px;
            font-weight: 500;
            color: #1e293b;
            min-height: 24px;
            selection-background-color: qlineargradient(x1: 0, y1: 0, x2: 1, y2: 0,
                                                       stop: 0 #667eea, stop: 1 #764ba2);
            selection-color: #ffffff;
        }
        QLineEdit:focus {
            border: 2px solid #667eea;
            background: #ffffff;
            outline: none;
        }
        QLineEdit:hover {
            border-color: #c7d2fe;
            background: qlineargradient(x1: 0, y1: 0, x2: 0, y2: 1,
                                      stop: 0 #fefefe, stop: 1 #f0f4ff);
        }

        /* ===== DATE EDIT MODERNO ===== */
        QDateEdit {
            background: qlineargradient(x1: 0, y1: 0, x2: 0, y2: 1,
                                      stop: 0 #ffffff, stop: 1 #f8f9fa);
            border: 2px solid #e0e7ff;
            border-radius: 16px;
            padding: 18px 24px;
            font-size: 15px;
            font-weight: 500;
            color: #1e293b;
            min-height: 24px;
        }
        QDateEdit:focus {
            border: 2px solid #667eea;
            background: #ffffff;
        }
        QDateEdit:hover {
            border-color: #c7d2fe;
            background: qlineargradient(x1: 0, y1: 0, x2: 0, y2: 1,
                                      stop: 0 #fefefe, stop: 1 #f0f4ff);
        }
        QDateEdit::drop-down {
            subcontrol-origin: padding;
            subcontrol-position: top right;
            width: 42px;
            border-left: 2px solid #e0e7ff;
            border-top-right-radius: 14px;
            border-bottom-right-radius: 14px;
            background: qlineargradient(x1: 0, y1: 0, x2: 1, y2: 0,
                                      stop: 0 #f0f4ff, stop: 1 #e0e7ff);
        }
        QDateEdit::down-arrow {
            image: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTYgOUwxMiAxNUwxOCA5IiBzdHJva2U9IiM2NjdlZWEiIHN0cm9rZS13aWR0aD0iMi41IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+);
            width: 20px;
            height: 20px;
        }

        /* ===== COMBOBOX ULTRA MODERNO ===== */
        QComboBox {
            background: qlineargradient(x1: 0, y1: 0, x2: 0, y2: 1,
                                      stop: 0 #ffffff, stop: 1 #f8f9fa);
            border: 2px solid #e0e7ff;
            border-radius: 16px;
            padding: 18px 24px;
            padding-right: 48px;
            font-size: 15px;
            font-weight: 500;
            color: #1e293b;
            min-height: 24px;
        }
        QComboBox:focus {
            border: 2px solid #667eea;
            background: #ffffff;
        }
        QComboBox:hover {
            border-color: #c7d2fe;
            background: qlineargradient(x1: 0, y1: 0, x2: 0, y2: 1,
                                      stop: 0 #fefefe, stop: 1 #f0f4ff);
        }
        QComboBox::drop-down {
            subcontrol-origin: padding;
            subcontrol-position: top right;
            width: 42px;
            border-left: 2px solid #e0e7ff;
            border-top-right-radius: 14px;
            border-bottom-right-radius: 14px;
            background: qlineargradient(x1: 0, y1: 0, x2: 1, y2: 0,
                                      stop: 0 #f0f4ff, stop: 1 #e0e7ff);
        }
        QComboBox::down-arrow {
            image: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTYgOUwxMiAxNUwxOCA5IiBzdHJva2U9IiM2NjdlZWEiIHN0cm9rZS13aWR0aD0iMi41IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+);
            width: 20px;
            height: 20px;
        }
        QComboBox QAbstractItemView {
            background: #ffffff;
            border: 2px solid #667eea;
            border-radius: 14px;
            selection-background-color: qlineargradient(x1: 0, y1: 0, x2: 1, y2: 0,
                                                       stop: 0 #667eea, stop: 1 #764ba2);
            selection-color: #ffffff;
            padding: 12px;
            outline: none;
        }
        QComboBox QAbstractItemView::item {
            min-height: 36px;
            padding: 8px 14px;
            border-radius: 8px;
            margin: 2px 4px;
        }
        QComboBox QAbstractItemView::item:hover {
            background: qlineargradient(x1: 0, y1: 0, x2: 1, y2: 0,
                                      stop: 0 #e0e7ff, stop: 1 #ddd6fe);
            color: #667eea;
        }

        /* ===== BOTÕES MODERNOS COM GRADIENTE VIBRANTE ===== */
        QPushButton {
            background: qlineargradient(x1: 0, y1: 0, x2: 1, y2: 0,
                                      stop: 0 #667eea, stop: 1 #764ba2);
            color: #ffffff;
            border: none;
            border-radius: 18px;
            padding: 20px 38px;
            font-size: 16px;
            font-weight: 800;
            min-width: 170px;
            min-height: 30px;
            letter-spacing: 0.4px;
        }
        QPushButton:hover {
            background: qlineargradient(x1: 0, y1: 0, x2: 1, y2: 0,
                                      stop: 0 #764ba2, stop: 1 #667eea);
        }
        QPushButton:pressed {
            background: qlineargradient(x1: 0, y1: 0, x2: 1, y2: 0,
                                      stop: 0 #5a3d7f, stop: 1 #5566cc);
        }

        /* ===== BOTÕES ESPECIALIZADOS ===== */
        QPushButton#generateButton {
            background: qlineargradient(x1: 0, y1: 0, x2: 1, y2: 0,
                                      stop: 0 #48bb78, stop: 1 #38a169);
            font-size: 17px;
            min-width: 190px;
        }
        QPushButton#generateButton:hover {
            background: qlineargradient(x1: 0, y1: 0, x2: 1, y2: 0,
                                      stop: 0 #38a169, stop: 1 #2f855a);
        }

        QPushButton#clearButton {
            background: qlineargradient(x1: 0, y1: 0, x2: 1, y2: 0,
                                      stop: 0 #f093fb, stop: 1 #f368e0);
        }
        QPushButton#clearButton:hover {
            background: qlineargradient(x1: 0, y1: 0, x2: 1, y2: 0,
                                      stop: 0 #f368e0, stop: 1 #ee5a6f);
        }

        QPushButton#exitButton {
            background: qlineargradient(x1: 0, y1: 0, x2: 1, y2: 0,
                                      stop: 0 #a0aec0, stop: 1 #718096);
        }
        QPushButton#exitButton:hover {
            background: qlineargradient(x1: 0, y1: 0, x2: 1, y2: 0,
                                      stop: 0 #718096, stop: 1 #4a5568);
        }

        QPushButton#consultOnlineButton {
            background: qlineargradient(x1: 0, y1: 0, x2: 1, y2: 0,
                                      stop: 0 #ed8936, stop: 1 #dd6b20);
            min-width: 125px;
            padding: 12px 22px;
            font-size: 11pt;
        }
        QPushButton#consultOnlineButton:hover {
            background: qlineargradient(x1: 0, y1: 0, x2: 1, y2: 0,
                                      stop: 0 #dd6b20, stop: 1 #c05621);
        }
        
        #registroTypeCombo {
            max-width: 90px; 
            min-width: 80px;
            font-size: 15px;
            font-weight: 600;
        }

        /* ===== BARRA DE ESTADO MODERNA ===== */
        QStatusBar {
            background: rgba(255, 255, 255, 0.95);
            color: #667eea;
            font-size: 15px;
            font-weight: 700;
            padding: 18px 26px;
            border-top: 3px solid rgba(102, 126, 234, 0.3);
        }

        /* ===== CAIXAS DE MENSAGEM MODERNAS ===== */
        QMessageBox {
            background: rgba(255, 255, 255, 0.98);
            font-size: 16px;
            font-weight: 600;
            border-radius: 25px;
            color: #2d3748;
        }

        QMessageBox QPushButton {
            background: qlineargradient(x1: 0, y1: 0, x2: 1, y2: 0,
                                      stop: 0 #667eea, stop: 1 #764ba2);
            color: #ffffff;
            border: none;
            border-radius: 14px;
            padding: 16px 32px;
            min-width: 110px;
            font-size: 15px;
            font-weight: 700;
        }
        QMessageBox QPushButton:hover {
            background: qlineargradient(x1: 0, y1: 0, x2: 1, y2: 0,
                                      stop: 0 #764ba2, stop: 1 #667eea);
        }

        /* ===== PERSONALIZAÇÃO DE BARRAS DE ROLAGEM ===== */
        QScrollBar:vertical {
            background: rgba(102, 126, 234, 0.15);
            width: 14px;
            border-radius: 7px;
            margin: 3px;
        }
        QScrollBar::handle:vertical {
            background: qlineargradient(x1: 0, y1: 0, x2: 1, y2: 0,
                                      stop: 0 #667eea, stop: 1 #764ba2);
            border-radius: 7px;
            min-height: 30px;
        }
        QScrollBar::handle:vertical:hover {
            background: qlineargradient(x1: 0, y1: 0, x2: 1, y2: 0,
                                      stop: 0 #764ba2, stop: 1 #f093fb);
        }
        QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {
            border: none;
            background: none;
            height: 0px;
        }

        QScrollBar:horizontal {
            background: rgba(102, 126, 234, 0.15);
            height: 14px;
            border-radius: 7px;
            margin: 3px;
        }
        QScrollBar::handle:horizontal {
            background: qlineargradient(x1: 0, y1: 0, x2: 1, y2: 0,
                                      stop: 0 #667eea, stop: 1 #764ba2);
            border-radius: 7px;
            min-width: 30px;
        }
        QScrollBar::handle:horizontal:hover {
            background: qlineargradient(x1: 0, y1: 0, x2: 1, y2: 0,
                                      stop: 0 #764ba2, stop: 1 #f093fb);
        }
        QScrollBar::add-line:horizontal, QScrollBar::sub-line:horizontal {
            border: none;
            background: none;
            width: 0px;
        }

        /* ===== CHECKBOX MODERNO ===== */
        QCheckBox {
            color: #64748b;
            font-size: 14px;
            font-weight: 600;
            spacing: 8px;
        }
        QCheckBox::indicator {
            width: 20px;
            height: 20px;
            border: 2px solid #e0e7ff;
            border-radius: 6px;
            background: #ffffff;
        }
        QCheckBox::indicator:hover {
            border-color: #c7d2fe;
            background: #f0f4ff;
        }
        QCheckBox::indicator:checked {
            background: qlineargradient(x1: 0, y1: 0, x2: 1, y2: 0,
                                      stop: 0 #667eea, stop: 1 #764ba2);
            border-color: #667eea;
            image: url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTUgMTNMMTAgMThMMTkgNiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+);
        }

        /* ===== ANIMAÇÕES SUAVES ===== */
        QPushButton, QLineEdit, QComboBox, QDateEdit {
            /* transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); */
        }
        QFrame#sectionFrame {
            /* transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); */
        }

        /* ===== DICAS DE FERRAMENTAS MODERNAS ===== */
        QToolTip {
            background: qlineargradient(x1: 0, y1: 0, x2: 1, y2: 0,
                                      stop: 0 #667eea, stop: 1 #764ba2);
            color: #ffffff;
            border: 2px solid rgba(255, 255, 255, 0.4);
            border-radius: 14px;
            padding: 10px 14px;
            font-size: 13px;
            font-weight: 500;
        }
        """
        self.setStyleSheet(stylesheet)

    # --- Métodos de Lógica e Funcionalidade ---
    def setup_completers(self):
        self.patient_name_model = QStringListModel()
        self.patient_completer = QCompleter(self.patient_name_model, self)
        self.patient_completer.setCaseSensitivity(Qt.CaseInsensitive)
        self.nome_paciente_input.setCompleter(self.patient_completer)
        self.patient_completer.activated.connect(self.autofill_patient_by_name_selected)
        
        self.doctor_name_model = QStringListModel()
        self.doctor_completer = QCompleter(self.doctor_name_model, self)
        self.doctor_completer.setCaseSensitivity(Qt.CaseInsensitive)
        self.nome_medico_input.setCompleter(self.doctor_completer)
        self.doctor_completer.activated.connect(self.autofill_doctor_by_name_selected)

        self.load_patient_names_for_completer()
        self.load_doctor_names_for_completer()

    def load_patient_names_for_completer(self):
        """Carrega os nomes dos pacientes para o autocompletar"""
        self.update_status("Carregando nomes de pacientes...")
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT DISTINCT nome_completo FROM pacientes ORDER BY nome_completo")
                names = [row['nome_completo'] for row in cursor.fetchall()]
            self.patient_name_model.setStringList(names)
            self.update_status("Nomes de pacientes carregados.")
            logger.debug(f"{len(names)} nomes de pacientes carregados")
        except DatabaseError as e:
            logger.error(f"Erro ao carregar nomes de pacientes: {e}")
            self.update_status("Erro ao carregar nomes de pacientes")

    def load_doctor_names_for_completer(self):
        """Carrega os nomes dos médicos para o autocompletar"""
        self.update_status("Carregando nomes de médicos...")
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT DISTINCT nome_completo FROM medicos ORDER BY nome_completo")
                names = [row['nome_completo'] for row in cursor.fetchall()]
            self.doctor_name_model.setStringList(names)
            self.update_status("Nomes de médicos carregados.")
            logger.debug(f"{len(names)} nomes de médicos carregados")
        except DatabaseError as e:
            logger.error(f"Erro ao carregar nomes de médicos: {e}")
            self.update_status("Erro ao carregar nomes de médicos")

    def update_doc_mask(self):
        """Atualiza a máscara de entrada do documento conforme o tipo selecionado"""
        doc_type = self.tipo_doc_paciente_combo.currentText()
        if doc_type == "CPF":
            self.numero_doc_paciente_input.setInputMask("000.000.000-00; ")
            self.numero_doc_paciente_input.setMaxLength(14)
            self.numero_doc_paciente_input.setPlaceholderText("Ex: 123.456.789-00")
        elif doc_type == "RG":
            self.numero_doc_paciente_input.setInputMask("")
            self.numero_doc_paciente_input.setMaxLength(15) 
            self.numero_doc_paciente_input.setPlaceholderText("Ex: 12.345.678-9")
        
        self.numero_doc_paciente_input.clear()
        self.update_status(f"Máscara de documento alterada para: {doc_type}.")
        logger.debug(f"Máscara de documento atualizada para {doc_type}")


    def autofill_patient_by_name_selected(self, text):
        """Preenche automaticamente os dados do paciente quando selecionado do autocompletar"""
        if self.is_autofilling:
            return
        
        self.update_status(f"Buscando dados do paciente: {text}...")
        logger.debug(f"Autopreenchendo paciente por nome: {text}")
        
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM pacientes WHERE nome_completo = ?", (text,))
                patient = cursor.fetchone()

            if patient:
                self.is_autofilling = True
                self.tipo_doc_paciente_combo.setCurrentText(patient['tipo_doc'] if 'tipo_doc' in patient.keys() else 'CPF')
                self.numero_doc_paciente_input.setText(patient['numero_doc'] if 'numero_doc' in patient.keys() else '')
                self.nome_paciente_input.setText(patient['nome_completo']) 
                self.cargo_paciente_input.setText(patient['cargo'] if 'cargo' in patient.keys() else '')
                self.empresa_paciente_input.setText(patient['empresa'] if 'empresa' in patient.keys() else '')
                self.is_autofilling = False
                self.update_status(f"Dados do paciente '{patient['nome_completo']}' preenchidos.")
                logger.info(f"Dados do paciente '{text}' carregados com sucesso")
            else:
                self.update_status(f"Paciente '{text}' não encontrado para autocompletar.")
                logger.warning(f"Paciente '{text}' não encontrado no banco")
        except DatabaseError as e:
            logger.error(f"Erro ao buscar paciente por nome: {e}")
            self.update_status("Erro ao buscar dados do paciente")


    def autofill_patient_by_name_exact(self):
        """Preenche automaticamente os dados quando o nome completo é digitado"""
        if self.is_autofilling:
            return

        name = self.nome_paciente_input.text().strip()
        if not name:
            self.is_autofilling = True
            self.tipo_doc_paciente_combo.setCurrentText("CPF")
            self.numero_doc_paciente_input.clear()
            self.cargo_paciente_input.clear()
            self.empresa_paciente_input.clear()
            self.is_autofilling = False
            self.update_status("Campo de nome do paciente limpo.")
            return
        
        self.update_status(f"Verificando paciente por nome exato: {name}...")
        logger.debug(f"Buscando paciente por nome exato: {name}")
        
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM pacientes WHERE nome_completo = ?", (name,))
                patient = cursor.fetchone()

            if patient:
                self.is_autofilling = True
                self.tipo_doc_paciente_combo.setCurrentText(patient['tipo_doc'] if 'tipo_doc' in patient.keys() else 'CPF')
                self.numero_doc_paciente_input.setText(patient['numero_doc'] if 'numero_doc' in patient.keys() else '')
                self.nome_paciente_input.setText(patient['nome_completo'])
                self.cargo_paciente_input.setText(patient['cargo'] if 'cargo' in patient.keys() else '')
                self.empresa_paciente_input.setText(patient['empresa'] if 'empresa' in patient.keys() else '')
                self.is_autofilling = False
                self.update_status(f"Dados do paciente '{patient['nome_completo']}' preenchidos por nome exato.")
                logger.info(f"Paciente '{name}' encontrado e dados preenchidos")
            else:
                self.update_status(f"Nome do paciente '{name}' não encontrado no banco de dados.")
                logger.debug(f"Paciente '{name}' não encontrado")
        except DatabaseError as e:
            logger.error(f"Erro ao buscar paciente por nome exato: {e}")
            self.update_status("Erro ao buscar dados do paciente")


    def autofill_patient_by_document(self):
        """Preenche automaticamente os dados do paciente pelo número do documento"""
        if self.is_autofilling:
            return

        doc_type = self.tipo_doc_paciente_combo.currentText().strip()
        doc_number_formatted = self.numero_doc_paciente_input.text().strip()
        
        doc_number_cleaned = limpar_documento(doc_number_formatted)

        if doc_type == "CPF" and len(doc_number_cleaned) < 11:
            self.update_status("CPF do paciente incompleto. Autopreenchimento suspenso.")
            return
        elif doc_type == "RG" and len(doc_number_cleaned) < 5: 
             self.update_status("RG do paciente muito curto. Autopreenchimento suspenso.")
             return


        self.update_status(f"Buscando paciente por {doc_type}: {doc_number_cleaned}...")
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM pacientes WHERE tipo_doc = ? AND numero_doc = ?", (doc_type, doc_number_cleaned))
                patient = cursor.fetchone()

            if patient:
                self.is_autofilling = True
                self.nome_paciente_input.setText(patient['nome_completo'])
                self.tipo_doc_paciente_combo.setCurrentText(patient['tipo_doc'] if 'tipo_doc' in patient.keys() else 'CPF')
                self.numero_doc_paciente_input.setText(patient['numero_doc'] if 'numero_doc' in patient.keys() else '')
                self.cargo_paciente_input.setText(patient['cargo'] if 'cargo' in patient.keys() else '')
                self.empresa_paciente_input.setText(patient['empresa'] if 'empresa' in patient.keys() else '')
                self.is_autofilling = False
                self.update_status(f"Dados do paciente '{patient['nome_completo']}' preenchidos por {doc_type}.")
            else:
                self.update_status(f"Paciente com {doc_type} '{doc_number_cleaned}' não encontrado no banco de dados.")
        except DatabaseError as e:
            logger.error(f"Erro ao buscar paciente por documento: {e}")
            self.update_status("Erro ao buscar dados do paciente")

    def autofill_doctor_by_name_selected(self, text):
        if self.is_autofilling:
            return
        self.update_status(f"Buscando dados do médico: {text}...")
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM medicos WHERE nome_completo = ?", (text,))
                doctor = cursor.fetchone()

            if doctor:
                self.is_autofilling = True
                self.nome_medico_input.setText(doctor['nome_completo'])
                self.tipo_registro_medico_combo.setCurrentText(doctor['tipo_crm'] if 'tipo_crm' in doctor.keys() else 'CRM')
                self.numero_registro_medico_input.setText(doctor['crm'] if 'crm' in doctor.keys() else '')
                self.uf_crm_input.setCurrentText(doctor['uf_crm'] if 'uf_crm' in doctor.keys() else self.uf_crm_input.itemText(0))
                self.is_autofilling = False
                self.update_status(f"Dados do médico '{doctor['nome_completo']}' preenchidos.")
            else:
                self.update_status(f"Médico '{text}' não encontrado para autopreenchimento.")
        except DatabaseError as e:
            logger.error(f"Erro ao buscar médico por nome: {e}")
            self.update_status("Erro ao buscar dados do médico")


    def autofill_doctor_by_name_exact(self):
        if self.is_autofilling:
            return

        name = self.nome_medico_input.text().strip()
        if not name:
            self.is_autofilling = True
            self.tipo_registro_medico_combo.setCurrentText("CRM")
            self.numero_registro_medico_input.clear()
            self.uf_crm_input.setCurrentIndex(0)
            self.is_autofilling = False
            self.update_status("Campo de nome do médico limpo.")
            return

        self.update_status(f"Verificando médico por nome exato: {name}...")
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM medicos WHERE nome_completo = ?", (name,))
                doctor = cursor.fetchone()

            if doctor:
                self.is_autofilling = True
                self.nome_medico_input.setText(doctor['nome_completo'])
                self.tipo_registro_medico_combo.setCurrentText(doctor['tipo_crm'] if 'tipo_crm' in doctor.keys() else 'CRM')
                self.numero_registro_medico_input.setText(doctor['crm'] if 'crm' in doctor.keys() else '')
                self.uf_crm_input.setCurrentText(doctor['uf_crm'] if 'uf_crm' in doctor.keys() else self.uf_crm_input.itemText(0))
                self.is_autofilling = False
                self.update_status(f"Dados do médico '{doctor['nome_completo']}' preenchidos por nome exato.")
            else:
                self.update_status(f"Nome do médico '{name}' não encontrado no banco de dados.")
        except DatabaseError as e:
            logger.error(f"Erro ao buscar médico por nome exato: {e}")
            self.update_status("Erro ao buscar dados do médico")


    def autofill_doctor_by_registro(self):
        if self.is_autofilling:
            return

        tipo_registro = self.tipo_registro_medico_combo.currentText().strip()
        numero_registro = self.numero_registro_medico_input.text().strip()
        
        if not tipo_registro or not numero_registro:
            self.is_autofilling = True
            self.nome_medico_input.clear()
            self.uf_crm_input.setCurrentIndex(0)
            self.is_autofilling = False
            self.update_status("Registro do médico incompleto. Campos limpos.")
            return

        self.update_status(f"Buscando médico por registro: {tipo_registro} {numero_registro}...")
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT * FROM medicos WHERE tipo_crm = ? AND crm = ?", (tipo_registro, numero_registro))
                doctor = cursor.fetchone()

            if doctor:
                self.is_autofilling = True
                self.nome_medico_input.setText(doctor['nome_completo'])
                self.uf_crm_input.setCurrentText(doctor['uf_crm'] if 'uf_crm' in doctor.keys() else self.uf_crm_input.itemText(0))
                self.is_autofilling = False
                self.update_status(f"Dados do médico '{doctor['nome_completo']}' preenchidos por registro.")
            else:
                self.update_status(f"Médico com registro '{tipo_registro} {numero_registro}' não encontrado.")
        except DatabaseError as e:
            logger.error(f"Erro ao buscar médico por registro: {e}")
            self.update_status("Erro ao buscar dados do médico")


    def clear_fields(self):
        self.nome_paciente_input.clear()
        self.tipo_doc_paciente_combo.setCurrentText("CPF")
        self.numero_doc_paciente_input.clear()
        self.cargo_paciente_input.clear()
        self.empresa_paciente_input.clear()
        self.data_atestado_input.setDate(QDate.currentDate())
        self.qtd_dias_atestado_input.clear()
        self.codigo_cid_input.clear()
        self.cid_nao_informado_checkbox.setChecked(False) 
        self.toggle_cid_input(False) 
        self.nome_medico_input.clear()
        self.tipo_registro_medico_combo.setCurrentText("CRM") 
        self.numero_registro_medico_input.clear()
        self.uf_crm_input.setCurrentIndex(0)

        self.load_patient_names_for_completer()
        self.load_doctor_names_for_completer()
        self.update_status("Campos limpos. Sistema pronto.")

    def toggle_cid_input(self, checked):
        """Habilita/desabilita o campo CID e define seu valor."""
        if checked:
            self.codigo_cid_input.setText("Não informado")
            self.codigo_cid_input.setEnabled(False)
            self.update_status("CID marcado como 'Não informado'.")
        else:
            self.codigo_cid_input.clear()
            self.codigo_cid_input.setEnabled(True)
            self.update_status("CID habilitado para preenchimento.")


    def generate_declaration(self):
        self.update_status("Gerando declaração... Verificando campos.")
        data = {
            "nome_paciente": self.nome_paciente_input.text().strip(),
            "tipo_doc_paciente": self.tipo_doc_paciente_combo.currentText().strip(),
            "numero_doc_paciente": self.numero_doc_paciente_input.text().strip(),
            "cargo_paciente": self.cargo_paciente_input.text().strip(),
            "empresa_paciente": self.empresa_paciente_input.text().strip(),
            "data_atestado": self.data_atestado_input.date().toString("dd/MM/yyyy"),
            "qtd_dias_atestado": self.qtd_dias_atestado_input.text().strip(),
            "codigo_cid": self.codigo_cid_input.text().strip(), 
            "nome_medico": self.nome_medico_input.text().strip(),
            "tipo_registro_medico": self.tipo_registro_medico_combo.currentText().strip(),
            "crm__medico": self.numero_registro_medico_input.text().strip(),
            "uf_crm_medico": self.uf_crm_input.currentText().strip()
        }

        required_fields = {
            "nome_paciente": "Nome do Paciente",
            "numero_doc_paciente": "Número do Documento do Paciente",
            "tipo_doc_paciente": "Tipo de Documento do Paciente",
            "data_atestado": "Data do Atestado",
            "qtd_dias_atestado": "Dias Ausente",
            "codigo_cid": "CID", 
            "nome_medico": "Nome do Médico",
            "tipo_registro_medico": "Tipo de Registro do Médico",
            "crm__medico": "Número de Registro do Médico",
            "uf_crm_medico": "UF do Registro do Médico"
        }

        doc_numero_para_validacao_limpo = ''.join(filter(str.isdigit, data["numero_doc_paciente"]))

        for key, display_name in required_fields.items():
            if key == "codigo_cid": 
                if self.cid_nao_informado_checkbox.isChecked():
                    continue 
            
            if not data[key]:
                QMessageBox.warning(self, "Campos Obrigatórios", f"O campo '{display_name}' é obrigatório.")
                self.update_status(f"Erro: Campo '{display_name}' não preenchido.")
                return
            
            if key == "numero_doc_paciente":
                if data["tipo_doc_paciente"] == "CPF" and len(doc_numero_para_validacao_limpo) != 11:
                    QMessageBox.warning(self, "CPF Inválido", "O CPF deve conter 11 dígitos.")
                    self.update_status("Erro: CPF incompleto ou inválido.")
                    return
                elif data["tipo_doc_paciente"] == "RG" and len(doc_numero_para_validacao_limpo) < 5: 
                     QMessageBox.warning(self, "RG Inválido", "O RG parece muito curto.")
                     self.update_status("Erro: RG incompleto.")
                     return


        try:
            data["qtd_dias_atestado"] = int(data["qtd_dias_atestado"])
        except ValueError:
            QMessageBox.warning(self, "Erro de Entrada", "O campo 'Dias Ausente' deve ser um número inteiro.")
            self.update_status("Erro: Dias Ausente não válido.")
            return

        self.update_status("Salvando dados no banco de dados...")
        self.save_or_update_data(data)

        self.load_patient_names_for_completer()
        self.load_doctor_names_for_completer()

        self.update_status("Gerando arquivo DOCX...")
        try:
            output_path = generate_document(data)
            if output_path:
                QMessageBox.information(self, "Sucesso", f"Declaração gerada com sucesso!\nSalvo em: {output_path}")
                self.clear_fields()
                self.update_status("Declaração gerada e campos limpos.")
            else:
                QMessageBox.critical(self, "Erro", "Não foi possível gerar a declaração. Verifique o modelo e os registros.")
                self.update_status("Erro ao gerar a declaração.")
        except Exception as e:
            QMessageBox.critical(self, "Erro ao Gerar", f"Ocorreu um erro ao gerar o documento: {e}")
            self.update_status(f"Erro crítico ao gerar: {e}")


    def save_or_update_data(self, data):
        self.update_status("Persistindo dados no banco de dados...")
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()

                doc_numero_para_db = ''.join(filter(str.isdigit, data["numero_doc_paciente"]))

                cursor.execute("SELECT id FROM pacientes WHERE tipo_doc = ? AND numero_doc = ?", (data["tipo_doc_paciente"], doc_numero_para_db))
                patient_row = cursor.fetchone()

                if patient_row:
                    cursor.execute(
                        "UPDATE pacientes SET nome_completo = ?, cargo = ?, empresa = ?, tipo_doc = ?, numero_doc = ? WHERE id = ?",
                        (data["nome_paciente"], data["cargo_paciente"], data["empresa_paciente"], data["tipo_doc_paciente"], doc_numero_para_db, patient_row['id'])
                    )
                else:
                    cursor.execute(
                        "INSERT INTO pacientes (nome_completo, tipo_doc, numero_doc, cargo, empresa) VALUES (?, ?, ?, ?, ?)",
                        (data["nome_paciente"], data["tipo_doc_paciente"], doc_numero_para_db, data["cargo_paciente"], data["empresa_paciente"])
                    )

                cursor.execute("SELECT id FROM medicos WHERE tipo_crm = ? AND crm = ?", (data["tipo_registro_medico"], data["crm__medico"]))
                doctor_row = cursor.fetchone()

                if doctor_row:
                    cursor.execute(
                        "UPDATE medicos SET nome_completo = ?, uf_crm = ? WHERE id = ?",
                        (data["nome_medico"], data["uf_crm_medico"], doctor_row['id'])
                    )
                else:
                    cursor.execute(
                        "INSERT INTO medicos (nome_completo, tipo_crm, crm, uf_crm) VALUES (?, ?, ?, ?)",
                        (data["nome_medico"], data["tipo_registro_medico"], data["crm__medico"], data["uf_crm_medico"])
                    )

                cursor.execute(
                    "INSERT INTO atestados (paciente_id, medico_id, data_atestado, qtd_dias_atestado, codigo_cid, data_homologacao) VALUES ((SELECT id FROM pacientes WHERE tipo_doc = ? AND numero_doc = ?), (SELECT id FROM medicos WHERE tipo_crm = ? AND crm = ?), ?, ?, ?, ?)",
                    (data["tipo_doc_paciente"], doc_numero_para_db, data["tipo_registro_medico"], data["crm__medico"], data["data_atestado"], data["qtd_dias_atestado"], data["codigo_cid"], QDate.currentDate().toString("dd/MM/yyyy"))
                )

                conn.commit()
                self.update_status("Dados salvos no banco de dados.")
                logger.info("Dados salvos com sucesso no banco de dados")
                
        except DatabaseError as e:
            logger.error(f"Erro ao salvar dados no banco: {e}")
            self.update_status("Erro ao salvar dados no banco de dados")
            QMessageBox.critical(self, "Erro de Banco de Dados", f"Não foi possível salvar os dados:\n{e}")

    def update_status(self, message):
        self._statusBar.showMessage(message)

    # Consulta online removida do desktop. Agora deve ser feita pelo backend web.