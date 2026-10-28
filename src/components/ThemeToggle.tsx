import { Sun, Moon, Monitor } from 'lucide-react'
import clsx from 'clsx'
import { useTheme } from '../contexts/ThemeContext'

interface ThemeToggleProps {
  className?: string
}

/**
 * Botón para alternar entre modo claro y oscuro.
 * Cuando se está siguiendo la preferencia del navegador, un click fija el tema
 * contrario al actual; el icono muestra el tema efectivo.
 */
export default function ThemeToggle({ className }: ThemeToggleProps) {
  const { isDark, preference, toggleTheme, resetToSystem } = useTheme()

  return (
    <div className={clsx('inline-flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm', className)}>
      <button
        type="button"
        onClick={toggleTheme}
        title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        className="flex items-center justify-center w-8 h-8 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/60 rounded-lg transition-colors"
      >
        {isDark ? <Sun size={16} strokeWidth={1.8} /> : <Moon size={16} strokeWidth={1.8} />}
      </button>

      {preference !== null && (
        <button
          type="button"
          onClick={resetToSystem}
          title="Volver a la preferencia del sistema"
          aria-label="Volver a la preferencia del sistema"
          className="flex items-center justify-center w-8 h-8 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/60 rounded-lg transition-colors"
        >
          <Monitor size={15} strokeWidth={1.8} />
        </button>
      )}
    </div>
  )
}
