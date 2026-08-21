import { useEffect, useState } from 'react'
import { Box, Typography, Paper, TextField, Button, Alert } from '@mui/material'
import api from '../api/client'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { localDate, localDateTime } from '../utils/time'

export default function CloseShiftPage() {
  const [treasury, setTreasury] = useState<any>(null)
  const [actual, setActual] = useState(0)
  const [notes, setNotes] = useState('')
  const [report, setReport] = useState<any>(null)
  const nav = useNavigate()
  useEffect(() => { api.get('/Shifts/treasury').then(r => { setTreasury(r.data); setActual(r.data.expectedCash) }).catch(() => {}) }, [])

  const close = async () => {
    try {
      const r = await api.post('/Shifts/close', { actualCash: actual, emergencyNotes: notes })
      setReport(r.data)
      toast.success('تم غلق الوردية')
      printReport(r.data)
    } catch (e: any) { toast.error(e.response?.data?.message || 'فشل') }
  }

  const printReport = (d: any) => {
    const w = window.open('', '_blank')
    if (!w) return
    const s = d.summary
    w.document.write(`<!DOCTYPE html><html dir="rtl"><head><title>تقرير غلق</title>
      <style>body{font-family:Tahoma;padding:24px;max-width:800px;margin:auto}h1,h2{margin:8px 0}
      table{width:100%;border-collapse:collapse;margin:8px 0}td,th{border:1px solid #ccc;padding:6px;text-align:right}
      .sec{margin-top:16px}</style></head><body>
      <h1>${d.centerName}</h1>
      <div>${d.centerPhone || ''}</div>
      <h2>تقرير غلق يومي — ${localDate(d.businessDate)}</h2>
      <div>الكاشير: ${d.cashierName} | فتح: ${localDateTime(d.openedAt)} | غلق: ${localDateTime(d.closedAt)}</div>
      <div class="sec"><h3>1) ملخص الإيراد</h3>
      <table><tr><td>نقدي</td><td>${s.cashTotal}</td></tr>
      <tr><td>InstaPay</td><td>${s.instaPayTotal}</td></tr>
      <tr><td>أخرى</td><td>${s.otherTotal}</td></tr>
      <tr><td><b>الإجمالي</b></td><td><b>${s.totalRevenue}</b></td></tr></table></div>
      <div class="sec"><h3>2) باقات فردية</h3><table><tr><th>الباقة</th><th>عدد</th><th>قيمة</th></tr>
      ${(d.individualPackages||[]).map((x:any)=>`<tr><td>${x.label}</td><td>${x.count}</td><td>${x.amount}</td></tr>`).join('')}</table></div>
      <div class="sec"><h3>3) باقات الأخوة</h3><table><tr><th>البيان</th><th>عدد</th><th>قيمة</th></tr>
      ${(d.siblingPackages||[]).map((x:any)=>`<tr><td>${x.label}</td><td>${x.count}</td><td>${x.amount}</td></tr>`).join('')}</table></div>
      <div class="sec"><h3>4) مرافقين / تجاوز</h3>
      <div>رسوم المرافقين: ${d.companionsTotal} | التجاوز: ${d.overageTotal}</div></div>
      <div class="sec"><h3>5) الحفلات</h3><table>
      ${(d.parties||[]).map((x:any)=>`<tr><td>${x.label}</td><td>${x.amount}</td></tr>`).join('')}</table></div>
      <div class="sec"><h3>6) الدرج النقدي</h3>
      <table>
      <tr><td>افتتاحي</td><td>${d.openingBalance}</td></tr>
      <tr><td>متوقع</td><td>${d.expectedCash}</td></tr>
      <tr><td>فعلي</td><td>${d.actualCash}</td></tr>
      <tr><td>فرق</td><td>${d.difference}</td></tr></table></div>
      <div class="sec"><h3>ملاحظات طوارئ</h3><div>${d.emergencyNotes || '—'}</div></div>
      <p style="margin-top:24px;font-size:12px">تم إصدار التقرير إلكترونياً — التسليم النقدي يدوي خارج النظام</p>
      <script>setTimeout(()=>print(),400)<\/script></body></html>`)
    w.document.close()
  }

  if (report) {
  return (
    <Box>
      <Alert severity="success" sx={{ mb: 2 }}>تم غلق الوردية</Alert>
      <Button variant="contained" onClick={() => printReport(report)}>طباعة التقرير</Button>
      <Button sx={{ ml: 1 }} onClick={() => nav('/reports')}>الأرشيف</Button>
      <Button sx={{ ml: 1 }} onClick={() => nav('/customers')}>العملاء</Button>
      <Button sx={{ ml: 1 }} onClick={() => nav('/settings')}>الإعدادات</Button>
    </Box>
  )
}

  return (
    <Box maxWidth={480}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>غلق الوردية</Typography>
      <Paper sx={{ p: 2 }}>
        {treasury && (
          <Alert severity="info" sx={{ mb: 2 }}>
            النقد المتوقع في الدرج: <b>{treasury.expectedCash} ج.م</b>
            <br />إجمالي الإيراد: {treasury.totalRevenue} ج.م (منه نقدي {treasury.cashTotal})
          </Alert>
        )}
        <TextField fullWidth type="number" label="النقد الفعلي بعد العدّ" value={actual} onChange={e => setActual(+e.target.value)} sx={{ mb: 2 }} />
        <TextField fullWidth multiline rows={3} label="ملاحظات طوارئ / أحداث اليوم" value={notes} onChange={e => setNotes(e.target.value)} sx={{ mb: 2 }} />
        <Button fullWidth variant="contained" color="error" size="large" onClick={close}>غلق وإصدار التقرير</Button>
      </Paper>
    </Box>
  )
}
