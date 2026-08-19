import { useEffect, useState } from 'react'
import { Box, Typography, Paper, TextField, Button, Table, TableHead, TableRow, TableCell, TableBody, Grid } from '@mui/material'
import api from '../api/client'
import { toast } from 'react-toastify'

export default function CustomersPage() {
  const [q, setQ] = useState('')
  const [list, setList] = useState<any[]>([])
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const load = () => api.get('/Customers', { params: { q } }).then(r => setList(r.data)).catch(() => {})
  useEffect(() => { load() }, [])
  const create = async () => {
    try { await api.post('/Customers', { phone, name }); toast.success('تم'); setPhone(''); setName(''); load() }
    catch (e: any) { toast.error(e.response?.data?.message || 'فشل') }
  }
  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>العملاء</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={1}>
          <Grid item xs={5}><TextField fullWidth size="small" label="جوال" value={phone} onChange={e => setPhone(e.target.value)} /></Grid>
          <Grid item xs={5}><TextField fullWidth size="small" label="الاسم" value={name} onChange={e => setName(e.target.value)} /></Grid>
          <Grid item xs={2}><Button fullWidth variant="contained" onClick={create}>إضافة</Button></Grid>
        </Grid>
      </Paper>
      <TextField fullWidth size="small" label="بحث بجوال أو اسم" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} sx={{ mb: 1 }} />
      <Button size="small" onClick={load}>بحث</Button>
      <Table size="small" component={Paper} sx={{ mt: 1 }}>
        <TableHead><TableRow><TableCell>الجوال</TableCell><TableCell>الاسم</TableCell><TableCell>أطفال</TableCell></TableRow></TableHead>
        <TableBody>{list.map(c => <TableRow key={c.id}><TableCell>{c.phone}</TableCell><TableCell>{c.name}</TableCell><TableCell>{c.childrenCount}</TableCell></TableRow>)}</TableBody>
      </Table>
    </Box>
  )
}
