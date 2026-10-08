import { useUiCopy } from '../utils/uiCopy'
import { useState, useEffect, useRef } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { normalizeText } from '../utils/normalize'

interface AutocompleteOption {
  label: string
  value: any
  data?: any
}

interface AutocompleteInputProps {
  id: string
  value: string
  onChange: (value: string) => void
  onSelect?: (option: AutocompleteOption) => void
  /** Complete a single verified local match on Tab/Enter or when leaving the field. */
  autoSelectUnique?: boolean
  /** Prevent silent replacement when existing identifying fields disagree. */
  canAutoSelect?: (option: AutocompleteOption) => boolean
  /** Chamada com o termo de busca atual. Quando definida, desativa o filtro local
   *  e usa as `options` diretamente (já filtradas pelo servidor via debounce externo). */
  onSearch?: (query: string) => void
  placeholder?: string
  options: AutocompleteOption[]
  minChars?: number
  className?: string
  disabled?: boolean
  'aria-describedby'?: string
  /** Exibe spinner enquanto aguarda resposta do servidor */
  isLoading?: boolean
}

export default function AutocompleteInput({
  id,
  value,
  onChange,
  onSelect,
  autoSelectUnique = false,
  canAutoSelect,
  onSearch,
  placeholder,
  options,
  minChars = 2,
  className = '',
  disabled = false,
  'aria-describedby': describedBy,
  isLoading = false,
}: AutocompleteInputProps) {
  const c = useUiCopy()
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredOptions, setFilteredOptions] = useState<AutocompleteOption[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dismissedValue = useRef<string | null>(null)

  const uniqueMatch = (): AutocompleteOption | null => {
    if (!autoSelectUnique || onSearch || isLoading || disabled) return null
    const query = normalizeText(value).trim().replace(/\s+/g, ' ')
    if (query.length < 5) return null
    // Examine the FULL local directory: a listbox limited to 8 records
    // cannot establish that a name is unique.
    const matches = options.filter((option) =>
      normalizeText(option.label).trim().replace(/\s+/g, ' ').startsWith(query)
    )
    if (matches.length !== 1) return null
    const candidate = matches[0]
    return canAutoSelect && !canAutoSelect(candidate) ? null : candidate
  }

  useEffect(() => {
    setSelectedIndex(-1)
    if (value.length >= minChars) {
      if (onSearch) {
        // Modo assíncrono: usa as options diretamente (já vieram filtradas da API)
        setFilteredOptions(options.slice(0, 8))

      } else {
        // Modo local: filtra as options em memória (comportamento original)
        const normalizedSearch = normalizeText(value)
        const filtered = options
          .filter(option => normalizeText(option.label).includes(normalizedSearch))
          .slice(0, 8)
        setFilteredOptions(filtered)

      }
    } else {
      setShowSuggestions(false)
      setFilteredOptions([])
    }
    // Results may arrive after focus; keep suggestions open until explicitly dismissed.
    if (value.length >= minChars && inputRef.current === document.activeElement && dismissedValue.current !== value) {
      setShowSuggestions(true)
    }
  }, [value, options, minChars, onSearch, isLoading])

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
        setSelectedIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setSelectedIndex(-1)
    dismissedValue.current = null
    setShowSuggestions(newValue.length >= minChars)
    onChange(newValue)
    if (onSearch) {
      onSearch(newValue)
    }
  }

  const handleSelect = (option: AutocompleteOption) => {
    dismissedValue.current = option.label
    onChange(option.label)
    onSelect?.(option)
    setShowSuggestions(false)
    setSelectedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Tab keeps native focus navigation; Enter must not submit the parent
    // form while accepting a directory record.
    if ((e.key === 'Tab' || e.key === 'Enter') && selectedIndex < 0 &&
        dismissedValue.current !== value) {
      const match = uniqueMatch()
      if (match) {
        if (e.key === 'Enter') e.preventDefault()
        handleSelect(match)
        return
      }
    }
    if (!showSuggestions) {
      if (e.key === 'ArrowDown' && value.length >= minChars) { e.preventDefault(); dismissedValue.current = null; setShowSuggestions(true); setSelectedIndex(0) }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === 'Enter' && selectedIndex >= 0 && selectedIndex < filteredOptions.length) {
      e.preventDefault()
      handleSelect(filteredOptions[selectedIndex])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      dismissedValue.current = value
      setShowSuggestions(false)
      setSelectedIndex(-1)
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={(event) => { dismissedValue.current = null; setShowSuggestions(event.currentTarget.value.length >= minChars) }}
          onBlur={() => {
            // No extra click required for a single unambiguous match.
            // Never auto-select after Escape or if identifiers conflict.
            const match = dismissedValue.current === value ? null : uniqueMatch()
            if (match) handleSelect(match)
            else { dismissedValue.current = value; setShowSuggestions(false) }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          aria-controls={`${id}-listbox`}
          aria-activedescendant={showSuggestions && selectedIndex >= 0 && selectedIndex < filteredOptions.length
            ? `${id}-option-${selectedIndex}`
            : undefined}
          aria-describedby={describedBy}
          className={`input-field pr-10 ${className}`}
        />
        {value.length >= minChars && (
          isLoading
            ? <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-garnet-500 animate-spin" aria-hidden="true" />
            : <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-garnet-500 dark:text-garnet-400" aria-hidden="true" />
        )}
      </div>

      <div
        hidden={!showSuggestions}
        className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-h-60 overflow-y-auto backdrop-blur-md"
      >
          <div className="p-1">
            {isLoading ? (
              <div role="status" className="flex items-center gap-3 px-3 py-3 text-sm text-zinc-500 dark:text-zinc-400">
                <Loader2 className="w-4 h-4 animate-spin text-garnet-500 shrink-0" aria-hidden="true" />
                {c.searching}
              </div>
            ) : filteredOptions.length === 0 ? (
              <div role="status" className="px-3 py-3 text-sm text-muted text-center">
                {c.noResults}
              </div>
            ) : null}
            {showSuggestions && !isLoading && uniqueMatch() && (
              <p className="px-3 pb-2 text-[11px] text-muted" aria-hidden="true">
                {c.autoCompleteHint}
              </p>
            )}
            <div
              id={`${id}-listbox`}
              role="listbox"
              aria-busy={isLoading}
              hidden={isLoading || filteredOptions.length === 0}
            >
              {filteredOptions.map((option, index) => (
                <div
                  key={index}
                  id={`${id}-option-${index}`}
                  role="option"
                  aria-selected={index === selectedIndex}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSelect(option)}
                  className={`w-full min-h-11 text-left px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer
                    ${index === selectedIndex
                      ? 'bg-garnet-500/10 text-garnet-700 dark:bg-garnet-500/20 dark:text-garnet-200'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/80 text-zinc-700 dark:text-zinc-200'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <Search className="w-3 h-3 text-garnet-500 shrink-0" aria-hidden="true" />
                    <span className="font-medium">{option.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
      </div>
    </div>
  )
}
