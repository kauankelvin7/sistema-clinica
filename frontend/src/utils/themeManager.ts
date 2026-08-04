export type PaletteName = 'garnet' | 'emerald' | 'sapphire' | 'amber'

export interface ColorPalette {
  name: string
  label: string
  colors: {
    primary: string
    primaryDark: string
    primaryLight: string
    bgDarkPage: string
    bgDarkCard: string
    bgDarkInput: string
    borderDark: string
  }
}

export const THEME_PALETTES: Record<PaletteName, ColorPalette> = {
  garnet: {
    name: 'garnet',
    label: 'Garnet Burgundy (Escuro)',
    colors: {
      primary: '110 45 41',         // #6e2d29
      primaryDark: '61 4 7',         // #3d0407
      primaryLight: '166 84 77',    // #a6544d
      bgDarkPage: '13 0 0',         // #0d0000
      bgDarkCard: '26 3 3',         // #1a0303
      bgDarkInput: '18 2 2',        // #120202
      borderDark: '48 8 8',
    },
  },
  emerald: {
    name: 'emerald',
    label: 'Emerald Health',
    colors: {
      primary: '5 150 105',
      primaryDark: '4 120 87',
      primaryLight: '52 211 153',
      bgDarkPage: '6 30 22',
      bgDarkCard: '10 45 34',
      bgDarkInput: '8 38 28',
      borderDark: '16 65 48',
    },
  },
  sapphire: {
    name: 'sapphire',
    label: 'Sapphire Clinical',
    colors: {
      primary: '29 78 216',
      primaryDark: '30 58 138',
      primaryLight: '96 165 250',
      bgDarkPage: '10 20 40',
      bgDarkCard: '15 30 60',
      bgDarkInput: '12 24 48',
      borderDark: '25 50 100',
    },
  },
  amber: {
    name: 'amber',
    label: 'Amber Gold',
    colors: {
      primary: '217 119 6',
      primaryDark: '180 83 9',
      primaryLight: '251 191 36',
      bgDarkPage: '28 20 10',
      bgDarkCard: '42 30 15',
      bgDarkInput: '35 25 12',
      borderDark: '70 50 25',
    },
  },
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

  public applyPalette(name: PaletteName) {
    if (!THEME_PALETTES[name]) return
    this.currentPalette = name
    try {
      localStorage.setItem('app_palette', name)
    } catch {}

    const palette = THEME_PALETTES[name].colors
    const root = document.documentElement

    root.style.setProperty('--color-primary', palette.primary)
    root.style.setProperty('--color-primary-dark', palette.primaryDark)
    root.style.setProperty('--color-primary-light', palette.primaryLight)
    root.style.setProperty('--color-bg-dark-page', palette.bgDarkPage)
    root.style.setProperty('--color-bg-dark-card', palette.bgDarkCard)
    root.style.setProperty('--color-bg-dark-input', palette.bgDarkInput)
    root.style.setProperty('--color-border-dark', palette.borderDark)

    window.dispatchEvent(new CustomEvent('palette_changed', { detail: name }))
  }
}

export const themeManager = new ThemeManager()
