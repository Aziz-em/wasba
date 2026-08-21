import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Typography, Paper, TextField, Button, List, ListItemButton, ListItemText, Alert, Grid } from '@mui/material'
import api from '../api/client'
import { toast } from 'react-toastify'
import { mediaUrl } from '../utils/media'
import { localDateTime } from '../utils/time'

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

  useEffect(() => { inputRef.current?.focus(); api.get('/Settings').then(r => setSettings(r.data)).catch(() => {}) }, [])
  useEffect(() => {
    if (params.get('r')) selectReceipt(params.get('r')!)
  }, [])

  useEffect(() => {
    if (q.length >= 2) {
      api.get('/Visits/active/search', { params: { q } }).then(r => setSuggestions(r.data)).catch(() => setSuggestions([]))
    } else setSuggestions([])
  }, [q])

  // Scanner (keyboard wedge): on Enter with full-ish code
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
    } catch (e: any) { toast.error(e.response?.data?.message || 'غير موجود'); setPreview(null) }
  }

  const confirm = async () => {
    if (!preview) return
    const receiptWindow = window.open('', '_blank', 'width=320,height=520')
    if (!receiptWindow) {
      toast.error('تعذر فتح نافذة الإيصال. اسمح بالنوافذ المنبثقة ثم أعد المحاولة')
      return
    }
    receiptWindow.document.write('<html dir="rtl"><body style="font-family:Tahoma;text-align:center;padding:24px">جاري تجهيز الإيصال...</body></html>')
    try {
      const r = await api.post('/Visits/checkout', {
        receiptNumber: preview.receiptNumber,
        paidCash, paidInstaPay: paidInsta, paidOther: 0, instaPayReference: instaRef || null
      })
      toast.success(r.data.overageAmount > 0 ? `تم الخروج — تجاوز ${r.data.overageAmount} ج.م` : 'تم الخروج')
      if (r.data.printExitReceipt) {
        const logo = settings?.logoPath ? `<div style="text-align:center"><img src="${mediaUrl(settings.logoPath)}" style="max-height:64px;max-width:160px"/></div>` : ''
        const children = (preview.childrenNames || [preview.childName]).map((name: string) => `<div>الطفل: ${name}</div>`).join('')
        receiptWindow.document.write(`<html dir="rtl"><head><title>إيصال خروج</title><style>body{font-family:Tahoma;width:280px;margin:8px auto;font-size:13px}h3,h4{text-align:center}.line{border-top:1px dashed #333;margin:8px 0}</style></head><body>
          ${logo}<h3>${settings?.centerName || 'Kids Area'}</h3><div style="text-align:center">${settings?.centerPhone || ''}</div><div class="line"></div>
          <h4>إيصال خروج</h4><div>الإيصال: <b>${preview.receiptNumber}</b></div>${children}
          <div>رقم الهاتف: ${preview.phone || ''}</div><div>وقت الدخول: ${localDateTime(preview.checkInTime)}</div>
          <div>وقت الخروج: ${new Date().toLocaleString('ar-EG')}</div><div>الباقة: ${preview.packageName}</div><div>ساعات التجاوز: ${preview.overageHours}</div>
          <div class="line"></div><div><b>الإجمالي: ${r.data.totalPaid} ج.م</b></div><div>مبلغ التجاوز: ${r.data.overageAmount} ج.م</div>
          <script>setTimeout(()=>print(),300)<\/script></body></html>`)
        receiptWindow.document.close()
      } else {
        receiptWindow.close()
      }
      setPreview(null); setQ(''); setPaidCash(0); setPaidInsta(0)
    } catch (e: any) { receiptWindow.close(); toast.error(e.response?.data?.message || 'فشل') }
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>تسجيل خروج</Typography>
      <Typography variant="body2" color="text.secondary" mb={1}>ابحث بجزء من رقم الإيصال أو امسح الـ QR بماسح / كاميرا (الماسح يكتب كاللوحة المفاتيح)</Typography>
      <Paper sx={{ p: 2, mb: 2, maxWidth: 520 }}>
        <TextField fullWidth inputRef={inputRef} label="رقم الإيصال / بحث" value={q}
          onChange={e => setQ(e.target.value)} onKeyDown={onKeyDown}
          placeholder="آخر 3 أرقام أو المسح..." autoComplete="off" />
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
            <Alert severity="info" sx={{ my: 1 }}>يوم كامل — لا رسوم تجاوز</Alert>
          ) : preview.overageAmount > 0 ? (
            <Alert severity="warning" sx={{ my: 1 }}>تجاوز: {preview.overageHours} ساعة = {preview.overageAmount} ج.م (بعد سماحية 15 د)</Alert>
          ) : (
            <Alert severity="success" sx={{ my: 1 }}>ضمن الباقة / السماحية — لا مبلغ إضافي</Alert>
          )}
          {preview.overageAmount > 0 && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}><TextField fullWidth type="number" label="نقدي" value={paidCash} onChange={e => setPaidCash(+e.target.value)} /></Grid>
              <Grid item xs={6}><TextField fullWidth type="number" label="InstaPay" value={paidInsta} onChange={e => setPaidInsta(+e.target.value)} /></Grid>
              <Grid item xs={12}><TextField fullWidth label="مرجع InstaPay (اختياري)" value={instaRef} onChange={e => setInstaRef(e.target.value)} /></Grid>
            </Grid>
          )}
          <Button fullWidth variant="contained" color="warning" size="large" sx={{ mt: 2 }} onClick={confirm}>تأكيد الخروج</Button>
        </Paper>
      )}
    </Box>
  )
}
