import { useState, useEffect } from 'react'

export type Language = 'pt' | 'en' | 'es'

export interface TranslationSchema {
  // Header
  headerTitle: string
  headerSubtitle: string
  modeSideBySide: string
  modeColumn: string
  installApp: string
  appInstalled: string
  logout: string
  toggleTheme: string
  languageName: string

  // Section Headers
  patientDataTitle: string
  certificateDataTitle: string
  doctorDataTitle: string

  // Patient Form
  patientNameLabel: string
  patientNamePlaceholder: string
  docTypeLabel: string
  docNumberLabel: string
  docNumberPlaceholder: string
  positionLabel: string
  positionPlaceholder: string
  companyLabel: string
  companyPlaceholder: string
  searchPatientsBtn: string

  // Certificate Form
  certificateDateLabel: string
  leaveDaysLabel: string
  leaveDaysPlaceholder: string
  cidLabel: string
  cidPlaceholder: string
  cidNotProvided: string
  expectedReturnTitle: string
  cltExceededWarning: string
  cltNormalNotice: string
  fillDateNotice: string

  // Doctor Form
  doctorNameLabel: string
  doctorNamePlaceholder: string
  regTypeLabel: string
  regNumberLabel: string
  regNumberPlaceholder: string
  regUfLabel: string
  searchDoctorsBtn: string
  consultRegister: string
  consultCrmCfm: string
  consultCroCfo: string

  // Action Buttons
  btnGenerateHTML: string
  btnGenerating: string
  btnClearForm: string
  msgFormCleared: string

  // Patient List Modal
  modalPatientsTitle: string
  modalPatientsSubtitle: string
  searchPatientsPlaceholder: string
  tableHeaderPatient: string
  tableHeaderDocument: string
  tableHeaderRoleCompany: string
  tableHeaderAction: string
  btnSelect: string
  noPatientsFound: string

  // Doctor List Modal
  modalDoctorsTitle: string
  modalDoctorsSubtitle: string
  searchDoctorsPlaceholder: string
  tableHeaderDoctor: string
  tableHeaderRegister: string
  tableHeaderState: string
  noDoctorsFound: string

  // Validation Modal
  modalValidationTitle: string
  modalValidationSubtitle: string
  btnGotIt: string

  // Login Screen
  loginAppTitle: string
  loginAppSubtitle: string
  loginUserLabel: string
  loginUserPlaceholder: string
  loginPassLabel: string
  loginPassPlaceholder: string
  btnEnterSystem: string
  btnAuthenticating: string
  loginRestrictedNotice: string
  loginDemoCredentials: string
}

