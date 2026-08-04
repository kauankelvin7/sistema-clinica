export type Language = 'pt' | 'en' | 'es'

export interface TranslationSchema {
  headerTitle: string
  headerSubtitle: string
  modeSideBySide: string
  modeColumn: string
  installApp: string
  appInstalled: string
  logout: string
  toggleTheme: string
  patientDataTitle: string
  certificateDataTitle: string
  doctorDataTitle: string
  languageName: string
}

export const TRANSLATIONS: Record<Language, TranslationSchema> = {
  pt: {
    headerTitle: 'Sistema de Homologação',
    headerSubtitle: 'Atestados Médicos Digitais',
    modeSideBySide: 'Modo Lado a Lado',
    modeColumn: 'Modo Coluna',
    installApp: 'Instalar App',
    appInstalled: 'App Instalado',
    logout: 'Sair',
    toggleTheme: 'Alternar Tema Claro/Escuro',
    patientDataTitle: 'Dados do Paciente',
    certificateDataTitle: 'Dados do Atestado',
    doctorDataTitle: 'Dados do Médico',
    languageName: 'Português (BR)',
  },
  en: {
    headerTitle: 'Homologation System',
    headerSubtitle: 'Digital Medical Certificates',
    modeSideBySide: 'Side-by-Side Mode',
    modeColumn: 'Column Mode',
    installApp: 'Install App',
    appInstalled: 'App Installed',
    logout: 'Sign Out',
    toggleTheme: 'Toggle Light/Dark Theme',
    patientDataTitle: 'Patient Information',
    certificateDataTitle: 'Certificate Details',
    doctorDataTitle: 'Doctor Information',
    languageName: 'English (US)',
  },
  es: {
    headerTitle: 'Sistema de Homologación',
    headerSubtitle: 'Certificados Médicos Digitales',
    modeSideBySide: 'Modo Lado a Lado',
    modeColumn: 'Modo Columna',
    installApp: 'Instalar App',
    appInstalled: 'App Instalada',
    logout: 'Cerrar Sesión',
    toggleTheme: 'Cambiar Tema Claro/Oscuro',
    patientDataTitle: 'Datos del Paciente',
    certificateDataTitle: 'Datos del Certificado',
    doctorDataTitle: 'Datos del Médico',
    languageName: 'Español',
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
