import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Typography, Paper, TextField, Button, List, ListItemButton, ListItemText, Alert, Grid } from '@mui/material'
import api from '../api/client'
import { toast } from 'react-toastify'
import { localDateTime } from '../utils/time'

// إصلاح استيراد mediaUrl
import { mediaUrl as media } from '../utils/media'

export default function CheckOutPage() {
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('r') || '')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [preview, setPreview] = useState<any>(null)
  const [paidCash, setPaidCash] = useState(0)
  const [paidInsta, setPaidInsta] = useState(0)
  const [instaRef, setInstaRef] = useState('')
  const [settings, setSettings] = useState<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    api.get('/Settings').then(r => setSettings(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (params.get('r')) selectReceipt(params.get('r')!)
  }, [])

  useEffect(() => {
    if (q.length >= 2) {
      api.get('/Visits/active/search', { params: { q } })
        .then(r => setSuggestions(r.data))
        .catch(() => setSuggestions([]))
    } else setSuggestions([])
  }, [q])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && q.trim()) {
      e.preventDefault()
      selectReceipt(q.trim())
    }
  }

  const selectReceipt = async (receipt: string) => {
    setQ(receipt)
    setSuggestions([])
    try {
      const r = await api.get('/Visits/checkout/preview', { params: { receipt } })
      setPreview(r.data)
      setPaidCash(r.data.overageAmount || 0)
      setPaidInsta(0)
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'غير موجود')
      setPreview(null)
    }
  }

  const printExitReceipt = (data: {
    receiptNumber: string
    childrenNames: string[]
    childrenAges?: number[]
    phone: string
    checkInTime: string
    checkOutTime: string
    packageHours: number
    extraHours: number
    packageAmountPaid: number
    extraAmount: number
    totalAmount: number
    paidCash: number
    paidInsta: number
    remaining: number
  }) => {
    const w = window.open('', '_blank', 'width=320,height=720')
    if (!w) return

    const logoHtml = settings?.logoPath
      ? `<div style="text-align:center"><img src="${media(settings.logoPath)}" style="max-height:64px;max-width:160px"/></div>`
      : ''

    const names = data.childrenNames?.length ? data.childrenNames : ['—']
    const ages = data.childrenAges || []
    const childRows = names.map((n, i) => {
      const first = (n || '').trim().split(/\s+/)[0] || n
      const age = ages[i] > 0 ? ages[i] : '—'
      return `<tr><td>${first}</td><td style="text-align:center">${age}</td></tr>`
    }).join('')

    const totalHoursLabel = data.packageHours + data.extraHours
    const hoursCost = data.packageAmountPaid + data.extraAmount

    let payMethods: string[] = []
    if (data.paidCash > 0) payMethods.push('نقدي')
    if (data.paidInsta > 0) payMethods.push('InstaPay')
    const payText = payMethods.length ? payMethods.join(' + ') : '—'

    w.document.write(`<!DOCTYPE html><html dir="rtl"><head><title>إيصال خروج</title>
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
  .thanks{text-align:center;margin:14px 0 8px;font-weight:bold}
</style></head><body>
  ${logoHtml}
  <h3>${settings?.centerName || 'Kids Area'}</h3>
  <div style="text-align:center">${settings?.centerPhone || ''}</div>
  <div class="line"></div>
  <h4>إيصال خروج</h4>
  <div>رقم: <b>${data.receiptNumber}</b></div>
  <div>الهاتف: ${data.phone || ''}</div>

  <table>
    <thead><tr><th>اسم الطفل</th><th>العمر</th></tr></thead>
    <tbody>${childRows}</tbody>
  </table>

  <table>
    <thead><tr><th>عدد الساعات</th><th>التكلفة</th></tr></thead>
    <tbody>
      <tr>
        <td style="text-align:center">${totalHoursLabel}</td>
        <td class="cost">${hoursCost} ج.م</td>
      </tr>
      ${data.extraHours > 0 ? `<tr><td>ساعات إضافية: ${data.extraHours}</td><td class="cost">${data.extraAmount} ج.م</td></tr>` : ''}
    </tbody>
  </table>

  <div class="time-row">وقت الدخول: <span class="time-val">${localDateTime(data.checkInTime)}</span></div>
  <div class="time-row">وقت الخروج: <span class="time-val">${data.checkOutTime}</span></div>

  <div class="line"></div>
  <div>الإجمالي: <b>${data.totalAmount} ج.م</b></div>
  <div>المدفوع سابقاً: ${data.packageAmountPaid} ج.م</div>
  <div>المتبقي: <b>${data.remaining} ج.م</b> (${payText})</div>

  <div class="thanks">شكراً لزيارتكم</div>
  <script>setTimeout(function(){ window.print(); }, 300);<\/script>
</body></html>`)
    w.document.close()
  }

  const confirm = async () => {
    if (!preview) return
    try {
      const r = await api.post('/Visits/checkout', {
        receiptNumber: preview.receiptNumber,
        paidCash,
        paidInstaPay: paidInsta,
        paidOther: 0,
        instaPayReference: instaRef || null
      })

      const extra = r.data.overageAmount || 0
      toast.success(extra > 0 ? `تم الخروج — ساعات إضافية ${extra} ج.م` : 'تم الخروج')

      // اطبع دائماً إيصال خروج (حتى بدون مبلغ إضافي) — أو فقط عند وجود مبلغ:
      // if (r.data.printExitReceipt) { ... }
      const names = preview.childrenNames || [preview.childName]
      printExitReceipt({
        receiptNumber: preview.receiptNumber,
        childrenNames: names,
        childrenAges: preview.childrenAges || [],
        phone: preview.phone || '',
        checkInTime: preview.checkInTime,
        checkOutTime: new Date().toISOString(),
        packageHours: preview.isFullDay ? 0 : (preview.packageName === 'ساعتان' ? 2 : preview.packageName === '3 ساعات' ? 3 : 1),
        extraHours: preview.overageHours || 0,
        packageAmountPaid: preview.alreadyPaid || 0,
        extraAmount: extra,
        totalAmount: r.data.totalPaid,
        paidCash,
        paidInsta,
        remaining: extra
      })

      setPreview(null)
      setQ('')
      setPaidCash(0)
      setPaidInsta(0)
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'فشل')
    }
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>تسجيل خروج طفل</Typography>
      <Typography variant="body2" color="text.secondary" mb={1}>
        ابحث بجزء من رقم الإيصال أو امسح الـ QR
      </Typography>
      <Paper sx={{ p: 2, mb: 2, maxWidth: 520 }}>
        <TextField
          fullWidth inputRef={inputRef} label="رقم الإيصال / بحث" value={q}
          onChange={e => setQ(e.target.value)} onKeyDown={onKeyDown}
          placeholder="آخر 3 أرقام أو المسح..." autoComplete="off"
        />
        {suggestions.length > 0 && (
          <List dense>
            {suggestions.map(s => (
              <ListItemButton key={s.id} onClick={() => selectReceipt(s.receiptNumber)}>
                <ListItemText primary={`${s.receiptNumber} — ${s.childName}`} secondary={s.phone} />
              </ListItemButton>
            ))}
          </List>
        )}
      </Paper>

      {preview && (
        <Paper sx={{ p: 2, maxWidth: 520 }}>
          <Typography>الطفل: <b>{preview.childName}</b></Typography>
          <Typography>الدخول: {localDateTime(preview.checkInTime)}</Typography>
          <Typography>الباقة: {preview.packageName}</Typography>
          {preview.isFullDay ? (
            <Alert severity="info" sx={{ my: 1 }}>يوم كامل — لا ساعات إضافية</Alert>
          ) : preview.overageAmount > 0 ? (
            <Alert severity="warning" sx={{ my: 1 }}>
              ساعات إضافية: {preview.overageHours} — المطلوب {preview.overageAmount} ج.م (بعد السماحية)
            </Alert>
          ) : (
            <Alert severity="success" sx={{ my: 1 }}>ضمن الباقة / السماحية — لا مبلغ إضافي</Alert>
          )}
          {preview.overageAmount > 0 && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <TextField fullWidth type="number" label="نقدي" value={paidCash} onChange={e => setPaidCash(+e.target.value)} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth type="number" label="InstaPay" value={paidInsta} onChange={e => setPaidInsta(+e.target.value)} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="مرجع InstaPay (اختياري)" value={instaRef} onChange={e => setInstaRef(e.target.value)} />
              </Grid>
            </Grid>
          )}
          <Button fullWidth variant="contained" color="warning" size="large" sx={{ mt: 2 }} onClick={confirm}>
            تأكيد الخروج
          </Button>
        </Paper>
      )}
    </Box>
  )
}