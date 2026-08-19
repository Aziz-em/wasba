import { useEffect, useState } from 'react'
import { Box, Typography, Paper, Grid, TextField, Button, MenuItem, Table, TableHead, TableRow, TableCell, TableBody, Chip } from '@mui/material'
import api from '../api/client'
import { toast } from 'react-toastify'

export default function MembershipsPage() {
  const [types, setTypes] = useState<any[]>([])
  const [list, setList] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [form, setForm] = useState({ customerId: 0, membershipTypeId: 0, paidCash: 0, paidInstaPay: 0 })
  const load = async () => {
    const [t, l, c] = await Promise.all([api.get('/Memberships/types'), api.get('/Memberships'), api.get('/Customers')])
    setTypes(t.data); setList(l.data); setCustomers(c.data)
  }
  useEffect(() => { load().catch(() => {}) }, [])
  const sell = async () => {
    try {
      await api.post('/Memberships/sell', { ...form, paidOther: 0 })
      toast.success('تم بيع العضوية')
      load()
    } catch (e: any) { toast.error(e.response?.data?.message || 'فشل') }
  }
  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>العضويات</Typography>
      <Paper sx={{ p: 2, mb: 2, maxWidth: 560 }}>
        <Typography fontWeight="bold" gutterBottom>بيع / تجديد</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField fullWidth select size="small" label="العميل" value={form.customerId} onChange={e => setForm({ ...form, customerId: +e.target.value })}>
              {customers.map(c => <MenuItem key={c.id} value={c.id}>{c.name} — {c.phone}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth select size="small" label="النوع" value={form.membershipTypeId} onChange={e => {
              const id = +e.target.value; const t = types.find(x => x.id === id)
              setForm({ ...form, membershipTypeId: id, paidCash: t?.price || 0 })
            }}>
              {types.map(t => <MenuItem key={t.id} value={t.id}>{t.name} — {t.price} ج.م ({t.kind})</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={6}><TextField fullWidth size="small" type="number" label="نقدي" value={form.paidCash} onChange={e => setForm({ ...form, paidCash: +e.target.value })} /></Grid>
          <Grid item xs={6}><TextField fullWidth size="small" type="number" label="InstaPay" value={form.paidInstaPay} onChange={e => setForm({ ...form, paidInstaPay: +e.target.value })} /></Grid>
          <Grid item xs={12}><Button variant="contained" onClick={sell}>بيع وتسجيل في الخزنة</Button></Grid>
        </Grid>
      </Paper>
      <Table size="small" component={Paper}>
        <TableHead><TableRow><TableCell>العميل</TableCell><TableCell>الجوال</TableCell><TableCell>النوع</TableCell><TableCell>المتبقي</TableCell><TableCell>إلى</TableCell><TableCell>حالة</TableCell></TableRow></TableHead>
        <TableBody>
          {list.map(m => (
            <TableRow key={m.id}>
              <TableCell>{m.customerName}</TableCell><TableCell>{m.phone}</TableCell><TableCell>{m.typeName}</TableCell>
              <TableCell>{m.remainingHours}</TableCell>
              <TableCell>{new Date(m.endDate).toLocaleDateString('ar-EG')}</TableCell>
              <TableCell><Chip size="small" color={m.isActive ? 'success' : 'default'} label={m.isActive ? 'نشط' : 'منتهي'} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  )
}
