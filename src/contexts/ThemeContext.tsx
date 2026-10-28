import { createContext, useCallback, useContext, useEffect, useState } from 'react'

// Preferencia explícita del usuario; `null` significa "seguir al navegador".
type ThemePreference = 'light' | 'dark' | null

interface ThemeContextValue {
  // Tema efectivo aplicado (resuelto a partir de preferencia + sistema)
  isDark: boolean
  // Preferencia guardada (null => sistema)
  preference: ThemePreference
  // Alterna entre light/dark de forma explícita
  toggleTheme: () => void
  // Vuelve a seguir la preferencia del navegador
  resetToSystem: () => void
}

const STORAGE_KEY = 'quipu-theme'

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function readStoredPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // localStorage no disponible (modo incógnito, etc.)
  }
  return null
}

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreference] = useState<ThemePreference>(readStoredPreference)
  const [systemDark, setSystemDark] = useState<boolean>(systemPrefersDark)

  // Escuchar cambios del sistema (relevante cuando preference === null)
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const isDark = preference === null ? systemDark : preference === 'dark'

  // Aplicar la clase al <html> cuando cambia el tema efectivo
  useEffect(() => {
    applyTheme(isDark)
  }, [isDark])

  const toggleTheme = useCallback(() => {
    setPreference((prev) => {
      const current = prev === null ? (systemDark ? 'dark' : 'light') : prev
      const next: Exclude<ThemePreference, null> = current === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // sin persistencia si localStorage falla
      }
      return next
    })
  }, [systemDark])

  const resetToSystem = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignorar
    }
    setPreference(null)
  }, [])

  return (
    <ThemeContext.Provider value={{ isDark, preference, toggleTheme, resetToSystem }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme debe usarse dentro de <ThemeProvider>')
  }
  return ctx
}
