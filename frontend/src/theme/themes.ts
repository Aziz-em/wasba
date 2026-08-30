import { createTheme, Theme } from '@mui/material/styles'
import { arSA } from '@mui/material/locale'

export type UiThemeKey = 'classic' | 'teal' | 'ocean' | 'kids' | 'sunset' | 'dark'

const base = {
  direction: 'rtl' as const,
  typography: {
    fontFamily: '"Cairo", "Tahoma", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none' as const,
          borderRadius: 10,
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 700,
            backgroundColor: '#f8fafc',
          },
        },
      },
    },
  },
}

const palettes: Record<UiThemeKey, any> = {
  classic: {
    mode: 'light',
    primary: { main: '#1565c0', light: '#42a5f5', dark: '#0d47a1' },
    secondary: { main: '#00838f' },
    background: { default: '#f5f7fb', paper: '#ffffff' },
  },
  teal: {
    mode: 'light',
    primary: { main: '#0d9488', light: '#2dd4bf', dark: '#0f766e' },
    secondary: { main: '#f59e0b', light: '#fbbf24', dark: '#d97706' },
    success: { main: '#16a34a' },
    error: { main: '#dc2626' },
    background: { default: '#f1f5f9', paper: '#ffffff' },
    text: { primary: '#0f172a', secondary: '#64748b' },
  },
  ocean: {
    mode: 'light',
    primary: { main: '#0284c7', light: '#38bdf8', dark: '#0369a1' },
    secondary: { main: '#06b6d4' },
    background: { default: '#f0f9ff', paper: '#ffffff' },
  },
  kids: {
    mode: 'light',
    primary: { main: '#7c3aed', light: '#a78bfa', dark: '#5b21b6' },
    secondary: { main: '#f43f5e' },
    background: { default: '#faf5ff', paper: '#ffffff' },
  },
  sunset: {
    mode: 'light',
    primary: { main: '#ea580c', light: '#fb923c', dark: '#c2410c' },
    secondary: { main: '#e11d48' },
    background: { default: '#fff7ed', paper: '#ffffff' },
  },
  dark: {
    mode: 'dark',
    primary: { main: '#2dd4bf', light: '#5eead4', dark: '#0d9488' },
    secondary: { main: '#fbbf24' },
    background: { default: '#0f172a', paper: '#1e293b' },
    text: { primary: '#f1f5f9', secondary: '#94a3b8' },
  },
}

export const UI_THEME_OPTIONS: { value: UiThemeKey; label: string }[] = [
  { value: 'classic', label: 'كلاسيك (أزرق)' },
  { value: 'teal', label: 'Teal + Amber (احترافي)' },
  { value: 'ocean', label: 'محيط' },
  { value: 'kids', label: 'أطفال مرح' },
  { value: 'sunset', label: 'غروب' },
  { value: 'dark', label: 'داكن' },
]

export function buildTheme(key: string | undefined | null): Theme {
  const k = (key && key in palettes ? key : 'classic') as UiThemeKey
  const palette = palettes[k]
  const components = { ...base.components }
  if (k === 'dark') {
    components.MuiTableHead = {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 700,
            backgroundColor: '#1e293b',
          },
        },
      },
    }
  }
  return createTheme(
    {
      ...base,
      components,
      palette,
    },
    arSA
  )
}
