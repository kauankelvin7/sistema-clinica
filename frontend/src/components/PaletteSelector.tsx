import { useState, useEffect, useRef, useId } from 'react'
import { Palette, Check, ChevronDown } from 'lucide-react'
import { themeManager, THEME_PALETTES, type PaletteName } from '../utils/themeManager'

export default function PaletteSelector() {
  const [currentPalette, setCurrentPalette] = useState<PaletteName>(() => themeManager.getPalette())
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    const handlePaletteChange = () => setCurrentPalette(themeManager.getPalette())
    window.addEventListener('palette_changed', handlePaletteChange)
    return () => window.removeEventListener('palette_changed', handlePaletteChange)
  }, [])

  const handleSelectPalette = (paletteName: PaletteName) => {
    themeManager.applyPalette(paletteName)
    setIsOpen(false)
  }

  const selected = THEME_PALETTES[currentPalette] || THEME_PALETTES.garnet

  return (
    <div className="relative inline-block text-left z-30" ref={menuRef} onKeyDown={(event) => {
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault()
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }}>
      <button
        type="button"
        ref={buttonRef}
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen(prev => !prev)}
        className="flex min-h-11 items-center gap-2 px-3 py-1.5 rounded-xl bg-panel/90 hover:bg-canvas border border-border text-xs font-semibold text-ink transition-all duration-200 shadow-xs active:scale-95"
        title="Alternar Paleta de Cores do Sistema"
      >
        <Palette className="w-4 h-4 text-brand-foreground transition-transform duration-300 group-hover:rotate-45" />
        <span className="hidden sm:inline font-bold text-xs">{selected.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform duration-200 ${isOpen ? 'rotate-180 text-brand-foreground' : ''}`} />
      </button>

      {isOpen && (
        <div id={menuId} className="absolute right-0 mt-2 w-52 rounded-2xl bg-panel/95 backdrop-blur-xl border border-border shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="px-2.5 py-1.5 border-b border-border mb-1 flex items-center gap-2">
            <Palette className="w-3.5 h-3.5 text-brand-foreground" />
            <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Temas de Cores</span>
          </div>

          <div className="space-y-1">
            {Object.values(THEME_PALETTES).map((pal) => {
              const isSelected = pal.name === currentPalette
              return (
                <button
                  key={pal.name}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => handleSelectPalette(pal.name as PaletteName)}
                  className={`w-full min-h-11 flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isSelected
                      ? 'bg-brand/10 text-brand-foreground border border-brand/30'
                      : 'text-ink hover:bg-canvas border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Previsualizador de Cor */}
                    <div
                      className="w-4 h-4 rounded-full border border-black/20 shadow-xs shrink-0"
                      style={{ backgroundColor: `rgb(${pal.colors[500]})` }}
                    />
                    <span>{pal.label}</span>
                  </div>

                  {isSelected && <Check className="w-3.5 h-3.5 text-brand-foreground" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
