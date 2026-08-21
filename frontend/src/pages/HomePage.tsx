import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Typography, Grid, Button, Paper } from '@mui/material'
import api from '../api/client'

type ThemeConfig = {
  background: string
  paper: string
  buttonVariant: 'contained' | 'outlined'
  radius: number
  shadow: string
  colors: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'>
}

const themes: Record<string, ThemeConfig> = {
  classic: { background: '#f5f7fa', paper: '#ffffff', buttonVariant: 'contained', radius: 8, shadow: '0 3px 10px rgba(21, 101, 192, .16)', colors: { checkin: 'success', checkout: 'warning', close: 'error', active: 'primary', party: 'secondary', treasury: 'info', reports: 'primary' } },
  colorful: { background: 'linear-gradient(135deg, #fff8e1 0%, #e0f7fa 52%, #fce4ec 100%)', paper: 'rgba(255,255,255,.9)', buttonVariant: 'contained', radius: 18, shadow: '0 8px 18px rgba(0,0,0,.12)', colors: { checkin: 'success', checkout: 'warning', close: 'error', active: 'info', party: 'secondary', treasury: 'primary', reports: 'error' } },
  simple: { background: '#f7f7f7', paper: '#ffffff', buttonVariant: 'outlined', radius: 4, shadow: 'none', colors: { checkin: 'primary', checkout: 'primary', close: 'primary', active: 'primary', party: 'primary', treasury: 'primary', reports: 'primary' } },
  ocean: { background: 'linear-gradient(135deg, #e0f2f1 0%, #e3f2fd 100%)', paper: '#ffffff', buttonVariant: 'contained', radius: 14, shadow: '0 5px 14px rgba(0, 105, 92, .16)', colors: { checkin: 'info', checkout: 'primary', close: 'secondary', active: 'success', party: 'primary', treasury: 'info', reports: 'secondary' } },
  sunset: { background: 'linear-gradient(135deg, #fff3e0 0%, #fce4ec 100%)', paper: '#fffdf9', buttonVariant: 'contained', radius: 22, shadow: '0 7px 16px rgba(230, 81, 0, .16)', colors: { checkin: 'warning', checkout: 'error', close: 'secondary', active: 'primary', party: 'warning', treasury: 'error', reports: 'secondary' } },
  garden: { background: 'linear-gradient(135deg, #f1f8e9 0%, #e8f5e9 52%, #fffde7 100%)', paper: '#ffffff', buttonVariant: 'contained', radius: 12, shadow: '0 5px 14px rgba(46, 125, 50, .15)', colors: { checkin: 'success', checkout: 'error', close: 'warning', active: 'success', party: 'secondary', treasury: 'info', reports: 'primary' } },
  candy: { background: 'linear-gradient(135deg, #fce4ec 0%, #ede7f6 50%, #e1f5fe 100%)', paper: 'rgba(255,255,255,.92)', buttonVariant: 'contained', radius: 28, shadow: '0 9px 20px rgba(123, 31, 162, .14)', colors: { checkin: 'secondary', checkout: 'warning', close: 'error', active: 'info', party: 'secondary', treasury: 'primary', reports: 'success' } }
}

export default function HomePage() {
  const [count, setCount] = useState(0)
  const [theme, setTheme] = useState('classic')
  const nav = useNavigate()

  useEffect(() => {
    const load = () => api.get('/Visits/active').then(r => setCount(r.data.reduce((sum: number, visit: any) => sum + (visit.childrenCount || 1), 0))).catch(() => {})
    load()
    api.get('/Settings').then(r => setTheme(r.data.iconTheme || 'classic')).catch(() => {})
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [])

  const themeConfig = themes[theme] || themes.classic

  const btn = (label: string, path: string, key: string) => (
    <Grid item xs={6} sm={4} key={path}>
      <Button
        fullWidth
        variant={themeConfig.buttonVariant}
        color={themeConfig.colors[key] || 'primary'}
        size="large"
        sx={{ py: 3, fontSize: 16, borderRadius: themeConfig.radius, boxShadow: themeConfig.shadow, fontWeight: 700 }}
        onClick={() => nav(path)}
      >
        {label}
      </Button>
    </Grid>
  )

  return (
    <Box>
      <Box sx={{ minHeight: 'calc(100vh - 120px)', p: { xs: 1, sm: 3 }, borderRadius: themeConfig.radius, background: themeConfig.background }}>
      <Paper sx={{ p: 3, mb: 3, textAlign: 'center', borderRadius: themeConfig.radius, background: themeConfig.paper, boxShadow: themeConfig.shadow }}>
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