import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Typography, Grid, Button, Paper } from '@mui/material'
import LoginIcon from '@mui/icons-material/Login'
import GroupsIcon from '@mui/icons-material/Groups'
import LogoutIcon from '@mui/icons-material/Logout'
import CelebrationIcon from '@mui/icons-material/Celebration'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import LockIcon from '@mui/icons-material/Lock'
import AssessmentIcon from '@mui/icons-material/Assessment'
import api from '../api/client'

type ThemeConfig = {
  background: string
  paper: string
  radius: number
  shadow: string
  // لون خلفية صريح لكل زر — اختلاف واضح
  btn: Record<string, string>
  text: string
}

const themes: Record<string, ThemeConfig> = {
  rainbow: {
    background: 'linear-gradient(135deg, #fff9c4 0%, #e1f5fe 50%, #f3e5f5 100%)',
    paper: '#ffffff',
    radius: 16,
    shadow: '0 6px 16px rgba(0,0,0,.12)',
    text: '#fff',
    btn: {
      checkin: '#2e7d32',   // أخضر
      active: '#1565c0',    // أزرق
      checkout: '#ef6c00',  // برتقالي
      party: '#6a1b9a',     // بنفسجي
      treasury: '#00838f',  // تركواز
      close: '#c62828',     // أحمر
      reports: '#4527a0'    // نيلي
    }
  },
  neon: {
    background: '#121212',
    paper: '#1e1e1e',
    radius: 12,
    shadow: '0 0 12px rgba(0,255,200,.25)',
    text: '#111',
    btn: {
      checkin: '#00e676',
      active: '#00b0ff',
      checkout: '#ffea00',
      party: '#e040fb',
      treasury: '#1de9b6',
      close: '#ff1744',
      reports: '#ff9100'
    }
  },
  kids: {
    background: 'linear-gradient(180deg, #fff3e0 0%, #e8f5e9 100%)',
    paper: '#fffde7',
    radius: 24,
    shadow: '0 8px 18px rgba(255,111,0,.15)',
    text: '#fff',
    btn: {
      checkin: '#43a047',
      active: '#1e88e5',
      checkout: '#fb8c00',
      party: '#ec407a',
      treasury: '#26a69a',
      close: '#e53935',
      reports: '#7e57c2'
    }
  },
  ocean: {
    background: 'linear-gradient(135deg, #e0f7fa 0%, #e3f2fd 100%)',
    paper: '#ffffff',
    radius: 14,
    shadow: '0 5px 14px rgba(0,96,100,.15)',
    text: '#fff',
    btn: {
      checkin: '#00695c',
      active: '#0277bd',
      checkout: '#ef6c00',
      party: '#ad1457',
      treasury: '#00838f',
      close: '#b71c1c',
      reports: '#283593'
    }
  },
  contrast: {
    background: '#fafafa',
    paper: '#ffffff',
    radius: 8,
    shadow: '0 3px 10px rgba(0,0,0,.1)',
    text: '#fff',
    btn: {
      checkin: '#1b5e20',
      active: '#0d47a1',
      checkout: '#e65100',
      party: '#4a148c',
      treasury: '#004d40',
      close: '#b71c1c',
      reports: '#311b92'
    }
  },
  pastel: {
    background: 'linear-gradient(135deg, #fce4ec 0%, #e8eaf6 100%)',
    paper: '#ffffff',
    radius: 20,
    shadow: '0 6px 14px rgba(0,0,0,.08)',
    text: '#222',
    btn: {
      checkin: '#a5d6a7',
      active: '#90caf9',
      checkout: '#ffcc80',
      party: '#f48fb1',
      treasury: '#80cbc4',
      close: '#ef9a9a',
      reports: '#ce93d8'
    }
  },
  darkblock: {
    background: '#263238',
    paper: '#37474f',
    radius: 10,
    shadow: '0 4px 12px rgba(0,0,0,.35)',
    text: '#fff',
    btn: {
      checkin: '#00c853',
      active: '#2979ff',
      checkout: '#ff6d00',
      party: '#d500f9',
      treasury: '#00bfa5',
      close: '#ff1744',
      reports: '#ffd600'
    }
  },
  metro: {
    background: '#eceff1',
    paper: '#ffffff',
    radius: 4,
    shadow: 'none',
    text: '#fff',
    btn: {
      checkin: '#4caf50',
      active: '#2196f3',
      checkout: '#ff9800',
      party: '#9c27b0',
      treasury: '#009688',
      close: '#f44336',
      reports: '#3f51b5'
    }
  }
}

