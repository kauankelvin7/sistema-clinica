import { useCallback, useEffect, useState } from 'react'
import { themeManager, type Theme } from '../utils/themeManager'

export function useTheme() {
  const [theme, setCurrentTheme] = useState<Theme>(() => themeManager.getTheme())

  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const nextTheme = (event as CustomEvent<Theme>).detail
      if (nextTheme === 'light' || nextTheme === 'dark') setCurrentTheme(nextTheme)
    }
    window.addEventListener('theme_changed', handleThemeChange)
    return () => window.removeEventListener('theme_changed', handleThemeChange)
  }, [])

  const setTheme = useCallback((nextTheme: Theme) => themeManager.setTheme(nextTheme), [])
  const toggleTheme = useCallback(() => themeManager.toggleTheme(), [])

  return { theme, setTheme, toggleTheme }
}
