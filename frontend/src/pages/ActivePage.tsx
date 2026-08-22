import { useEffect, useState } from 'react'
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Button } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { localTime, localDateTime } from '../utils/time'
import { toast } from 'react-toastify'
import { mediaUrl } from '../utils/media'

export default function ActivePage() {
  const [list, setList] = useState<any[]>([])
  const nav = useNavigate()
  const load = () => api.get('/Visits/active').then(r => setList(r.data)).catch(() => {})
  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t) }, [])

  const printReceipt = (data: any) => {
    const w = window.open('', '_blank', 'width=320,height=720')
    if (!w) return

    const logoSrc = mediaUrl(data.logoPath)
    const logoHtml = logoSrc
      ? `<div style="text-align:center"><img src="${logoSrc}" style="max-height:64px;max-width:160px"/></div>`
      : ''

    const childrenRows = (data.children || []).map((c: any) => {
      const first = (c.name || '').trim().split(/\s+/)[0] || c.name
      return `<tr>
        <td>${first}</td>
        <td style="text-align:center">${c.age || '—'}</td>
        <td style="text-align:center">${c.wristband || '—'}</td>
      </tr>`
    }).join('')

    const companionsCostText = (data.companionsCount || 0) <= 2
      ? 'مجاني'
      : `${data.companionsAmount || 0} ج.م`

    const bands = (data.companionWristbands || '').split(',').map((x: string) => x.trim()).filter(Boolean).join(' ، ') || '—'
    const inTime = localDateTime(data.checkInTime)
    const outTime = data.checkOutTime ? localDateTime(data.checkOutTime) : '—'
    const flexRow = data.flexibleAmount > 0
      ? `<tr><td>${data.flexibleLabel || 'إضافة'}</td><td class="cost">${data.flexibleAmount} ج.م</td></tr>`
      : ''

    w.document.write(`<!DOCTYPE html><html dir="rtl"><head><title>إيصال</title>
<style>
  body{font-family:Tahoma,Arial;width:280px;margin:8px auto;font-size:12px}
  h3,h4{margin:6px 0;text-align:center}
  .line{border-top:1px dashed #333;margin:10px 0}
  table{width:100%;border-collapse:collapse;margin:8px 0}
  th,td{border:1px solid #333;padding:5px 4px}
  th{background:#f0f0f0;font-size:11px}
  .cost{text-align:left;white-space:nowrap}
  .time-row{margin:6px 0}
  .time-val{font-weight:bold;font-size:12px}
  .out-val{font-weight:bold;font-size:11px;letter-spacing:0.6px}
  .thanks{text-align:center;margin:14px 0 8px;font-weight:bold}
  .qr{text-align:center;margin:6px 0 4px}
</style></head><body>
  ${logoHtml}
  <h3>${data.centerName || 'Kids Area'}</h3>
  <div style="text-align:center">${data.centerPhone || ''}</div>
  <div class="line"></div>
  <h4>إيصال دخول</h4>
  <div>رقم: <b>${data.receiptNumber}</b></div>
  <div>الهاتف: ${data.phone || ''}</div>

  <table>
    <thead><tr><th>اسم الطفل</th><th>العمر</th><th>رقم السوار</th></tr></thead>
    <tbody>${childrenRows}</tbody>
  </table>

  <table>
    <thead><tr><th>عدد المرافقين</th><th>رقم السوار</th><th>التكلفة</th></tr></thead>
    <tbody>
      <tr>
        <td style="text-align:center">${data.companionsCount || 0}</td>
        <td>${bands}</td>
        <td class="cost">${companionsCostText}</td>
      </tr>
    </tbody>
  </table>

  <table>
    <thead><tr><th>عدد الساعات</th><th>التكلفة</th></tr></thead>
    <tbody>
      <tr>
        <td style="text-align:center">${data.hoursLabel || '—'}</td>
        <td class="cost">${data.packageAmount || 0} ج.م</td>
      </tr>
      ${flexRow}
    </tbody>
  </table>

  <div class="time-row">وقت الدخول: <span class="time-val">${inTime}</span></div>
  <div class="time-row">وقت الخروج: <span class="out-val">${outTime}</span></div>
  <div class="line"></div>
  <div>الإجمالي: <b>${data.totalAmount} ج.م</b> (${data.payText || '—'})</div>
  <div class="thanks">شكراً لزيارتكم</div>
  <div class="qr"><div id="qr"></div></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>
  <script>
    new QRCode(document.getElementById('qr'),{text:'${data.receiptNumber}',width:120,height:120});
    setTimeout(function(){ window.print(); }, 400);
  <\/script>
</body></html>`)
    w.document.close()
  }

  const reprint = async (receiptNumber: string) => {
    try {
      const { data } = await api.get(`/Visits/receipt/${encodeURIComponent(receiptNumber)}`)
      printReceipt(data)
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'تعذر جلب الإيصال')
    }
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        الأطفال النشيطون الآن ({list.reduce((sum, visit) => sum + (visit.childrenCount || 1), 0)})
      </Typography>
      <Table size="small" component={Paper}>
        <TableHead>
          <TableRow>
            <TableCell>الإيصال</TableCell>
            <TableCell>الأطفال</TableCell>
            <TableCell>رقم الهاتف</TableCell>
            <TableCell>الباقة</TableCell>
            <TableCell>الدخول</TableCell>
            <TableCell>الخروج</TableCell>
            <TableCell>المرافقون</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {list.map(v => (
            <TableRow key={v.id}>
              <TableCell>{v.receiptNumber}</TableCell>
              <TableCell>
                {(v.childrenNames || [v.childName]).map((name: string, index: number) => {
                  const age = (v.childrenAges || [v.childAge])[index]
                  return <div key={index}>{name} ({age > 0 ? age : '—'} سنة)</div>
                })}
              </TableCell>
              <TableCell>{v.phone}</TableCell>
              <TableCell>{v.packageName}</TableCell>
              <TableCell>{localTime(v.checkInTime)}</TableCell>
              <TableCell>{v.expectedCheckOutTime ? localTime(v.expectedCheckOutTime) : '—'}</TableCell>
              <TableCell>{v.companionsCount}</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                <Button size="small" onClick={() => reprint(v.receiptNumber)}>إيصال</Button>
                <Button size="small" onClick={() => nav(`/checkout?r=${encodeURIComponent(v.receiptNumber)}`)}>خروج</Button>
              </TableCell>
            </TableRow>
          ))}
          {list.length === 0 && (
            <TableRow><TableCell colSpan={8} align="center">لا يوجد أطفال الآن</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </Box>
  )
}