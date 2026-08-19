import { useEffect, useState } from 'react'
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Button } from '@mui/material'
import api from '../api/client'

export default function ReportsPage() {
  const [list, setList] = useState<any[]>([])
  useEffect(() => { api.get('/Shifts/closed').then(r => setList(r.data)).catch(() => {}) }, [])
  const openReport = async (id: number) => {
    const r = await api.get(`/Shifts/report/${id}`)
    const d = r.data
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`<html dir="rtl"><body style="font-family:Tahoma;padding:20px"><h2>${d.centerName} — تقرير ${new Date(d.businessDate).toLocaleDateString('ar-EG')}</h2>
      <p>الكاشير: ${d.cashierName}</p>
      <p>الإيراد: ${d.summary.totalRevenue} | نقدي: ${d.summary.cashTotal} | InstaPay: ${d.summary.instaPayTotal}</p>
      <p>افتتاحي: ${d.openingBalance} | متوقع: ${d.expectedCash} | فعلي: ${d.actualCash} | فرق: ${d.difference}</p>
      <p>${d.emergencyNotes || ''}</p>
      <script>setTimeout(()=>print(),300)<\/script></body></html>`)
    w.document.close()
  }
  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>أرشيف التقارير اليومية</Typography>
      <Table size="small" component={Paper}>
        <TableHead><TableRow><TableCell>التاريخ</TableCell><TableCell>الكاشير</TableCell><TableCell>الإقفال</TableCell><TableCell></TableCell></TableRow></TableHead>
        <TableBody>
          {list.map((s: any) => (
            <TableRow key={s.id}>
              <TableCell>{new Date(s.openedAt).toLocaleDateString('ar-EG')}</TableCell>
              <TableCell>{s.cashier?.displayName || s.cashierId}</TableCell>
              <TableCell>{s.closedAt ? new Date(s.closedAt).toLocaleString('ar-EG') : ''}</TableCell>
              <TableCell><Button size="small" onClick={() => openReport(s.id)}>عرض / طباعة</Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  )
}
