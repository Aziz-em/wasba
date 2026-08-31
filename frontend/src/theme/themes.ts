import { createTheme, Theme } from '@mui/material/styles'
import { arSA } from '@mui/material/locale'

/** وضع الواجهة الرئيسي: فاتح كامل أو داكن كامل */
export type UiThemeKey = 'light' | 'dark'

const sharedTypography = {
  fontFamily: '"Cairo", "Tahoma", "Arial", sans-serif',
  h4: { fontWeight: 700 },
  h5: { fontWeight: 700 },
  h6: { fontWeight: 600 },
  button: { fontWeight: 600 },
}

const sharedComponents = {
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
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: { backgroundImage: 'none' },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: { boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
    },
  },
}

export const UI_THEME_OPTIONS: { value: UiThemeKey; label: string }[] = [
  { value: 'light', label: 'فاتح (Light)' },
  { value: 'dark', label: 'داكن (Dark)' },
]

export function buildTheme(key: string | undefined | null): Theme {
  const mode: UiThemeKey = key === 'dark' ? 'dark' : 'light'

  // توافق مع القيم القديمة المحفوظة في الإعدادات
  // classic | teal | ocean | kids | sunset → light
  // dark → dark

  if (mode === 'dark') {
    return createTheme(
      {
        direction: 'rtl',
        typography: sharedTypography,
        shape: { borderRadius: 12 },
        palette: {
          mode: 'dark',
          primary: { main: '#2dd4bf', light: '#5eead4', dark: '#0d9488', contrastText: '#0f172a' },
          secondary: { main: '#fbbf24', contrastText: '#0f172a' },
          success: { main: '#22c55e' },
          error: { main: '#f87171' },
          warning: { main: '#fbbf24' },
          info: { main: '#38bdf8' },
          background: {
            default: '#0f172a',
            paper: '#1e293b',
          },
          text: {
            primary: '#f1f5f9',
            secondary: '#94a3b8',
          },
          divider: 'rgba(148,163,184,0.16)',
        },
        components: {
          ...sharedComponents,
          MuiTableHead: {
            styleOverrides: {
              root: {
                '& .MuiTableCell-head': {
                  fontWeight: 700,
                  backgroundColor: '#1e293b',
                  color: '#e2e8f0',
                },
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
                backgroundColor: '#1e293b',
              },
            },
          },
          MuiDrawer: {
            styleOverrides: {
              paper: { backgroundColor: '#1e293b' },
            },
          },
        },
      },
      arSA
    )
  }

  // Light — كامل ومتناسق
  return createTheme(
    {
      direction: 'rtl',
      typography: sharedTypography,
      shape: { borderRadius: 12 },
      palette: {
        mode: 'light',
        primary: { main: '#0d9488', light: '#2dd4bf', dark: '#0f766e', contrastText: '#fff' },
        secondary: { main: '#f59e0b', contrastText: '#fff' },
        success: { main: '#16a34a' },
        error: { main: '#dc2626' },
        warning: { main: '#ea580c' },
        info: { main: '#0284c7' },
        background: {
          default: '#f1f5f9',
          paper: '#ffffff',
        },
        text: {
          primary: '#0f172a',
          secondary: '#64748b',
        },
        divider: 'rgba(15,23,42,0.08)',
      },
      components: {
        ...sharedComponents,
        MuiTableHead: {
          styleOverrides: {
            root: {
              '& .MuiTableCell-head': {
                fontWeight: 700,
                backgroundColor: '#f8fafc',
                color: '#334155',
              },
            },
          },
        },
      },
    },
    arSA
  )
}

/** تحويل القيم القديمة إلى light/dark */
export function normalizeUiTheme(key: string | undefined | null): UiThemeKey {
  if (key === 'dark') return 'dark'
  return 'light'
}
