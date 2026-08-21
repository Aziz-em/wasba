import { useEffect, useState } from 'react'
import { Box, Typography, Paper, Grid, TextField, Button, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material'
import api from '../api/client'
import { toast } from 'react-toastify'
import { useAuth } from '../features/auth'
import { localDateTime } from '../utils/time'

export default function PartyPage() {
  const [f, setF] = useState({ customerName: '', phone: '', childrenCount: 10, amount: 0, paidCash: 0, paidInstaPay: 0, notes: '' })
  const [history, setHistory] = useState<any[]>([])
  const { user } = useAuth()
  useEffect(() => { api.get('/Parties/today').then(r => setHistory(r.data)).catch(() => {}) }, [])
  const printReceipt = (party: any) => {
    const w = window.open('', '_blank', 'width=360,height=600')
    if (!w) return
    w.document.write(`<html dir="rtl"><body style="font-family:Tahoma;width:300px;margin:8px auto"><h2 style="text-align:center">إيصال حفلة</h2><div>العميل: ${party.customerName}</div><div>رقم الهاتف: ${party.phone}</div><div>عدد الأطفال: ${party.childrenCount}</div><div>المبلغ: ${party.amount} ج.م</div><div>نقدي: ${party.paidCash} | InstaPay: ${party.paidInstaPay}</div><div>ملاحظة: ${party.notes || '—'}</div><div>التاريخ: ${localDateTime(party.saleTime)}</div><script>setTimeout(()=>print(),300)<\/script></body></html>`)
    w.document.close()
  }
  const deleteParty = async (id: number) => {
    if (!window.confirm('هل تريد حذف سجل هذه الحفلة؟')) return
    try {
      await api.delete(`/Parties/${id}`)
      setHistory(current => current.filter(party => party.id !== id))
      toast.success('تم حذف سجل الحفلة')
    } catch (e: any) { toast.error(e.response?.data?.message || 'فشل حذف سجل الحفلة') }
  }
  const save = async () => {
    try {
      const { data } = await api.post('/Parties', { ...f, paidOther: 0 })
      const party = { ...f, ...data, id: data.id ?? data.Id, saleTime: data.saleTime || new Date().toISOString() }
      setHistory(current => [party, ...current])
      printReceipt(party)
      toast.success('تم تسجيل وارد حفلة')
      setF({ customerName: '', phone: '', childrenCount: 10, amount: 0, paidCash: 0, paidInstaPay: 0, notes: '' })
    } catch (e: any) { toast.error(e.response?.data?.message || 'فشل') }
  }
  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>تسجيل حفلة</Typography>
      <Paper sx={{ p: 2, maxWidth: 480 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}><TextField fullWidth label="اسم العميل" value={f.customerName} onChange={e => setF({ ...f, customerName: e.target.value })} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="رقم الهاتف" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></Grid>
          <Grid item xs={6}><TextField fullWidth type="number" label="عدد الأطفال" value={f.childrenCount} onChange={e => setF({ ...f, childrenCount: +e.target.value })} /></Grid>
          <Grid item xs={6}><TextField fullWidth type="number" label="المبلغ" value={f.amount} onChange={e => setF({ ...f, amount: +e.target.value })} /></Grid>
          <Grid item xs={6}><TextField fullWidth type="number" label="نقدي" value={f.paidCash} onChange={e => setF({ ...f, paidCash: +e.target.value })} /></Grid>
          <Grid item xs={6}><TextField fullWidth type="number" label="InstaPay" value={f.paidInstaPay} onChange={e => setF({ ...f, paidInstaPay: +e.target.value })} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="ملاحظة" value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} /></Grid>
          <Grid item xs={12}><Button fullWidth variant="contained" onClick={save}>حفظ</Button></Grid>
        </Grid>
      </Paper>
      <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>سجل الحفلات</Typography>
      <Table size="small" component={Paper}><TableHead><TableRow><TableCell>العميل</TableCell><TableCell>عدد الأطفال</TableCell><TableCell>المبلغ</TableCell><TableCell>التاريخ</TableCell><TableCell /></TableRow></TableHead>
        <TableBody>{history.map(p => <TableRow key={p.id}><TableCell>{p.customerName}</TableCell><TableCell>{p.childrenCount}</TableCell><TableCell>{p.amount}</TableCell><TableCell>{p.saleTime ? localDateTime(p.saleTime) : ''}</TableCell><TableCell><Button size="small" onClick={() => printReceipt(p)}>عرض / طباعة</Button>{user?.role === 'Owner' && <Button color="error" size="small" onClick={() => deleteParty(p.id)}>حذف</Button>}</TableCell></TableRow>)}</TableBody>
      </Table>
    </Box>
  )
}
