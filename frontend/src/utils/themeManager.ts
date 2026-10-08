export type PaletteName = 'garnet' | 'emerald' | 'sapphire' | 'amber' | 'graphite'
export type Theme = 'light' | 'dark'

export interface ColorPalette {
  name: PaletteName
  label: string
  colors: {
    50: string
    100: string
    200: string
    300: string
    400: string
    500: string
    600: string
    700: string
    800: string
    900: string
    950: string
    bgPage: string
    bgCard: string
    bgInput: string
  }
}

export const THEME_PALETTES: Record<PaletteName, ColorPalette> = {
  garnet: {
    name: 'garnet',
    label: 'Garnet Burgundy',
    colors: {
      50: '250 235 236',
      100: '245 215 217',
      200: '230 177 182',
      300: '211 128 137',
      400: '172 74 86',
      500: '122 31 42',
      600: '102 25 35',
      700: '80 20 28',
      800: '56 17 23',
      900: '38 17 20',
      950: '5 0 0',
      bgPage: '13 0 0',
      bgCard: '26 3 3',
      bgInput: '18 2 2',
    },
  },
  emerald: {
    name: 'emerald',
    label: 'Emerald Slate',
    colors: {
      50: '236 253 245',
      100: '209 250 229',
      200: '167 243 208',
      300: '110 231 183',
      400: '52 160 138',
      500: '23 107 92',
      600: '19 88 76',
      700: '16 69 61',
      800: '13 49 44',
      900: '10 32 29',
      950: '2 18 13',
      bgPage: '6 30 22',
      bgCard: '10 45 34',
      bgInput: '8 38 28',
    },
  },
  sapphire: {
    name: 'sapphire',
    label: 'Midnight Blue',
    colors: {
      50: '239 246 255',
      100: '219 234 254',
      200: '191 219 254',
      300: '147 197 253',
      400: '72 137 185',
      500: '18 85 140',
      600: '15 70 116',
      700: '13 55 91',
      800: '11 40 66',
      900: '10 20 40',
      950: '5 10 25',
      bgPage: '10 20 40',
      bgCard: '15 30 60',
      bgInput: '12 24 48',
    },
  },
  amber: {
    name: 'amber',
    label: 'Amber Gold',
    colors: {
      50: '254 243 199',
      100: '253 230 138',
      200: '252 211 77',
      300: '251 191 36',
      400: '190 111 15',
      500: '142 75 8',
      600: '119 61 8',
      700: '96 48 8',
      800: '70 36 8',
      900: '42 27 12',
      950: '15 10 5',
      bgPage: '28 20 10',
      bgCard: '42 30 15',
      bgInput: '35 25 12',
    },
  },
  graphite: {
    name: 'graphite',
    label: 'Graphite Sand',
    colors: {
      50:  '250 250 250',
      100: '244 244 245',
      200: '228 228 231',
      300: '212 212 216',
      400: '168 143 113',
      500: '113 91 67',
      600: '94 75 55',
      700: '75 59 44',
      800: '54 42 32',
      900: '15  15  17',
      950: '7   7   8',
      bgPage: '9   9   11',
      bgCard: '20  20  23',
      bgInput: '14  14  16',
    },
  },
}

function rgbToHex(rgbStr: string): string {
  if (!rgbStr) return '#6e2d29'
  const parts = rgbStr.trim().split(/\s+/).map(Number)
  if (parts.length < 3 || parts.some(isNaN)) return '#6e2d29'
  const [r, g, b] = parts
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

class ThemeManager {
  private currentPalette: PaletteName = 'garnet'
  private currentTheme: Theme = 'light'

  constructor() {
    this.init()
  }

  private init() {
    try {
      const saved = localStorage.getItem('app_palette') as PaletteName
      if (saved && THEME_PALETTES[saved]) {
        this.currentPalette = saved
      }
    } catch {}
    let savedTheme: string | null = null
    try {
      savedTheme = localStorage.getItem('theme')
    } catch {}
    if (savedTheme === 'light' || savedTheme === 'dark') {
      this.currentTheme = savedTheme
    } else {
      try {
        this.currentTheme = typeof window !== 'undefined' &&
          window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      } catch {
        this.currentTheme = 'light'
      }
    }
    document.documentElement.classList.toggle('dark', this.currentTheme === 'dark')
    this.applyPalette(this.currentPalette)
  }

  public getPalette(): PaletteName {
    return this.currentPalette
  }

  public getTheme(): Theme {
    return this.currentTheme
  }

  public setTheme(theme: Theme) {
    if (theme !== 'light' && theme !== 'dark') return
    this.currentTheme = theme
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem('theme', theme)
    } catch {}
    this.updateThemeColor()
    window.dispatchEvent(new CustomEvent('theme_changed', { detail: theme }))
  }

  public toggleTheme() {
    this.setTheme(this.currentTheme === 'dark' ? 'light' : 'dark')
  }

  public updateThemeColor() {
    if (typeof document === 'undefined') return
    const isDark = this.currentTheme === 'dark'

    const palette = THEME_PALETTES[this.currentPalette]?.colors
    if (!palette) return

    let hexColor: string
    if (isDark) {
      // No modo escuro, utiliza a cor escura de fundo real da paleta ativa (#0d0000 para Garnet)
      hexColor = rgbToHex('15 20 28')
    } else {
      // No modo claro, utiliza a cor primária de destaque (500) da paleta ativa (#6e2d29 para Garnet)
      hexColor = rgbToHex(palette[500])
    }

    let meta = document.querySelector('meta[name="theme-color"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'theme-color')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', hexColor)
  }

  public applyPalette(name: PaletteName) {
    if (!THEME_PALETTES[name]) return
    this.currentPalette = name
    try {
      localStorage.setItem('app_palette', name)
    } catch {}

    const palette = THEME_PALETTES[name].colors
    const root = document.documentElement

    root.style.setProperty('--color-primary-50', palette[50])
    root.style.setProperty('--color-primary-100', palette[100])
    root.style.setProperty('--color-primary-200', palette[200])
    root.style.setProperty('--color-primary-300', palette[300])
    root.style.setProperty('--color-primary-400', palette[400])
    root.style.setProperty('--color-primary-500', palette[500])
    root.style.setProperty('--color-primary-600', palette[600])
    root.style.setProperty('--color-primary-700', palette[700])
    root.style.setProperty('--color-primary-800', palette[800])
    root.style.setProperty('--color-primary-900', palette[900])
    root.style.setProperty('--color-primary-950', palette[950])

    root.style.setProperty('--color-dark-bg-page', '15 20 28')
    root.style.setProperty('--color-dark-bg-card', '24 31 41')
    root.style.setProperty('--color-dark-bg-input', '20 27 36')

    this.updateThemeColor()

    window.dispatchEvent(new CustomEvent('palette_changed', { detail: name }))
  }
}

export const themeManager = new ThemeManager()
