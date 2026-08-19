import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Paper, TextField, Button, Typography } from '@mui/material'
import { useAuth } from '../features/auth'
import { toast } from 'react-toastify'
import axios from 'axios'
import { mediaUrl } from '../utils/media'

export default function LoginPage() {
  const [u, setU] = useState(''); const [p, setP] = useState('')
  const [brand, setBrand] = useState<any>(null)
  const { login } = useAuth(); const nav = useNavigate()

  useEffect(() => {
    axios.get('/api/Public/branding').then(r => setBrand(r.data)).catch(() => {})
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try { await login(u, p); toast.success('تم الدخول'); nav('/') }
    catch { toast.error('بيانات الدخول غير صحيحة') }
  }

  const bg = mediaUrl(brand?.loginBackgroundPath)
  const logo = mediaUrl(brand?.logoPath)

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      bgcolor: '#e3f2fd',
      backgroundImage: bg ? `url(${bg})` : undefined,
      backgroundSize: 'cover', backgroundPosition: 'center'
    }}>
      <Paper sx={{ p: 4, width: 360, bgcolor: 'rgba(255,255,255,0.95)' }}>
        {logo && (
          <Box sx={{ textAlign: 'center', mb: 1 }}>
            <img src={logo} alt="logo" style={{ maxHeight: 72, maxWidth: 180, objectFit: 'contain' }} />
          </Box>
        )}
        <Typography variant="h5" align="center" fontWeight="bold" gutterBottom>
          {brand?.centerName || 'Kids Area'}
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary" mb={2}>تسجيل الدخول</Typography>
        <form onSubmit={submit}>
          <TextField fullWidth label="اسم المستخدم" margin="normal" value={u} onChange={e => setU(e.target.value)} required autoFocus />
          <TextField fullWidth label="كلمة المرور" type="password" margin="normal" value={p} onChange={e => setP(e.target.value)} required />
          <Button fullWidth type="submit" variant="contained" size="large" sx={{ mt: 2 }}>دخول</Button>
        </form>
      </Paper>
    </Box>
  )
}
