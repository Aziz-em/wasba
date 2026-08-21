import { useEffect, useState } from 'react'
import { Box, Typography, Paper, TextField, Button, Table, TableHead, TableRow, TableCell, TableBody, Grid, Pagination } from '@mui/material'
import api from '../api/client'
import { toast } from 'react-toastify'
import { useAuth } from '../features/auth'
import { localDate } from '../utils/time'

export default function CustomersPage() {
  const [q, setQ] = useState('')
  const [list, setList] = useState<any[]>([])
  const [phone, setPhone] = useState('')
  const [childName, setChildName] = useState('')
  const [savingNotes, setSavingNotes] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { user } = useAuth()
  const load = (nextPage = page) => api.get('/Customers', { params: { q, page: nextPage, pageSize: 25 } }).then(r => { setList(r.data.items || []); setPage(r.data.page || nextPage); setTotalPages(r.data.totalPages || 1) }).catch(() => {})
  useEffect(() => { load() }, [])
  const create = async () => {
    try {
      const parts = childName.trim().split(/\s+/).filter(Boolean)
      const name = parts.length > 1 ? parts[1] : parts[0] || ''
      await api.post('/Customers', { phone, name })
      toast.success('تم'); setPhone(''); setChildName(''); load(1)
    }
    catch (e: any) { toast.error(e.response?.data?.message || 'فشل') }
  }
  const updateNotes = async (customer: any) => {
    setSavingNotes(customer.id)
    try {
      const { data } = await api.put(`/Customers/${customer.id}/notes`, { notes: customer.notes || '' })
      setList(current => current.map(item => item.id === data.id ? data : item))
      toast.success('تم حفظ الملاحظة')
    } catch (e: any) { toast.error(e.response?.data?.message || 'فشل حفظ الملاحظة') }
    finally { setSavingNotes(null) }
  }
  const deleteNotes = async (customer: any) => {
    setSavingNotes(customer.id)
    try {
      const { data } = await api.put(`/Customers/${customer.id}/notes`, { notes: null })
      setList(current => current.map(item => item.id === data.id ? data : item))
      toast.success('تم حذف الملاحظة')
    } catch (e: any) { toast.error(e.response?.data?.message || 'فشل حذف الملاحظة') }
    finally { setSavingNotes(null) }
  }
  const deleteCustomer = async (customer: any) => {
    if (!window.confirm(`هل تريد حذف العميل ${customer.name}؟`)) return
    try {
      await api.delete(`/Customers/${customer.id}`)
      setList(current => current.filter(item => item.id !== customer.id))
      toast.success('تم حذف العميل')
    } catch (e: any) { toast.error(e.response?.data?.message || 'فشل حذف العميل') }
  }
  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>العملاء</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={1}>
          <Grid item xs={5}><TextField fullWidth size="small" label="رقم الهاتف" value={phone} onChange={e => setPhone(e.target.value)} /></Grid>
          <Grid item xs={5}><TextField fullWidth size="small" label="اسم الطفل" value={childName} onChange={e => setChildName(e.target.value)} /></Grid>
          <Grid item xs={2}><Button fullWidth variant="contained" onClick={create}>إضافة</Button></Grid>
        </Grid>
      </Paper>
      <TextField fullWidth size="small" label="بحث برقم الهاتف أو اسم" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} sx={{ mb: 1 }} />
      <Button size="small" onClick={() => load(1)}>بحث</Button>
      <Table size="small" component={Paper} sx={{ mt: 1 }}>
        <TableHead><TableRow><TableCell>رقم الهاتف</TableCell><TableCell>الاسم</TableCell><TableCell>أسماء الأطفال</TableCell><TableCell>عدد الزيارات</TableCell><TableCell>تاريخ آخر زيارة</TableCell><TableCell>ملاحظات</TableCell>{user?.role === 'Owner' && <TableCell>إدارة</TableCell>}</TableRow></TableHead>
        <TableBody>{list.map(c => <TableRow key={c.id}>
          <TableCell>{c.phone}</TableCell>
          <TableCell>{c.name}</TableCell>
          <TableCell>{(c.childrenNames || []).map((childName: string) => <div key={childName}>{childName}</div>)}</TableCell>
          <TableCell>{c.visitsCount}</TableCell>
          <TableCell>{c.lastVisit ? localDate(c.lastVisit) : 'لا توجد'}</TableCell>
          <TableCell sx={{ minWidth: 260 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField fullWidth size="small" multiline maxRows={2} label="ملاحظة" value={c.notes || ''}
                onChange={e => setList(current => current.map(item => item.id === c.id ? { ...item, notes: e.target.value } : item))} />
              <Button variant="outlined" size="small" onClick={() => updateNotes(c)} disabled={savingNotes === c.id}>حفظ</Button>
              <Button variant="outlined" color="error" size="small" onClick={() => deleteNotes(c)} disabled={savingNotes === c.id || !c.notes}>حذف</Button>
            </Box>
          </TableCell>
          {user?.role === 'Owner' && <TableCell><Button color="error" size="small" onClick={() => deleteCustomer(c)}>حذف العميل</Button></TableCell>}
        </TableRow>)}</TableBody>
      </Table>
      {totalPages > 1 && <Pagination sx={{ mt: 2, display: 'flex', justifyContent: 'center' }} count={totalPages} page={page} onChange={(_, value) => load(value)} color="primary" />}
    </Box>
  )
}
