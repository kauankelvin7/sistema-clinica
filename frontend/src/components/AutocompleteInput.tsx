import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import { normalizeText } from '../utils/normalize'

interface AutocompleteOption {
  label: string
  value: any
}

interface AutocompleteInputProps {
  value: string
  onChange: (value: string) => void
  onSelect?: (option: AutocompleteOption) => void
  placeholder?: string
  options: AutocompleteOption[]
  minChars?: number
  className?: string
  disabled?: boolean
}

export default function AutocompleteInput({
  value,
  onChange,
  onSelect,
  placeholder,
  options,
  minChars = 2,
  className = '',
  disabled = false
}: AutocompleteInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredOptions, setFilteredOptions] = useState<AutocompleteOption[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value.length >= minChars) {
      const normalizedSearch = normalizeText(value)
      const filtered = options.filter(option =>
        normalizeText(option.label).includes(normalizedSearch)
      )
      setFilteredOptions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setShowSuggestions(false)
      setFilteredOptions([])
    }
  }, [value, options, minChars])

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
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`input-field pr-10 ${className}`}
        />
        {value.length >= minChars && (
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 dark:text-emerald-400" />
        )}
      </div>

      {showSuggestions && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900/95 border-2 border-emerald-200 dark:border-emerald-700/50 rounded-lg shadow-lg max-h-60 overflow-y-auto backdrop-blur-md">
          <div className="p-1">
            {filteredOptions.map((option, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelect(option)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm
                  ${index === selectedIndex
                    ? 'bg-emerald-100 dark:bg-emerald-800/60 text-emerald-900 dark:text-emerald-50'
                    : 'hover:bg-emerald-50 dark:hover:bg-emerald-900/40 text-gray-700 dark:text-gray-100'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Search className="w-3 h-3 text-emerald-600" />
                  <span className="font-medium">{option.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
