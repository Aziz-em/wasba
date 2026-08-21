import { useEffect, useState } from 'react'
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Button, TextField, Pagination, Stack } from '@mui/material'
import api from '../api/client'
import { toast } from 'react-toastify'
import { useAuth } from '../features/auth'
import { localDate, localDateTime } from '../utils/time'

export default function ReportsPage() {
  const [list, setList] = useState<any[]>([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { user } = useAuth()
  const load = (nextPage = page) => api.get('/Shifts/closed', { params: { from: from || undefined, to: to || undefined, page: nextPage, pageSize: 25 } }).then(r => { setList(r.data.items || []); setPage(r.data.page || nextPage); setTotalPages(r.data.totalPages || 1) }).catch(() => {})
  useEffect(() => { load(1) }, [])
  const openReport = async (id: number) => {
    const w = window.open('', '_blank')
    if (!w) return
    try {
      const r = await api.get(`/Shifts/report/${id}`)
      const d = r.data
      const s = d.summary
      w.document.write(`<html dir="rtl"><head><title>تقرير غلق</title><style>
      body{font-family:Tahoma;padding:24px;max-width:800px;margin:auto}h1,h2{margin:8px 0}
      table{width:100%;border-collapse:collapse;margin:8px 0}td,th{border:1px solid #ccc;padding:6px;text-align:right}.sec{margin-top:16px}
      </style></head><body>
      <h1>${d.centerName}</h1><div>${d.centerPhone || ''}</div>
      <h2>تقرير غلق يومي — ${localDate(d.businessDate)}</h2>
      <div>الكاشير: ${d.cashierName} | فتح: ${localDateTime(d.openedAt)} | غلق: ${localDateTime(d.closedAt)}</div>
      <div class="sec"><h3>1) ملخص الإيراد</h3><table><tr><td>نقدي</td><td>${s.cashTotal}</td></tr>
      <tr><td>InstaPay</td><td>${s.instaPayTotal}</td></tr><tr><td>أخرى</td><td>${s.otherTotal}</td></tr>
      <tr><td><b>الإجمالي</b></td><td><b>${s.totalRevenue}</b></td></tr></table></div>
      <div class="sec"><h3>2) باقات فردية</h3><table><tr><th>الباقة</th><th>عدد</th><th>قيمة</th></tr>
      ${(d.individualPackages || []).map((x: any) => `<tr><td>${x.label}</td><td>${x.count}</td><td>${x.amount}</td></tr>`).join('')}</table></div>
      <div class="sec"><h3>3) باقات الأخوة</h3><table><tr><th>البيان</th><th>عدد</th><th>قيمة</th></tr>
      ${(d.siblingPackages || []).map((x: any) => `<tr><td>${x.label}</td><td>${x.count}</td><td>${x.amount}</td></tr>`).join('')}</table></div>
      <div class="sec"><h3>4) مرافقين / تجاوز</h3><div>رسوم المرافقين: ${d.companionsTotal} | التجاوز: ${d.overageTotal}</div></div>
      <div class="sec"><h3>5) الحفلات</h3><table>
      ${(d.parties || []).map((x: any) => `<tr><td>${x.label}</td><td>${x.amount}</td></tr>`).join('')}</table></div>
      <div class="sec"><h3>6) الدرج النقدي</h3><table>
      <tr><td>افتتاحي</td><td>${d.openingBalance}</td></tr><tr><td>متوقع</td><td>${d.expectedCash}</td></tr>
      <tr><td>فعلي</td><td>${d.actualCash}</td></tr><tr><td>فرق</td><td>${d.difference}</td></tr></table></div>
      <div class="sec"><h3>ملاحظات طوارئ</h3><div>${d.emergencyNotes || '—'}</div></div>
      <script>setTimeout(()=>print(),300)<\/script></body></html>`)
      w.document.close()
    } catch (e: any) {
      w.close()
      toast.error(e.response?.data?.message || 'تعذر تحميل التقرير')
    }
  }
  const exportCsv = () => {
    const rows = [['التاريخ', 'الكاشير', 'الغلق'], ...list.map(s => [localDate(s.openedAt), s.cashier?.displayName || s.cashierId, s.closedAt ? localDateTime(s.closedAt) : ''])]
    const csv = '\ufeff' + rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'reports.csv'; a.click(); URL.revokeObjectURL(url)
  }
  const deleteReport = async (id: number) => {
    if (!window.confirm('هل تريد حذف هذا التقرير؟')) return
    try {
      await api.delete(`/Shifts/${id}`)
      setList(current => current.filter(shift => shift.id !== id))
      toast.success('تم حذف التقرير')
    } catch (e: any) { toast.error(e.response?.data?.message || 'فشل حذف التقرير') }
  }
  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>أرشيف التقارير اليومية</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
        <TextField type="date" size="small" label="من تاريخ" InputLabelProps={{ shrink: true }} value={from} onChange={e => setFrom(e.target.value)} />
        <TextField type="date" size="small" label="إلى تاريخ" InputLabelProps={{ shrink: true }} value={to} onChange={e => setTo(e.target.value)} />
        <Button variant="contained" onClick={() => load(1)}>تطبيق</Button><Button variant="outlined" onClick={exportCsv}>Excel</Button>
      </Stack>
      <Table size="small" component={Paper}>
        <TableHead><TableRow><TableCell>التاريخ</TableCell><TableCell>الكاشير</TableCell><TableCell>الغلق</TableCell><TableCell></TableCell></TableRow></TableHead>
        <TableBody>
          {list.map((s: any) => (
            <TableRow key={s.id}>
              <TableCell>{localDate(s.openedAt)}</TableCell>
              <TableCell>{s.cashier?.displayName || s.cashierId}</TableCell>
              <TableCell>{s.closedAt ? localDateTime(s.closedAt) : ''}</TableCell>
              <TableCell><Button size="small" onClick={() => openReport(s.id)}>عرض / طباعة</Button>{user?.role === 'Owner' && <Button color="error" size="small" onClick={() => deleteReport(s.id)}>حذف</Button>}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {totalPages > 1 && <Pagination sx={{ mt: 2, display: 'flex', justifyContent: 'center' }} count={totalPages} page={page} onChange={(_, value) => load(value)} color="primary" />}
    </Box>
  )
}
