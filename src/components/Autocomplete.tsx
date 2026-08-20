import { useState, useEffect, useRef, useMemo } from 'react'
import clsx from 'clsx'
import { Check, ChevronsUpDown, Search, X } from 'lucide-react'

interface Option {
  id: string | number
  label: string
  [key: string]: any
}

interface AutocompleteProps {
  options: Option[]
  value: string | number
  onChange: (value: string | number) => void
  onSelectOption?: (option: Option) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  label?: string
  required?: boolean
}

export default function Autocomplete({
  options,
  value,
  onChange,
  onSelectOption,
  placeholder = 'Buscar...',
  disabled = false,
  className = '',
  label,
  required = false
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = useMemo(() =>
    options.find(opt => opt.id.toString() === value?.toString()),
    [options, value]
  )

  useEffect(() => {
    if (isOpen) {
      setSearch('')
    }
  }, [isOpen])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredOptions = useMemo(() => {
    if (!search) return options
    const searchLower = search.toLowerCase()
    return options.filter(opt =>
      opt.label.toLowerCase().includes(searchLower)
    )
  }, [options, search])

  const handleSelect = (option: Option) => {
    onChange(option.id)
    onSelectOption?.(option)
    setIsOpen(false)
    setSearch('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setSearch('')
  }

  return (
    <div className={clsx("relative space-y-1.5", className)} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={clsx(
          "relative flex items-center w-full px-3 py-2 border transition-all duration-200 rounded-md cursor-pointer",
          disabled ? "bg-gray-50 dark:bg-gray-900/50 opacity-50 cursor-not-allowed" : "bg-white dark:bg-gray-700 hover:border-blue-400 dark:hover:border-blue-500",
          isOpen ? "ring-2 ring-blue-500/20 border-blue-500" : "border-gray-300 dark:border-gray-700"
        )}
      >
        <span className={clsx(
          "flex-1 truncate text-sm",
          !selectedOption ? "text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-white"
        )}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <div className="flex items-center gap-1 ml-2">
          {selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full text-gray-400 dark:text-gray-500"
            >
              <X size={14} />
            </button>
          )}
          <ChevronsUpDown size={16} className="text-gray-400 dark:text-gray-500 shrink-0" />
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-[60] w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top">
          <div className="p-2 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2 bg-gray-50/50 dark:bg-gray-900/20">
            <Search size={14} className="text-gray-400" />
            <input
              autoFocus
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm p-1 text-gray-900 dark:text-white placeholder:text-gray-400"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="max-h-60 overflow-y-auto p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => handleSelect(option)}
                  className={clsx(
                    "flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors text-sm",
                    option.id === value
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 pointer-events-none"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {option.id === value && <Check size={14} className="shrink-0" />}
                </div>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-sm text-gray-400 dark:text-gray-500">
                No se encontraron resultados
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
