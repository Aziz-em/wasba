import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Paper, TextField, Button, Typography } from '@mui/material'
import api from '../api/client'
import { toast } from 'react-toastify'

export default function OpenShiftPage() {
  const [bal, setBal] = useState(0)
  const [notes, setNotes] = useState('')
  const nav = useNavigate()
  const open = async () => {
    try {
      await api.post('/Shifts/open', { openingBalance: bal, notes })
      toast.success('تم فتح الوردية')
      nav('/')
    } catch (e: any) { toast.error(e.response?.data?.message || 'فشل') }
  }
  return (
    <Box sx={{ maxWidth: 420, mx: 'auto', mt: 6 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>فتح الوردية</Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>أدخل النقد الموجود في الدرج الآن (يدوياً كل يوم)</Typography>
        <TextField fullWidth type="number" label="الرصيد الافتتاحي (ج.م)" value={bal} onChange={e => setBal(+e.target.value)} sx={{ mb: 2 }} />
        <TextField fullWidth label="ملاحظة" value={notes} onChange={e => setNotes(e.target.value)} sx={{ mb: 2 }} />
        <Button fullWidth variant="contained" size="large" onClick={open}>فتح الوردية</Button>
      </Paper>
    </Box>
  )
}