const icons: Record<string, JSX.Element> = {
  checkin: <LoginIcon sx={{ fontSize: 28, mb: 0.5 }} />,
  active: <GroupsIcon sx={{ fontSize: 28, mb: 0.5 }} />,
  checkout: <LogoutIcon sx={{ fontSize: 28, mb: 0.5 }} />,
  party: <CelebrationIcon sx={{ fontSize: 28, mb: 0.5 }} />,
  treasury: <AccountBalanceWalletIcon sx={{ fontSize: 28, mb: 0.5 }} />,
  close: <LockIcon sx={{ fontSize: 28, mb: 0.5 }} />,
  reports: <AssessmentIcon sx={{ fontSize: 28, mb: 0.5 }} />
}

export default function HomePage() {
  const [count, setCount] = useState(0)
  const [theme, setTheme] = useState('rainbow')
  const nav = useNavigate()

  useEffect(() => {
    const load = () =>
      api.get('/Visits/active')
        .then(r => setCount(r.data.reduce((sum: number, visit: any) => sum + (visit.childrenCount || 1), 0)))
        .catch(() => {})
    load()
    api.get('/Settings').then(r => setTheme(r.data.iconTheme || 'rainbow')).catch(() => {})
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [])

  const themeConfig = themes[theme] || themes.rainbow

  const btn = (label: string, path: string, key: string) => (
    <Grid item xs={6} sm={4} key={path}>
      <Button
        fullWidth
        variant="contained"
        size="large"
        onClick={() => nav(path)}
        sx={{
          py: 2.5,
          fontSize: 15,
          fontWeight: 800,
          borderRadius: themeConfig.radius,
          boxShadow: themeConfig.shadow,
          bgcolor: themeConfig.btn[key] || '#555',
          color: themeConfig.text,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          '&:hover': {
            bgcolor: themeConfig.btn[key] || '#555',
            filter: 'brightness(1.08)',
            boxShadow: themeConfig.shadow
          }
        }}
      >
        {icons[key]}
        {label}
      </Button>
    </Grid>
  )

  return (
    <Box>
      <Box
        sx={{
          minHeight: 'calc(100vh - 120px)',
          p: { xs: 1, sm: 3 },
          borderRadius: themeConfig.radius,
          background: themeConfig.background
        }}
      >
        <Paper
          sx={{
            p: 3,
            mb: 3,
            textAlign: 'center',
            borderRadius: themeConfig.radius,
            background: themeConfig.paper,
            boxShadow: themeConfig.shadow
          }}
        >
          <Typography color="text.secondary">الأطفال النشطون الآن</Typography>
          <Typography variant="h2" fontWeight="bold" color="primary">{count}</Typography>
        </Paper>
        <Grid container spacing={2}>
          {btn('تسجيل دخول طفل', '/checkin', 'checkin')}
          {btn('الأطفال النشيطون الآن', '/active', 'active')}
          {btn('تسجيل خروج طفل', '/checkout', 'checkout')}
          {btn('حفلة', '/party', 'party')}
          {btn('الخزنة', '/treasury', 'treasury')}
          {btn('غلق الوردية', '/close-shift', 'close')}
          {btn('التقارير', '/reports', 'reports')}
        </Grid>
      </Box>
    </Box>
  )
}