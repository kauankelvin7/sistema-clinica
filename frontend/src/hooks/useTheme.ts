import { useCallback, useEffect, useState } from 'react'
import { themeManager, type Theme, type Appearance } from '../utils/themeManager'

export function useTheme() {
  const [theme, setCurrentTheme] = useState<Theme>(() => themeManager.getTheme())
  const [appearance, setCurrentAppearance] = useState<Appearance>(() => themeManager.getAppearance())

  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const nextTheme = (event as CustomEvent<Theme>).detail
      if (nextTheme === 'light' || nextTheme === 'dark') setCurrentTheme(nextTheme)
      setCurrentAppearance(themeManager.getAppearance())
    }
    window.addEventListener('theme_changed', handleThemeChange)
    return () => window.removeEventListener('theme_changed', handleThemeChange)
  }, [])

  const setTheme = useCallback((nextTheme: Theme) => themeManager.setTheme(nextTheme), [])
  const setAppearance = useCallback((next: Appearance) => themeManager.setAppearance(next), [])
  const toggleTheme = useCallback(() => themeManager.toggleTheme(), [])

  return { theme, appearance, setTheme, setAppearance, toggleTheme }
}
