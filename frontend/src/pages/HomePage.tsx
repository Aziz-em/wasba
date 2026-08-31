import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Typography, Grid, Button, Paper, useTheme, alpha } from '@mui/material'
import LoginIcon from '@mui/icons-material/Login'
import GroupsIcon from '@mui/icons-material/Groups'
import LogoutIcon from '@mui/icons-material/Logout'
import CelebrationIcon from '@mui/icons-material/Celebration'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet'
import LockIcon from '@mui/icons-material/Lock'
import AssessmentIcon from '@mui/icons-material/Assessment'
import api from '../api/client'

/** ألوان أزرار سمة الأيقونات فقط — لا تغيّر خلفية الصفحة ولا الكارت */
const btnPalettes: Record<string, Record<string, string>> = {
  rainbow: {
    checkin: '#2e7d32', active: '#1565c0', checkout: '#ef6c00',
    party: '#6a1b9a', treasury: '#00838f', close: '#c62828', reports: '#4527a0',
  },
  neon: {
    checkin: '#00e676', active: '#00b0ff', checkout: '#ffea00',
    party: '#e040fb', treasury: '#1de9b6', close: '#ff1744', reports: '#ff9100',
  },
  kids: {
    checkin: '#43a047', active: '#1e88e5', checkout: '#fb8c00',
    party: '#ec407a', treasury: '#26a69a', close: '#e53935', reports: '#7e57c2',
  },
  ocean: {
    checkin: '#00695c', active: '#0277bd', checkout: '#ef6c00',
    party: '#ad1457', treasury: '#00838f', close: '#b71c1c', reports: '#283593',
  },
  contrast: {
    checkin: '#000000', active: '#0d47a1', checkout: '#e65100',
    party: '#4a148c', treasury: '#004d40', close: '#b71c1c', reports: '#1a237e',
  },
  pastel: {
    checkin: '#81c784', active: '#64b5f6', checkout: '#ffb74d',
    party: '#ba68c8', treasury: '#4db6ac', close: '#e57373', reports: '#9575cd',
  },
  darkblock: {
    checkin: '#00c853', active: '#2979ff', checkout: '#ff6d00',
    party: '#d500f9', treasury: '#00bfa5', close: '#ff1744', reports: '#ffd600',
  },
  metro: {
    checkin: '#4caf50', active: '#2196f3', checkout: '#ff9800',
    party: '#9c27b0', treasury: '#009688', close: '#f44336', reports: '#3f51b5',
  },
}

const icons: Record<string, JSX.Element> = {
  checkin: <LoginIcon sx={{ fontSize: 28, mb: 0.5 }} />,
  active: <GroupsIcon sx={{ fontSize: 28, mb: 0.5 }} />,
  checkout: <LogoutIcon sx={{ fontSize: 28, mb: 0.5 }} />,
  party: <CelebrationIcon sx={{ fontSize: 28, mb: 0.5 }} />,
  treasury: <AccountBalanceWalletIcon sx={{ fontSize: 28, mb: 0.5 }} />,
  close: <LockIcon sx={{ fontSize: 28, mb: 0.5 }} />,
  reports: <AssessmentIcon sx={{ fontSize: 28, mb: 0.5 }} />,
}

export default function HomePage() {
  const [count, setCount] = useState(0)
  const [iconTheme, setIconTheme] = useState('rainbow')
  const nav = useNavigate()
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  useEffect(() => {
    const load = () =>
      api.get('/Visits/active')
        .then(r => setCount(r.data.reduce((sum: number, visit: any) => sum + (visit.childrenCount || 1), 0)))
        .catch(() => {})
    load()
    api.get('/Settings').then(r => setIconTheme(r.data.iconTheme || 'rainbow')).catch(() => {})
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [])

  const colors = btnPalettes[iconTheme] || btnPalettes.rainbow

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
          borderRadius: 3,
          bgcolor: colors[key] || theme.palette.primary.main,
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          boxShadow: isDark ? '0 4px 14px rgba(0,0,0,0.35)' : '0 4px 14px rgba(0,0,0,0.1)',
          '&:hover': {
            bgcolor: colors[key] || theme.palette.primary.main,
            filter: 'brightness(1.08)',
          },
        }}
      >
        {icons[key]}
        {label}
      </Button>
    </Grid>
  )

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 120px)',
        p: { xs: 1, sm: 3 },
        borderRadius: 3,
        // خلفية الصفحة من الثيم — متناسقة مع الوضع الفاتح/الداكن
        bgcolor: 'transparent',
      }}
    >
      {/* كارت العدد — نفس لون الورق في الثيم (مش أبيض ثابت) */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          textAlign: 'center',
          borderRadius: 4,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: isDark
            ? '0 8px 24px rgba(0,0,0,0.35)'
            : '0 8px 24px rgba(15,23,42,0.06)',
        }}
      >
        <Typography color="text.secondary" fontWeight={600}>
          الأطفال النشطون الآن
        </Typography>
        <Typography
          variant="h2"
          fontWeight={800}
          sx={{ color: 'primary.main', mt: 0.5 }}
        >
          {count}
        </Typography>
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
  )
}
