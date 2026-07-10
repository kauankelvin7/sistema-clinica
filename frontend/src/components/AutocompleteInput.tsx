import { useState, useEffect, useRef } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { normalizeText } from '../utils/normalize'

interface AutocompleteOption {
  label: string
  value: any
  data?: any
}

interface AutocompleteInputProps {
  value: string
  onChange: (value: string) => void
  onSelect?: (option: AutocompleteOption) => void
  /** Chamada com o termo de busca atual. Quando definida, desativa o filtro local
   *  e usa as `options` diretamente (já filtradas pelo servidor via debounce externo). */
  onSearch?: (query: string) => void
  placeholder?: string
  options: AutocompleteOption[]
  minChars?: number
  className?: string
  disabled?: boolean
  /** Exibe spinner enquanto aguarda resposta do servidor */
  isLoading?: boolean
}

export default function AutocompleteInput({
  value,
  onChange,
  onSelect,
  onSearch,
  placeholder,
  options,
  minChars = 2,
  className = '',
  disabled = false,
  isLoading = false,
}: AutocompleteInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredOptions, setFilteredOptions] = useState<AutocompleteOption[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value.length >= minChars) {
      if (onSearch) {
        // Modo assíncrono: usa as options diretamente (já vieram filtradas da API)
        setFilteredOptions(options)
        setShowSuggestions(options.length > 0 || isLoading)
      } else {
        // Modo local: filtra as options em memória (comportamento original)
        const normalizedSearch = normalizeText(value)
        const filtered = options.filter(option =>
          normalizeText(option.label).includes(normalizedSearch)
        )
        setFilteredOptions(filtered)
        setShowSuggestions(filtered.length > 0)
      }
    } else {
      setShowSuggestions(false)
      setFilteredOptions([])
    }
  }, [value, options, minChars, onSearch, isLoading])

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    if (onSearch) {
      onSearch(newValue)
    }
  }

  const handleSelect = (option: AutocompleteOption) => {
    onChange(option.label)
    onSelect?.(option)
    setShowSuggestions(false)
    setSelectedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault()
      handleSelect(filteredOptions[selectedIndex])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`input-field pr-10 ${className}`}
        />
        {value.length >= minChars && (
          isLoading
            ? <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500 animate-spin" />
            : <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500 dark:text-orange-400" />
        )}
      </div>

      {showSuggestions && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-900 border-2 border-orange-200 dark:border-orange-700/40 rounded-xl shadow-xl max-h-60 overflow-y-auto backdrop-blur-md">
          <div className="p-1">
            {isLoading ? (
              <div className="flex items-center gap-3 px-3 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                <Loader2 className="w-4 h-4 animate-spin text-orange-500 shrink-0" />
                Buscando pacientes...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-3 py-3 text-sm text-zinc-400 dark:text-zinc-500 text-center">
                Nenhum resultado encontrado
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors
                    ${index === selectedIndex
                      ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-900 dark:text-orange-100'
                      : 'hover:bg-orange-50 dark:hover:bg-orange-500/10 text-zinc-700 dark:text-zinc-200'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <Search className="w-3 h-3 text-orange-500 shrink-0" />
                    <span className="font-medium">{option.label}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
