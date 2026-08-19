import { useState } from 'react'
import { Box, Typography, Paper, Grid, TextField, Button } from '@mui/material'
import api from '../api/client'
import { toast } from 'react-toastify'

export default function PartyPage() {
  const [f, setF] = useState({ customerName: '', phone: '', childrenCount: 10, amount: 0, paidCash: 0, paidInstaPay: 0, notes: '' })
  const save = async () => {
    try {
      await api.post('/Parties', { ...f, paidOther: 0 })
      toast.success('تم تسجيل وارد حفلة')
      setF({ customerName: '', phone: '', childrenCount: 10, amount: 0, paidCash: 0, paidInstaPay: 0, notes: '' })
    } catch (e: any) { toast.error(e.response?.data?.message || 'فشل') }
  }
  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>تسجيل حفلة (بسيط)</Typography>
      <Paper sx={{ p: 2, maxWidth: 480 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}><TextField fullWidth label="اسم العميل" value={f.customerName} onChange={e => setF({ ...f, customerName: e.target.value })} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="الجوال" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></Grid>
          <Grid item xs={6}><TextField fullWidth type="number" label="عدد الأطفال" value={f.childrenCount} onChange={e => setF({ ...f, childrenCount: +e.target.value })} /></Grid>
          <Grid item xs={6}><TextField fullWidth type="number" label="المبلغ" value={f.amount} onChange={e => setF({ ...f, amount: +e.target.value })} /></Grid>
          <Grid item xs={6}><TextField fullWidth type="number" label="نقدي" value={f.paidCash} onChange={e => setF({ ...f, paidCash: +e.target.value })} /></Grid>
          <Grid item xs={6}><TextField fullWidth type="number" label="InstaPay" value={f.paidInstaPay} onChange={e => setF({ ...f, paidInstaPay: +e.target.value })} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="ملاحظة" value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} /></Grid>
          <Grid item xs={12}><Button fullWidth variant="contained" onClick={save}>حفظ</Button></Grid>
        </Grid>
      </Paper>
    </Box>
  )
}
