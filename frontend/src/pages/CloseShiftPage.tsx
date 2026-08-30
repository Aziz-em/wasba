import { useEffect, useState } from 'react'
import { Box, Typography, Paper, TextField, Button, Alert } from '@mui/material'
import api from '../api/client'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { localDate, localDateTime } from '../utils/time'

function usedLines(arr: any[] | undefined) {
  return (arr || []).filter((x: any) => (x.count ?? 0) > 0 || (x.amount ?? 0) > 0)
}

export default function CloseShiftPage() {
  const [treasury, setTreasury] = useState<any>(null)
  const [actual, setActual] = useState(0)
  const [notes, setNotes] = useState('')
  const [report, setReport] = useState<any>(null)
  const nav = useNavigate()
  useEffect(() => {
    api.get('/Shifts/treasury').then(r => {
      setTreasury(r.data)
      setActual(r.data.expectedCash)
    }).catch(() => {})
  }, [])

  const close = async () => {
    try {
      const r = await api.post('/Shifts/close', { actualCash: actual, emergencyNotes: notes })
      setReport(r.data)
      toast.success('تم غلق الوردية')
      printReport(r.data)
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'فشل')
    }
  }

  const printReport = (d: any) => {
    const w = window.open('', '_blank')
    if (!w) return
    const s = d.summary
    const ind = usedLines(d.individualPackages)
    const sib = usedLines(d.siblingPackages)
    const parties = usedLines(d.parties)
    const mems = usedLines(d.memberships)

    const section = (title: string, body: string) =>
      body ? `<div class="sec"><h3>${title}</h3>${body}</div>` : ''

    const tableRows = (rows: any[], cols: (x: any) => string) =>
      rows.length
        ? `<table><thead><tr>${cols({ _h: true })}</tr></thead><tbody>${rows.map(x => `<tr>${cols(x)}</tr>`).join('')}</tbody></table>`
        : ''

    w.document.write(`<!DOCTYPE html><html dir="rtl"><head><title>تقرير غلق</title>
      <style>
        body{font-family:Cairo,Tahoma,Arial,sans-serif;padding:24px;max-width:720px;margin:auto;color:#111}
        h1{margin:0 0 4px;font-size:22px} h2{margin:12px 0 8px;font-size:16px;color:#333}
        h3{margin:0 0 8px;font-size:14px;border-bottom:2px solid #0d9488;padding-bottom:4px}
        table{width:100%;border-collapse:collapse;margin:4px 0 8px}
        td,th{border:1px solid #ddd;padding:7px 10px;text-align:right;font-size:13px}
        th{background:#f1f5f9;font-weight:700}
        .meta{color:#555;font-size:13px;margin-bottom:12px}
        .sec{margin-top:18px}
        .total td{font-weight:700;background:#f8fafc}
        .foot{margin-top:28px;font-size:11px;color:#888;border-top:1px dashed #ccc;padding-top:10px}
      </style></head><body>
      <h1>${d.centerName || ''}</h1>
      <div class="meta">${d.centerPhone || ''}</div>
      <h2>تقرير غلق وردية — ${localDate(d.businessDate)}</h2>
      <div class="meta">الكاشير: ${d.cashierName || '—'} &nbsp;|&nbsp; فتح: ${localDateTime(d.openedAt)} &nbsp;|&nbsp; غلق: ${localDateTime(d.closedAt)}</div>

      <div class="sec"><h3>ملخص الإيراد</h3>
      <table>
        <tr><td>نقدي</td><td>${s?.cashTotal ?? 0}</td></tr>
        <tr><td>InstaPay</td><td>${s?.instaPayTotal ?? 0}</td></tr>
        <tr><td>أخرى</td><td>${s?.otherTotal ?? 0}</td></tr>
        <tr class="total"><td>الإجمالي</td><td>${s?.totalRevenue ?? 0}</td></tr>
      </table></div>

      ${section('باقات فردية (المستخدمة فقط)', tableRows(ind, x => x._h
        ? '<th>الباقة</th><th>عدد</th><th>القيمة</th>'
        : `<td>${x.label}</td><td>${x.count}</td><td>${x.amount}</td>`))}

      ${section('باقات الأخوة (المستخدمة فقط)', tableRows(sib, x => x._h
        ? '<th>البيان</th><th>عدد</th><th>القيمة</th>'
        : `<td>${x.label}</td><td>${x.count}</td><td>${x.amount}</td>`))}

      ${((d.companionsTotal || 0) > 0 || (d.overageTotal || 0) > 0) ? `
      <div class="sec"><h3>مرافقين / تجاوز</h3>
      <table>
        ${(d.companionsTotal || 0) > 0 ? `<tr><td>رسوم المرافقين</td><td>${d.companionsTotal}</td></tr>` : ''}
        ${(d.overageTotal || 0) > 0 ? `<tr><td>تجاوز الوقت</td><td>${d.overageTotal}</td></tr>` : ''}
      </table></div>` : ''}

      ${section('الحفلات', tableRows(parties, x => x._h
        ? '<th>البيان</th><th>القيمة</th>'
        : `<td>${x.label}</td><td>${x.amount}</td>`))}

      ${section('العضويات', tableRows(mems, x => x._h
        ? '<th>النوع</th><th>القيمة</th>'
        : `<td>${x.label}</td><td>${x.amount}</td>`))}

      <div class="sec"><h3>الدرج النقدي</h3>
      <table>
        <tr><td>رصيد افتتاحي</td><td>${d.openingBalance ?? 0}</td></tr>
        <tr><td>المتوقع</td><td>${d.expectedCash ?? 0}</td></tr>
        <tr><td>الفعلي بعد العدّ</td><td>${d.actualCash ?? 0}</td></tr>
        <tr class="total"><td>الفرق</td><td>${d.difference ?? 0}</td></tr>
      </table></div>

      ${d.emergencyNotes ? `<div class="sec"><h3>ملاحظات</h3><div>${d.emergencyNotes}</div></div>` : ''}

      <p class="foot">تم إصدار التقرير إلكترونياً — التسليم النقدي يدوي خارج النظام</p>
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
