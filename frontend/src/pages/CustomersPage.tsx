import { useEffect, useState } from 'react'
import {
  Box, Typography, Paper, TextField, Button, Table, TableHead, TableRow, TableCell,
  TableBody, Grid, Pagination, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material'
import api from '../api/client'
import { toast } from 'react-toastify'
import { useAuth } from '../features/auth'
import { localDate, localDateTime } from '../utils/time'

export default function CustomersPage() {
  const [q, setQ] = useState('')
  const [list, setList] = useState<any[]>([])
  const [phone, setPhone] = useState('')
  const [childName, setChildName] = useState('')
  const [savingNotes, setSavingNotes] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [archive, setArchive] = useState<{ open: boolean; phone: string; items: any[] }>({
    open: false,
    phone: '',
    items: []
  })
  const { user } = useAuth()

  const load = (nextPage = page) =>
    api
      .get('/Customers', { params: { q, page: nextPage, pageSize: 25 } })
      .then(r => {
        setList(r.data.items || [])
        setPage(r.data.page || nextPage)
        setTotalPages(r.data.totalPages || 1)
      })
      .catch(() => {})

  useEffect(() => {
    load()
  }, [])

  const create = async () => {
    try {
      const parts = childName.trim().split(/\s+/).filter(Boolean)
      const name = parts.length > 1 ? parts[1] : parts[0] || ''
      await api.post('/Customers', { phone, name })
      toast.success('تم')
      setPhone('')
      setChildName('')
      load(1)
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'فشل')
    }
  }

  const updateNotes = async (customer: any) => {
    setSavingNotes(customer.id)
    try {
      const { data } = await api.put(`/Customers/${customer.id}/notes`, { notes: customer.notes || '' })
      setList(current => current.map(item => (item.id === data.id ? data : item)))
      toast.success('تم حفظ الملاحظة')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'فشل حفظ الملاحظة')
    } finally {
      setSavingNotes(null)
    }
  }

  const deleteNotes = async (customer: any) => {
    setSavingNotes(customer.id)
    try {
      const { data } = await api.put(`/Customers/${customer.id}/notes`, { notes: null })
      setList(current => current.map(item => (item.id === data.id ? data : item)))
      toast.success('تم حذف الملاحظة')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'فشل حذف الملاحظة')
    } finally {
      setSavingNotes(null)
    }
  }

  const deleteCustomer = async (customer: any) => {
    if (!window.confirm(`هل تريد حذف العميل ${customer.name}؟`)) return
    try {
      await api.delete(`/Customers/${customer.id}`)
      setList(current => current.filter(item => item.id !== customer.id))
      toast.success('تم حذف العميل')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'فشل حذف العميل')
    }
  }

  const exportExcel = async () => {
    try {
      const res = await api.get('/Customers/export', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `customers_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('تم التحميل')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'فشل التحميل')
    }
  }

  const openArchive = async (customer: any) => {
    try {
      const { data } = await api.get(`/Customers/${customer.id}/visits`)
      setArchive({ open: true, phone: customer.phone, items: data || [] })
    } catch {
      toast.error('تعذر جلب الأرشيف')
    }
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        العملاء
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={1}>
          <Grid item xs={5}>
            <TextField fullWidth size="small" label="رقم الهاتف" value={phone} onChange={e => setPhone(e.target.value)} />
          </Grid>
          <Grid item xs={5}>
            <TextField fullWidth size="small" label="اسم الطفل" value={childName} onChange={e => setChildName(e.target.value)} />
          </Grid>
          <Grid item xs={2}>
            <Button fullWidth variant="contained" onClick={create}>
              إضافة
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <TextField
        fullWidth
        size="small"
        label="بحث برقم الهاتف أو اسم"
        value={q}
        onChange={e => setQ(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && load(1)}
        sx={{ mb: 1 }}
      />
      <Button size="small" onClick={() => load(1)} sx={{ mr: 1 }}>
        بحث
      </Button>
      {user?.role === 'Owner' && (
        <Button size="small" variant="contained" onClick={exportExcel}>
          تحميل Excel
        </Button>
      )}

      <Table size="small" component={Paper} sx={{ mt: 1 }}>
        <TableHead>
          <TableRow>
            <TableCell>رقم الهاتف</TableCell>
            <TableCell>الاسم</TableCell>
            <TableCell>أسماء الأطفال</TableCell>
            <TableCell>عدد الزيارات</TableCell>
            <TableCell>تاريخ آخر زيارة</TableCell>
            <TableCell>ملاحظات</TableCell>
            <TableCell>فواتير</TableCell>
            {user?.role === 'Owner' && <TableCell>إدارة</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {list.map(c => (
            <TableRow key={c.id}>
              <TableCell>{c.phone}</TableCell>
              <TableCell>{c.name}</TableCell>
              <TableCell>
                {(() => {
                  const firstNames = (c.childrenNames || [])
                    .map((n: string) => (n || '').trim().split(/\s+/)[0])
                    .filter(Boolean)
                  const lines: string[] = []
                  for (let i = 0; i < firstNames.length; i += 2) {
                    lines.push(firstNames.slice(i, i + 2).join(' ، '))
                  }
                  return lines.length
                    ? lines.map((line, idx) => <div key={idx}>{line}</div>)
                    : '—'
                })()}
              </TableCell>
              <TableCell>{c.visitsCount}</TableCell>
              <TableCell>{c.lastVisit ? localDate(c.lastVisit) : 'لا توجد'}</TableCell>
              <TableCell sx={{ minWidth: 260 }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    maxRows={2}
                    label="ملاحظة"
                    value={c.notes || ''}
                    onChange={e =>
                      setList(current =>
                        current.map(item => (item.id === c.id ? { ...item, notes: e.target.value } : item))
                      )
                    }
                  />
                  <Button variant="outlined" size="small" onClick={() => updateNotes(c)} disabled={savingNotes === c.id}>
                    حفظ
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => deleteNotes(c)}
                    disabled={savingNotes === c.id || !c.notes}
                  >
                    حذف
                  </Button>
                </Box>
              </TableCell>
              <TableCell>
                <Button size="small" onClick={() => openArchive(c)}>
                  الفواتير
                </Button>
              </TableCell>
              {user?.role === 'Owner' && (
                <TableCell>
                  <Button color="error" size="small" onClick={() => deleteCustomer(c)}>
                    حذف العميل
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <Pagination
          sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}
          count={totalPages}
          page={page}
          onChange={(_, value) => load(value)}
          color="primary"
        />
      )}

      <Dialog open={archive.open} onClose={() => setArchive({ open: false, phone: '', items: [] })} maxWidth="md" fullWidth>
        <DialogTitle>فواتير العميل — {archive.phone}</DialogTitle>
        <DialogContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>رقم الإيصال</TableCell>
                <TableCell>الطفل</TableCell>
                <TableCell>الدخول</TableCell>
                <TableCell>الخروج</TableCell>
                <TableCell>المبلغ</TableCell>
                <TableCell>الحالة</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {archive.items.map((v: any) => (
                <TableRow key={v.id || v.receiptNumber}>
                  <TableCell>{v.receiptNumber}</TableCell>
                  <TableCell>{v.childName}</TableCell>
                  <TableCell>{v.checkInTime ? localDateTime(v.checkInTime) : '—'}</TableCell>
                  <TableCell>{v.checkOutTime ? localDateTime(v.checkOutTime) : '—'}</TableCell>
                  <TableCell>{v.totalAmount} ج.م</TableCell>
                  <TableCell>{v.status || '—'}</TableCell>
                </TableRow>
              ))}
              {archive.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    لا توجد فواتير
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setArchive({ open: false, phone: '', items: [] })}>إغلاق</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}