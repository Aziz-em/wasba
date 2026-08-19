import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Typography, Grid, Button, Paper } from '@mui/material'
import api from '../api/client'

export default function HomePage() {
  const [count, setCount] = useState(0)
  const nav = useNavigate()
  useEffect(() => {
    const load = () => api.get('/Visits/active').then(r => setCount(r.data.length)).catch(() => {})
    load(); const t = setInterval(load, 15000); return () => clearInterval(t)
  }, [])
  const btn = (label: string, path: string, color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' = 'primary') => (
    <Grid item xs={6} sm={4} key={path}>
      <Button fullWidth variant="contained" color={color} size="large" sx={{ py: 3, fontSize: 16 }} onClick={() => nav(path)}>{label}</Button>
    </Grid>
  )
  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">الأطفال النشطون الآن</Typography>
        <Typography variant="h2" fontWeight="bold" color="primary">{count}</Typography>
      </Paper>
      <Grid container spacing={2}>
        {btn('دخول طفل', '/checkin', 'success')}
        {btn('الحاليون', '/active')}
        {btn('خروج', '/checkout', 'warning')}
        {btn('عضويات', '/memberships')}
        {btn('حفلة', '/party', 'secondary')}
        {btn('الخزنة', '/treasury')}
        {btn('إقفال الوردية', '/close-shift', 'error')}
        {btn('التقارير', '/reports')}
      </Grid>
    </Box>
  )
}
