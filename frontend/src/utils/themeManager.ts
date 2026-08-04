export type PaletteName = 'garnet' | 'emerald' | 'sapphire' | 'amber'

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
      50: '249 234 234',
      100: '240 206 205',
      200: '225 157 154',
      300: '202 117 111',
      400: '166 84 77',    // #a6544d (Hex 5)
      500: '110 45 41',    // #6e2d29 (Hex 4)
      600: '61 4 7',       // #3d0407 (Hex 3)
      700: '35 5 3',       // #230503 (Hex 2)
      800: '23 2 2',
      900: '13 0 0',       // #0d0000 (Hex 1)
      950: '5 0 0',
      bgPage: '13 0 0',
      bgCard: '26 3 3',
      bgInput: '18 2 2',
    },
  },
  emerald: {
    name: 'emerald',
    label: 'Emerald Health',
    colors: {
      50: '236 253 245',
      100: '209 250 229',
      200: '167 243 208',
      300: '110 231 183',
      400: '52 211 153',
      500: '16 185 129',
      600: '5 150 105',
      700: '4 120 87',
      800: '6 78 59',
      900: '6 30 22',
      950: '2 18 13',
      bgPage: '6 30 22',
      bgCard: '10 45 34',
      bgInput: '8 38 28',
    },
  },
  sapphire: {
    name: 'sapphire',
    label: 'Sapphire Clinical',
    colors: {
      50: '239 246 255',
      100: '219 234 254',
      200: '191 219 254',
      300: '147 197 253',
      400: '96 165 250',
      500: '59 130 246',
      600: '37 99 235',
      700: '29 78 216',
      800: '30 58 138',
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
      400: '245 158 11',
      500: '217 119 6',
      600: '180 83 9',
      700: '146 64 14',
      800: '120 53 15',
      900: '28 20 10',
      950: '15 10 5',
      bgPage: '28 20 10',
      bgCard: '42 30 15',
      bgInput: '35 25 12',
    },
  },
}

function rgbToHex(rgbStr: string): string {
  if (!rgbStr) return '#6e2d29'
  const parts = rgbStr.split(' ').map(Number)
  if (parts.length < 3 || parts.some(isNaN)) return '#6e2d29'
  const [r, g, b] = parts
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

class ThemeManager {
  private currentPalette: PaletteName = 'garnet'

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
    this.applyPalette(this.currentPalette)
  }

  public getPalette(): PaletteName {
    return this.currentPalette
  }

  public updateThemeColor() {
    if (typeof document === 'undefined') return
    const isDark =
      document.documentElement.classList.contains('dark') ||
      (typeof localStorage !== 'undefined' && localStorage.getItem('theme') === 'dark')

    const palette = THEME_PALETTES[this.currentPalette]?.colors
    if (!palette) return

    let hexColor: string
    if (isDark) {
      // No modo escuro, utiliza a cor escura de fundo real da paleta ativa (#0d0000 para Garnet)
      hexColor = rgbToHex(palette.bgPage || palette[900])
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

    root.style.setProperty('--color-dark-bg-page', palette.bgPage)
    root.style.setProperty('--color-dark-bg-card', palette.bgCard)
    root.style.setProperty('--color-dark-bg-input', palette.bgInput)

    this.updateThemeColor()

    window.dispatchEvent(new CustomEvent('palette_changed', { detail: name }))
  }
}

export const themeManager = new ThemeManager()