export const TRANSLATIONS: Record<Language, TranslationSchema> = {
  pt: {
    // Header
    headerTitle: 'Sistema de Homologação',
    headerSubtitle: 'Atestados Médicos Digitais',
    modeSideBySide: 'Modo Lado a Lado',
    modeColumn: 'Modo Coluna',
    installApp: 'Instalar App',
    appInstalled: 'App Instalado',
    logout: 'Sair',
    toggleTheme: 'Alternar Tema Claro/Escuro',
    languageName: 'Português (BR)',

    // Section Headers
    patientDataTitle: 'Dados do Paciente',
    certificateDataTitle: 'Dados do Atestado',
    doctorDataTitle: 'Dados do Médico',

    // Patient Form
    patientNameLabel: 'Nome Completo do Paciente',
    patientNamePlaceholder: 'Digite o nome completo do paciente',
    docTypeLabel: 'Tipo de Documento',
    docNumberLabel: 'Número do Documento',
    docNumberPlaceholder: '000.000.000-00',
    positionLabel: 'Cargo / Função',
    positionPlaceholder: 'Ex: Analista de Sistemas, Motorista',
    companyLabel: 'Empresa / Organização',
    companyPlaceholder: 'Ex: Empresa XYZ Ltda',
    searchPatientsBtn: 'Buscar Pacientes Cadastrados',

    // Certificate Form
    certificateDateLabel: 'Data do Atestado',
    leaveDaysLabel: 'Dias de Afastamento',
    leaveDaysPlaceholder: 'Ex: 3 dias',
    cidLabel: 'Código CID (Classificação Internacional de Doenças)',
    cidPlaceholder: 'Digite o código ou descrição (Ex: J00, gripe, dor)',
    cidNotProvided: 'Não Informado',
    expectedReturnTitle: 'Retorno Previsto',
    cltExceededWarning: 'Afastamento excede o limite CLT de 15 dias. Requer encaminhamento para perícia médica do INSS a partir do 16º dia.',
    cltNormalNotice: 'Afastamento dentro do limite legal de 15 dias. Homologação direta e custeada pela empresa.',
    fillDateNotice: 'Preencha a data e os dias de afastamento para calcular a previsão de retorno ao trabalho.',

    // Doctor Form
    doctorNameLabel: 'Nome Completo do Médico',
    doctorNamePlaceholder: 'Dr. Nome do Médico',
    regTypeLabel: 'Tipo de Registro',
    regNumberLabel: 'Número de Registro',
    regNumberPlaceholder: '123456',
    regUfLabel: 'UF do Registro',
    searchDoctorsBtn: 'Buscar Médicos Cadastrados',
    consultRegister: 'Consultar Registro',
    consultCrmCfm: 'Consultar CRM no Portal do CFM',
    consultCroCfo: 'Consultar CRO no Portal do CFO',

    // Action Buttons
    btnGenerateHTML: 'Gerar Declaração em HTML',
    btnGenerating: 'Gerando...',
    btnClearForm: 'Limpar Formulário',
    msgFormCleared: 'Formulário limpo com sucesso!',

    // Patient List Modal
    modalPatientsTitle: 'Pacientes Cadastrados',
    modalPatientsSubtitle: 'Selecione um paciente para preencher os dados automaticamente',
    searchPatientsPlaceholder: 'Buscar por nome, CPF ou empresa...',
    tableHeaderPatient: 'Paciente',
    tableHeaderDocument: 'Documento',
    tableHeaderRoleCompany: 'Cargo & Empresa',
    tableHeaderAction: 'Ação',
    btnSelect: 'Selecionar',
    noPatientsFound: 'Nenhum paciente encontrado com essa busca.',

    // Doctor List Modal
    modalDoctorsTitle: 'Médicos Cadastrados',
    modalDoctorsSubtitle: 'Selecione um médico para preencher os dados automaticamente',
    searchDoctorsPlaceholder: 'Buscar por nome, CRM ou especialidade...',
    tableHeaderDoctor: 'Médico',
    tableHeaderRegister: 'Registro',
    tableHeaderState: 'Estado',
    noDoctorsFound: 'Nenhum médico encontrado com essa busca.',

    // Validation Modal
    modalValidationTitle: 'Campos Obrigatórios Pendentes',
    modalValidationSubtitle: 'Por favor, preencha os seguintes campos antes de gerar a declaração:',
    btnGotIt: 'Entendi, vou preencher',

    // Login Screen
    loginAppTitle: 'NOVA Medicina e Segurança do Trabalho',
    loginAppSubtitle: 'Sistema de Homologação e Validação de Atestados Médicos',
    loginUserLabel: 'Usuário / E-mail',
    loginUserPlaceholder: 'Seu usuário de acesso',
    loginPassLabel: 'Senha',
    loginPassPlaceholder: 'Sua senha secreta',
    btnEnterSystem: 'Entrar no Sistema',
    btnAuthenticating: 'Autenticando...',
    loginRestrictedNotice: 'Acesso Restrito a Colaboradores Autorizados',
    loginDemoCredentials: 'Acesso padrão: admin / admin123',
  },
  en: {
    // Header
    headerTitle: 'Homologation System',
    headerSubtitle: 'Digital Medical Certificates',
    modeSideBySide: 'Side-by-Side Mode',
    modeColumn: 'Column Mode',
    installApp: 'Install App',
    appInstalled: 'App Installed',
    logout: 'Sign Out',
    toggleTheme: 'Toggle Light/Dark Theme',
    languageName: 'English (US)',

    // Section Headers
    patientDataTitle: 'Patient Information',
    certificateDataTitle: 'Certificate Details',
    doctorDataTitle: 'Doctor Information',

    // Patient Form
    patientNameLabel: 'Patient Full Name',
    patientNamePlaceholder: 'Enter patient full name',
    docTypeLabel: 'ID Document Type',
    docNumberLabel: 'ID Document Number',
    docNumberPlaceholder: '000.000.000-00',
    positionLabel: 'Job Position / Title',
    positionPlaceholder: 'E.g., Systems Analyst, Driver',
    companyLabel: 'Company / Organization',
    companyPlaceholder: 'E.g., XYZ Corp',
    searchPatientsBtn: 'Search Registered Patients',

    // Certificate Form
    certificateDateLabel: 'Certificate Date',
    leaveDaysLabel: 'Leave Duration (Days)',
    leaveDaysPlaceholder: 'E.g., 3 days',
    cidLabel: 'ICD Code (International Classification of Diseases)',
    cidPlaceholder: 'Enter code or description (E.g., J00, flu, pain)',
    cidNotProvided: 'Not Provided',
    expectedReturnTitle: 'Expected Return',
    cltExceededWarning: 'Medical leave exceeds 15 days limit. Requires official INSS social security medical review after day 15.',
    cltNormalNotice: 'Leave within 15 days legal limit. Direct employer approval and coverage.',
    fillDateNotice: 'Enter date and leave days to calculate expected return to work.',

    // Doctor Form
    doctorNameLabel: 'Doctor Full Name',
    doctorNamePlaceholder: 'Dr. Physician Name',
    regTypeLabel: 'Registration Type',
    regNumberLabel: 'Registration Number',
    regNumberPlaceholder: '123456',
    regUfLabel: 'State (UF)',
    searchDoctorsBtn: 'Search Registered Doctors',
    consultRegister: 'Check Registry',
    consultCrmCfm: 'Check CRM on CFM Portal',
    consultCroCfo: 'Check CRO on CFO Portal',

    // Action Buttons
    btnGenerateHTML: 'Generate HTML Certificate',
    btnGenerating: 'Generating...',
    btnClearForm: 'Clear Form',
    msgFormCleared: 'Form cleared successfully!',

    // Patient List Modal
    modalPatientsTitle: 'Registered Patients',
    modalPatientsSubtitle: 'Select a patient to autofill form details',
    searchPatientsPlaceholder: 'Search by name, ID or company...',
    tableHeaderPatient: 'Patient',
    tableHeaderDocument: 'Document ID',
    tableHeaderRoleCompany: 'Position & Company',
    tableHeaderAction: 'Action',
    btnSelect: 'Select',
    noPatientsFound: 'No patients found matching your search.',

    // Doctor List Modal
    modalDoctorsTitle: 'Registered Doctors',
    modalDoctorsSubtitle: 'Select a doctor to autofill form details',
    searchDoctorsPlaceholder: 'Search by name, CRM or specialty...',
    tableHeaderDoctor: 'Doctor',
    tableHeaderRegister: 'Registration',
    tableHeaderState: 'State',
    noDoctorsFound: 'No doctors found matching your search.',

    // Validation Modal
    modalValidationTitle: 'Missing Required Fields',
    modalValidationSubtitle: 'Please fill in the following fields before generating the document:',
    btnGotIt: 'Got it, I will fill them in',

    // Login Screen
    loginAppTitle: 'NOVA Occupational Health & Safety',
    loginAppSubtitle: 'Medical Certificate Homologation & Validation System',
    loginUserLabel: 'Username / Email',
    loginUserPlaceholder: 'Enter your username',
    loginPassLabel: 'Password',
    loginPassPlaceholder: 'Enter your password',
    btnEnterSystem: 'Sign In to System',
    btnAuthenticating: 'Authenticating...',
    loginRestrictedNotice: 'Restricted Access for Authorized Personnel Only',
    loginDemoCredentials: 'Default credentials: admin / admin123',
  },
  es: {
    // Header
    headerTitle: 'Sistema de Homologación',
    headerSubtitle: 'Certificados Médicos Digitales',
    modeSideBySide: 'Modo Lado a Lado',
    modeColumn: 'Modo Columna',
    installApp: 'Instalar App',
    appInstalled: 'App Instalada',
    logout: 'Cerrar Sesión',
    toggleTheme: 'Cambiar Tema Claro/Oscuro',
    languageName: 'Español',

    // Section Headers
    patientDataTitle: 'Datos del Paciente',
    certificateDataTitle: 'Datos del Certificado',
    doctorDataTitle: 'Datos del Médico',

    // Patient Form
    patientNameLabel: 'Nombre Completo del Paciente',
    patientNamePlaceholder: 'Ingrese el nombre completo del paciente',
    docTypeLabel: 'Tipo de Documento',
    docNumberLabel: 'Número de Documento',
    docNumberPlaceholder: '000.000.000-00',
    positionLabel: 'Cargo / Función',
    positionPlaceholder: 'Ej: Analista de Sistemas, Conductor',
    companyLabel: 'Empresa / Organización',
    companyPlaceholder: 'Ej: Empresa XYZ Ltda',
    searchPatientsBtn: 'Buscar Pacientes Registrados',

    // Certificate Form
    certificateDateLabel: 'Fecha del Certificado',
    leaveDaysLabel: 'Días de Reposo / Licencia',
    leaveDaysPlaceholder: 'Ej: 3 días',
    cidLabel: 'Código CIE (Clasificación Internacional de Enfermedades)',
    cidPlaceholder: 'Ingrese código o descripción (Ej: J00, gripe, dolor)',
    cidNotProvided: 'No Informado',
    expectedReturnTitle: 'Retorno Previsto',
    cltExceededWarning: 'La licencia supera el límite de 15 días. Requiere evaluación médica del seguro social (INSS) a partir del 16° día.',
    cltNormalNotice: 'Licencia dentro del límite legal de 15 días. Homologación directa cubierta por la empresa.',
    fillDateNotice: 'Complete la fecha y los días de reposo para calcular la fecha de retorno al trabajo.',

    // Doctor Form
    doctorNameLabel: 'Nombre Completo del Médico',
    doctorNamePlaceholder: 'Dr. Nombre del Médico',
    regTypeLabel: 'Tipo de Registro',
    regNumberLabel: 'Número de Registro',
    regNumberPlaceholder: '123456',
    regUfLabel: 'Estado / Región',
    searchDoctorsBtn: 'Buscar Médicos Registrados',
    consultRegister: 'Consultar Registro',
    consultCrmCfm: 'Consultar CRM en Portal CFM',
    consultCroCfo: 'Consultar CRO en Portal CFO',

    // Action Buttons
    btnGenerateHTML: 'Generar Declaración en HTML',
    btnGenerating: 'Generando...',
    btnClearForm: 'Limpiar Formulario',
    msgFormCleared: '¡Formulario limpiado con éxito!',

    // Patient List Modal
    modalPatientsTitle: 'Pacientes Registrados',
    modalPatientsSubtitle: 'Seleccione un paciente para completar los datos automáticamente',
    searchPatientsPlaceholder: 'Buscar por nombre, documento o empresa...',
    tableHeaderPatient: 'Paciente',
    tableHeaderDocument: 'Documento',
    tableHeaderRoleCompany: 'Cargo & Empresa',
    tableHeaderAction: 'Acción',
    btnSelect: 'Seleccionar',
    noPatientsFound: 'No se encontraron pacientes con esa búsqueda.',

    // Doctor List Modal
    modalDoctorsTitle: 'Médicos Registrados',
    modalDoctorsSubtitle: 'Seleccione un médico para completar los datos automáticamente',
    searchDoctorsPlaceholder: 'Buscar por nombre, CRM o especialidad...',
    tableHeaderDoctor: 'Médico',
    tableHeaderRegister: 'Registro',
    tableHeaderState: 'Estado',
    noDoctorsFound: 'No se encontraron médicos con esa búsqueda.',

    // Validation Modal
    modalValidationTitle: 'Campos Obligatorios Pendientes',
    modalValidationSubtitle: 'Por favor, complete los siguientes campos antes de generar el documento:',
    btnGotIt: 'Entendido, voy a completar',

    // Login Screen
    loginAppTitle: 'NOVA Medicina y Seguridad del Trabajo',
    loginAppSubtitle: 'Sistema de Homologación y Validación de Certificados Médicos',
    loginUserLabel: 'Usuario / Correo',
    loginUserPlaceholder: 'Su usuario de acceso',
    loginPassLabel: 'Contraseña',
    loginPassPlaceholder: 'Su contraseña secreta',
    btnEnterSystem: 'Ingresar al Sistema',
    btnAuthenticating: 'Autenticando...',
    loginRestrictedNotice: 'Acceso Restringido a Personal Autorizado',
    loginDemoCredentials: 'Credenciales por defecto: admin / admin123',
  },
}

export const getSavedLanguage = (): Language => {
  try {
    const saved = localStorage.getItem('app_language')
    if (saved === 'en' || saved === 'es' || saved === 'pt') {
      return saved
    }
  } catch {}
  return 'pt'
}

export const setSavedLanguage = (lang: Language) => {
  try {
    localStorage.setItem('app_language', lang)
    window.dispatchEvent(new CustomEvent('language_changed', { detail: lang }))
  } catch {}
}

export function useTranslation() {
  const [lang, setLangState] = useState<Language>(getSavedLanguage)

  useEffect(() => {
    const handleLangChange = (e: Event) => {
      const customEvent = e as CustomEvent<Language>
      setLangState(customEvent.detail || getSavedLanguage())
    }
    window.addEventListener('language_changed', handleLangChange)
    return () => window.removeEventListener('language_changed', handleLangChange)
  }, [])

  return {
    lang,
    t: TRANSLATIONS[lang] || TRANSLATIONS.pt,
    setLanguage: setSavedLanguage
  }
}
