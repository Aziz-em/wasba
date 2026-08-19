import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Box, Typography, Paper, TextField, Button, List, ListItemButton, ListItemText, Alert, Grid } from '@mui/material'
import api from '../api/client'
import { toast } from 'react-toastify'

export default function CheckOutPage() {
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('r') || '')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [preview, setPreview] = useState<any>(null)
  const [paidCash, setPaidCash] = useState(0)
  const [paidInsta, setPaidInsta] = useState(0)
  const [instaRef, setInstaRef] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])
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
    try {
      const r = await api.post('/Visits/checkout', {
        receiptNumber: preview.receiptNumber,
        paidCash, paidInstaPay: paidInsta, paidOther: 0, instaPayReference: instaRef || null
      })
      toast.success(r.data.overageAmount > 0 ? `تم الخروج — تجاوز ${r.data.overageAmount} ج.م` : 'تم الخروج')
      if (r.data.printExitReceipt) {
        // simple exit receipt
        const w = window.open('', '_blank', 'width=320,height=480')
        if (w) {
          w.document.write(`<html dir="rtl"><body style="font-family:Tahoma;width:280px"><h3 style="text-align:center">إيصال خروج — تجاوز</h3>
            <div>الإيصال: ${preview.receiptNumber}</div>
            <div>الطفل: ${preview.childName}</div>
            <div>ساعات التجاوز: ${preview.overageHours}</div>
            <div><b>المبلغ: ${r.data.overageAmount} ج.م</b></div>
            <script>setTimeout(()=>print(),300)<\/script></body></html>`)
          w.document.close()
        }
      }
      setPreview(null); setQ(''); setPaidCash(0); setPaidInsta(0)
    } catch (e: any) { toast.error(e.response?.data?.message || 'فشل') }
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
          <Typography>الدخول: {new Date(preview.checkInTime).toLocaleString('ar-EG')}</Typography>
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
