import { useTheme as useProviderTheme } from '../../providers/theme-provider'

export type Theme = 'light' | 'dark'

export function useTheme() {
  const { theme, setTheme } = useProviderTheme()
  const resolvedTheme: Theme = theme === 'dark' ? 'dark' : 'light'

  return {
    theme: resolvedTheme,
    setTheme,
    toggleTheme: () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'),
  }
}
