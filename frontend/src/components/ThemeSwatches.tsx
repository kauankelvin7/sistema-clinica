import { Check } from 'lucide-react'
import { colorThemes } from '../utils/leveThemes'
import { THEME_PALETTES, type PaletteName } from '../utils/themeManager'
import './ThemeSwatches.css'

interface ThemeSwatchesProps {
  selected: PaletteName
  onSelect: (name: PaletteName) => void
}

export default function ThemeSwatches({ selected, onSelect }: ThemeSwatchesProps) {
  return (
    <div className="theme-swatch-grid" aria-label="Temas de cores">
      {Object.values(THEME_PALETTES).map((palette) => {
        const original = palette.leve ? colorThemes[palette.leve] : null
        const light = original?.canvas ?? `rgb(${palette.colors[50]})`
        const dark = original?.dark.canvas ?? `rgb(${palette.colors.bgCard})`
        const accent = original?.accent ?? `rgb(${palette.colors[500]})`
        return (
          <button
            key={palette.name}
            type="button"
            className="theme-swatch"
            data-testid={`palette-${palette.name}`}
            aria-label={palette.label}
            aria-pressed={selected === palette.name}
            title={palette.label}
            onClick={() => onSelect(palette.name)}
          >
            <span className="theme-swatch__preview" style={{ background: `linear-gradient(145deg, ${light} 51%, ${dark} 52%)` }}>
              <span className="theme-swatch__accent" style={{ backgroundColor: accent }} />
            </span>
            {selected === palette.name && <span className="theme-swatch__selected" aria-hidden="true"><Check size={11} strokeWidth={3} /></span>}
          </button>
        )
      })}
    </div>
  )
}
