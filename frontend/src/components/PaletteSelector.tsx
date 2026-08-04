import { useState, useEffect, useRef } from 'react'
import { Palette, Check, ChevronDown } from 'lucide-react'
import { themeManager, THEME_PALETTES, PaletteName } from '../utils/themeManager'

export default function PaletteSelector() {
  const [currentPalette, setCurrentPalette] = useState<PaletteName>(() => themeManager.getPalette())
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectPalette = (paletteName: PaletteName) => {
    themeManager.applyPalette(paletteName)
    setCurrentPalette(paletteName)
    setIsOpen(false)
  }

  const selected = THEME_PALETTES[currentPalette] || THEME_PALETTES.garnet

  return (
    <div className="relative inline-block text-left z-30" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100/90 dark:bg-zinc-800/60 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/60 border border-zinc-200/80 dark:border-zinc-700/60 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-all duration-200 shadow-xs active:scale-95"
        title="Alternar Paleta de Cores do Sistema"
      >
        <Palette className="w-4 h-4 text-garnet-500 transition-transform duration-300 group-hover:rotate-45" />
        <span className="hidden sm:inline font-bold text-xs">{selected.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-garnet-500' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/90 dark:border-zinc-800/90 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="px-2.5 py-1.5 border-b border-zinc-100 dark:border-zinc-800/60 mb-1 flex items-center gap-2">
            <Palette className="w-3.5 h-3.5 text-garnet-500" />
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Temas de Cores</span>
          </div>

          <div className="space-y-1">
            {Object.values(THEME_PALETTES).map((pal) => {
              const isSelected = pal.name === currentPalette
              return (
                <button
                  key={pal.name}
                  type="button"
                  onClick={() => handleSelectPalette(pal.name as PaletteName)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isSelected
                      ? 'bg-garnet-500/10 text-garnet-600 dark:text-garnet-400 border border-garnet-500/30'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 border border-transparent'
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

                  {isSelected && <Check className="w-3.5 h-3.5 text-garnet-500" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
