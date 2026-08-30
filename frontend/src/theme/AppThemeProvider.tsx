import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import axios from 'axios'
import { buildTheme, UiThemeKey } from './themes'

type Ctx = {
  uiTheme: UiThemeKey
  setUiTheme: (k: UiThemeKey) => void
  refreshTheme: () => void
}

const ThemeCtx = createContext<Ctx>({
  uiTheme: 'classic',
  setUiTheme: () => {},
  refreshTheme: () => {},
})

export function useAppTheme() {
  return useContext(ThemeCtx)
}

export default function AppThemeProvider({ children }: { children: ReactNode }) {
  const [uiTheme, setUiThemeState] = useState<UiThemeKey>(() => {
    const saved = localStorage.getItem('ka_ui_theme') as UiThemeKey | null
    return saved && ['classic', 'teal', 'ocean', 'kids', 'sunset', 'dark'].includes(saved)
      ? saved
      : 'classic'
  })

  const apply = useCallback((k: string | undefined | null) => {
    const key = (k && ['classic', 'teal', 'ocean', 'kids', 'sunset', 'dark'].includes(k)
      ? k
      : 'classic') as UiThemeKey
    setUiThemeState(key)
    localStorage.setItem('ka_ui_theme', key)
  }, [])

  const refreshTheme = useCallback(() => {
    axios.get('/api/Public/branding')
      .then(r => apply(r.data?.uiTheme))
      .catch(() => {})
  }, [apply])

  useEffect(() => {
    refreshTheme()
  }, [refreshTheme])

  const setUiTheme = useCallback((k: UiThemeKey) => {
    apply(k)
  }, [apply])

  const theme = useMemo(() => buildTheme(uiTheme), [uiTheme])

  return (
    <ThemeCtx.Provider value={{ uiTheme, setUiTheme, refreshTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeCtx.Provider>
  )
}
