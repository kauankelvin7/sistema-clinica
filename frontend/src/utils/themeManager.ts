import { colorThemes, colorThemeIds, type ColorTheme } from './leveThemes'

export type LegacyPaletteName = 'garnet' | 'emerald' | 'sapphire' | 'amber' | 'graphite'
export type LevePaletteName = `leve-${ColorTheme}`
export type PaletteName = LegacyPaletteName | LevePaletteName
export type Theme = 'light' | 'dark'
export type Appearance = Theme | 'system'

export interface ColorPalette {
  name: PaletteName
  label: string
  leve?: ColorTheme
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

const LEGACY_PALETTES: Record<LegacyPaletteName, ColorPalette> = {
  garnet: {
    name: 'garnet',
    label: 'Bordô',
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
    label: 'Esmeralda',
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
    label: 'Safira',
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
    label: 'Dourado',
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
    label: 'Areia',
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


const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const
type Shade = typeof STEPS[number]
const MIXES: Record<Shade, [string, number]> = {
  50: ['ffffff', .95], 100: ['ffffff', .87], 200: ['ffffff', .72],
  300: ['ffffff', .52], 400: ['ffffff', .24], 500: ['ffffff', 0],
  600: ['000000', .15], 700: ['000000', .31], 800: ['000000', .48],
  900: ['000000', .65], 950: ['000000', .81],
}

function parseHex(value: string): [number, number, number] {
  const hex = value.replace('#', '')
  return [0, 2, 4].map((offset) => parseInt(hex.slice(offset, offset + 2), 16)) as [number, number, number]
}

function rgb(value: string): string {
  return parseHex(value).join(' ')
}

function mix(color: string, other: string, part: number): string {
  const a = parseHex(color), b = parseHex(other)
  return a.map((component, index) => Math.round(component * (1 - part) + b[index] * part)).join(' ')
}

function shades(accent: string): Pick<ColorPalette['colors'], Shade> {
  return Object.fromEntries(STEPS.map((step) => {
    const [target, amount] = MIXES[step]
    return [step, mix(accent, target, amount)]
  })) as Pick<ColorPalette['colors'], Shade>
}

// Leve uses independently defined light/dark surfaces, not just a recolored accent.
// Prefix the 11 IDs to preserve all five existing clinical theme preferences.
const THEME_NAMES: Record<ColorTheme, string> = {
  green: 'Sálvia', purple: 'Lavanda', blue: 'Brisa',
  red: 'Rubi', orange: 'Terracota', pink: 'Rosé',
  teal: 'Oceano', indigo: 'Índigo', amber: 'Mel',
  brown: 'Cacau', monochrome: 'Grafite',
}

const LEVE_PALETTES = Object.fromEntries(colorThemeIds.map((id) => {
  const source = colorThemes[id]
  const name = `leve-${id}` as LevePaletteName
  const colors: ColorPalette['colors'] = {
    ...shades(source.accent),
    bgPage: rgb(source.dark.canvas),
    bgCard: rgb(source.dark.solid),
    bgInput: rgb(source.dark.field),
  }
  return [name, { name, label: THEME_NAMES[id], leve: id, colors }]
})) as Record<LevePaletteName, ColorPalette>

export const THEME_PALETTES: Record<PaletteName, ColorPalette> = {
  ...LEGACY_PALETTES,
  ...LEVE_PALETTES,
}

function toHex(rgbStr: string): string {
  const [r, g, b] = rgbStr.trim().split(/\s+/).map(Number)
  return `#${[r, g, b].map((n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0')).join('')}`
}

const SEMANTIC_KEYS = [
  '--color-light-bg-page', '--color-light-panel', '--color-light-input',
  '--color-light-ink', '--color-light-muted', '--color-light-border',
  '--color-dark-bg-page', '--color-dark-bg-card', '--color-dark-bg-input',
  '--color-dark-ink', '--color-dark-muted', '--color-dark-border',
  '--color-dark-on-brand',
] as const

class ThemeManager {
  private currentPalette: PaletteName = 'garnet'
  private appearance: Appearance = 'system'
  private currentTheme: Theme = 'light'
  private media: MediaQueryList | null = null

  constructor() {
    if (typeof document === 'undefined' || typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem('app_palette')
      if (stored && Object.prototype.hasOwnProperty.call(THEME_PALETTES, stored)) {
        this.currentPalette = stored as PaletteName
      }
      const mode = localStorage.getItem('theme')
      if (mode === 'light' || mode === 'dark' || mode === 'system') {
        this.appearance = mode
      }
    } catch { /* Appearance remains usable without local storage. */ }
    if (typeof window.matchMedia === 'function') {
      this.media = window.matchMedia('(prefers-color-scheme: dark)')
      this.media.addEventListener('change', () => {
        if (this.appearance === 'system') this.refresh()
      })
    }
    window.addEventListener('storage', (event) => {
      if (event.key !== 'theme' && event.key !== 'app_palette') return
      try {
        const saved = localStorage.getItem('app_palette')
        if (saved && Object.prototype.hasOwnProperty.call(THEME_PALETTES, saved)) this.currentPalette = saved as PaletteName
        const mode = localStorage.getItem('theme')
        this.appearance = mode === 'light' || mode === 'dark' || mode === 'system' ? mode : 'system'
      } catch { /* Keep active session preferences. */ }
      this.refresh()
      window.dispatchEvent(new CustomEvent('palette_changed', { detail: this.currentPalette }))
    })
    this.refresh()
  }

  private refresh() {
    this.currentTheme = this.appearance === 'system'
      ? (this.media?.matches ? 'dark' : 'light')
      : this.appearance
    const root = document.documentElement
    root.classList.toggle('dark', this.currentTheme === 'dark')
    root.dataset.appearance = this.currentTheme
    root.dataset.appearancePreference = this.appearance
    root.style.colorScheme = this.currentTheme
    this.applyColors()
    this.updateThemeColor()
    window.dispatchEvent(new CustomEvent('theme_changed', { detail: this.currentTheme }))
  }

  public getPalette(): PaletteName { return this.currentPalette }
  public getTheme(): Theme { return this.currentTheme }
  public getAppearance(): Appearance { return this.appearance }

  public setAppearance(next: Appearance) {
    if (next !== 'light' && next !== 'dark' && next !== 'system') return
    this.appearance = next
    try { localStorage.setItem('theme', next) } catch { /* preference only */ }
    this.refresh()
  }

  public setTheme(next: Theme) { this.setAppearance(next) }
  public toggleTheme() { this.setAppearance(this.currentTheme === 'dark' ? 'light' : 'dark') }

  public applyPalette(name: PaletteName) {
    if (!Object.prototype.hasOwnProperty.call(THEME_PALETTES, name)) return
    this.currentPalette = name
    try { localStorage.setItem('app_palette', name) } catch { /* preference only */ }
    this.applyColors()
    this.updateThemeColor()
    window.dispatchEvent(new CustomEvent('palette_changed', { detail: name }))
  }

  private applyColors() {
    const root = document.documentElement
    const chosen = THEME_PALETTES[this.currentPalette]
    const source = chosen.leve ? colorThemes[chosen.leve] : null
    const primary = source && this.currentTheme === 'dark'
      ? shades(source.dark.accent)
      : chosen.colors

    for (const step of STEPS) root.style.setProperty(`--color-primary-${step}`, primary[step])
    root.dataset.palette = this.currentPalette

    if (!source) {
      for (const key of SEMANTIC_KEYS) root.style.removeProperty(key)
      root.style.setProperty('--color-dark-bg-page', '15 20 28')
      root.style.setProperty('--color-dark-bg-card', '24 31 41')
      root.style.setProperty('--color-dark-bg-input', '20 27 36')
      return
    }

    const dark = source.dark
    const ink = mix(source.accent, '1e2931', .8)
    root.style.setProperty('--color-light-bg-page', rgb(source.canvas))
    root.style.setProperty('--color-light-panel', '255 253 248')
    root.style.setProperty('--color-light-input', '252 253 249')
    root.style.setProperty('--color-light-ink', ink)
    root.style.setProperty('--color-light-muted', mix(source.accent, '566272', .73))
    root.style.setProperty('--color-light-border', mix(source.accent, 'ffffff', .75))
    root.style.setProperty('--color-dark-bg-page', rgb(dark.canvas))
    root.style.setProperty('--color-dark-bg-card', rgb(dark.solid))
    root.style.setProperty('--color-dark-bg-input', rgb(dark.field))
    root.style.setProperty('--color-dark-ink', rgb(dark.text))
    root.style.setProperty('--color-dark-muted', rgb(dark.textMuted))
    root.style.setProperty('--color-dark-border', rgb(dark.border))
    root.style.setProperty('--color-dark-on-brand', rgb(dark.actionForeground))
  }

  public updateThemeColor() {
    if (typeof document === 'undefined') return
    const palette = THEME_PALETTES[this.currentPalette]
    const source = palette.leve ? colorThemes[palette.leve] : null
    const color = source
      ? (this.currentTheme === 'dark' ? source.dark.canvas : source.canvas)
      : (this.currentTheme === 'dark' ? toHex('15 20 28') : toHex(palette.colors[500]))
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'theme-color'
      document.head.appendChild(meta)
    }
    meta.content = color
  }
}

export const themeManager = new ThemeManager()
