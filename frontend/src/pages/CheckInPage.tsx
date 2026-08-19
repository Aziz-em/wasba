import { useEffect, useState } from 'react'
import { Box, Typography, Paper, TextField, Button, Grid, MenuItem, Divider, Alert } from '@mui/material'
import api from '../api/client'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'

export default function CheckInPage() {
  const nav = useNavigate()
  const [settings, setSettings] = useState<any>(null)
  const [phone, setPhone] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [childName, setChildName] = useState('')
  const [childAge, setChildAge] = useState(5)
  const [companions, setCompanions] = useState(0)
  const [siblings, setSiblings] = useState(0)
  const [pkg, setPkg] = useState(1)
  const [useMem, setUseMem] = useState(false)
  const [membershipId, setMembershipId] = useState<number | null>(null)
  const [memberships, setMemberships] = useState<any[]>([])
  const [useFlex, setUseFlex] = useState(false)
  const [paidCash, setPaidCash] = useState(0)
  const [paidInsta, setPaidInsta] = useState(0)
  const [instaRef, setInstaRef] = useState('')
  const [result, setResult] = useState<any>(null)

  useEffect(() => { api.get('/Settings').then(r => setSettings(r.data)).catch(() => {}) }, [])

  const findCustomer = async () => {
    if (phone.length < 3) return
    try {
      const r = await api.get(`/Customers/phone/${phone}`)
      setCustomerName(r.data.name || '')
      const mems = await api.get('/Memberships')
      setMemberships((mems.data || []).filter((m: any) => m.phone === phone && m.isActive))
    } catch {
      setMemberships([])
    }
  }

  const calcPreview = () => {
    if (!settings) return 0
    let packagePrice = 0
    if (!useMem) {
      if (siblings >= 2) {
        const row = (settings.siblingPrices || []).find((x: any) => x.siblingsCount === siblings && x.durationPackage === pkg)
        packagePrice = row?.price || 0
      } else {
        packagePrice = pkg === 1 ? settings.price1Hour : pkg === 2 ? settings.price2Hours : pkg === 3 ? settings.price3Hours : settings.priceFullDay
      }
    }
    const extraComp = Math.max(0, companions - 2) * (settings.extraCompanionPrice || 0)
    const flex = settings.flexibleFieldEnabled && useFlex ? settings.flexibleFieldPrice : 0
    return packagePrice + extraComp + flex
  }

  const total = calcPreview()

  const submit = async () => {
    try {
      const body = {
        phone, customerName, childName, childAge,
        companionsCount: companions, siblingsCount: siblings, package: pkg,
        membershipId: useMem ? membershipId : null, useMembership: useMem,
        useFlexibleField: useFlex,
        paidCash, paidInstaPay: paidInsta, paidOther: 0, instaPayReference: instaRef || null, notes: null
      }
      const r = await api.post('/Visits/checkin', body)
      setResult(r.data)
      toast.success(`تم التسجيل — ${r.data.receiptNumber}`)
      // print thermal-like window
      printReceipt(r.data)
    } catch (e: any) { toast.error(e.response?.data?.message || 'فشل') }
  }

  const printReceipt = (data: any) => {
    const w = window.open('', '_blank', 'width=320,height=600')
    if (!w) return
    const logoHtml = settings?.logoPath ? `<div style="text-align:center"><img src="${settings.logoPath}" style="max-height:64px;max-width:160px"/></div>` : ''
    w.document.write(`<!DOCTYPE html><html dir="rtl"><head><title>إيصال</title>
      <style>body{font-family:Tahoma;width:280px;margin:8px auto;font-size:13px}
      h3,h4{margin:4px 0;text-align:center}.line{border-top:1px dashed #333;margin:8px 0}
      .qr{text-align:center;margin-top:10px}</style></head><body>
      ${logoHtml}
      <h3>${settings?.centerName || 'Kids Area'}</h3>
      <div style="text-align:center">${settings?.centerPhone || ''}</div>
      <div class="line"></div>
      <h4>إيصال دخول</h4>
      <div>رقم: <b>${data.receiptNumber}</b></div>
      <div>الطفل: ${childName} — عمر ${childAge}</div>
      <div>الجوال: ${phone}</div>
      <div>المرافقون: ${companions}</div>
      <div>الوقت: ${new Date(data.checkInTime).toLocaleString('ar-EG')}</div>
      <div class="line"></div>
      <div>الإجمالي: <b>${data.totalAmount} ج.م</b></div>
      <div>نقدي: ${paidCash} | InstaPay: ${paidInsta}</div>
      <div class="line"></div>
      <div class="qr"><div id="qr"></div><div>${data.receiptNumber}</div></div>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>
      <script>new QRCode(document.getElementById('qr'),{text:'${data.receiptNumber}',width:120,height:120});setTimeout(()=>window.print(),400)<\/script>
      </body></html>`)
    w.document.close()
  }

  if (result) {
    return (
      <Paper sx={{ p: 3, maxWidth: 420 }}>
        <Alert severity="success" sx={{ mb: 2 }}>تم تسجيل الدخول</Alert>
        <Typography>الإيصال: <b>{result.receiptNumber}</b></Typography>
        <Typography>المبلغ: {result.totalAmount} ج.م</Typography>
        <Box sx={{ my: 2, display: 'flex', justifyContent: 'center' }}>
          <QRCodeSVG value={result.receiptNumber} size={140} />
        </Box>
        <Button fullWidth variant="contained" onClick={() => printReceipt(result)}>إعادة طباعة الإيصال</Button>
        <Button fullWidth sx={{ mt: 1 }} onClick={() => { setResult(null); nav('/active') }}>عرض الحاليين</Button>
        <Button fullWidth sx={{ mt: 1 }} onClick={() => { setResult(null); setChildName(''); setPaidCash(0); setPaidInsta(0) }}>دخول جديد</Button>
      </Paper>
    )
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>تسجيل دخول طفل</Typography>
      <Paper sx={{ p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="جوال ولي الأمر *" value={phone} onChange={e => setPhone(e.target.value)} onBlur={findCustomer} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="اسم العميل" value={customerName} onChange={e => setCustomerName(e.target.value)} />
          </Grid>
          <Grid item xs={8}><TextField fullWidth label="اسم الطفل *" value={childName} onChange={e => setChildName(e.target.value)} /></Grid>
          <Grid item xs={4}><TextField fullWidth type="number" label="العمر *" value={childAge} onChange={e => setChildAge(+e.target.value)} inputProps={{ min: 1 }} /></Grid>
          <Grid item xs={6}><TextField fullWidth type="number" label="عدد المرافقين" value={companions} onChange={e => setCompanions(+e.target.value)} inputProps={{ min: 0 }} helperText="أول 2 مجاناً" /></Grid>
          <Grid item xs={6}><TextField fullWidth type="number" label="عدد الأخوة (0=فرد)" value={siblings} onChange={e => setSiblings(+e.target.value)} inputProps={{ min: 0 }} helperText="2 فأكثر = تسعير أخوة" /></Grid>
          <Grid item xs={12}>
            <TextField fullWidth select label="الباقة" value={pkg} onChange={e => setPkg(+e.target.value)}>
              <MenuItem value={1}>ساعة</MenuItem>
              <MenuItem value={2}>ساعتان</MenuItem>
              <MenuItem value={3}>3 ساعات</MenuItem>
              <MenuItem value={4}>يوم كامل</MenuItem>
            </TextField>
          </Grid>
          {memberships.length > 0 && (
            <Grid item xs={12}>
              <TextField fullWidth select label="عضوية نشطة" value={membershipId ?? ''} onChange={e => { setMembershipId(+e.target.value); setUseMem(true) }}>
                <MenuItem value="">بدون عضوية</MenuItem>
                {memberships.map((m: any) => (
                  <MenuItem key={m.id} value={m.id}>{m.typeName} — متبقي {m.remainingHours}س — حتى {new Date(m.endDate).toLocaleDateString('ar-EG')}</MenuItem>
                ))}
              </TextField>
            </Grid>
          )}
          {settings?.flexibleFieldEnabled && (
            <Grid item xs={12}>
              <Button variant={useFlex ? 'contained' : 'outlined'} onClick={() => setUseFlex(!useFlex)}>
                {settings.flexibleFieldLabel}: {settings.flexibleFieldPrice} ج.م {useFlex ? '✓' : ''}
              </Button>
            </Grid>
          )}
          <Grid item xs={12}><Divider /><Typography variant="h6" mt={1}>المطلوب: {total} ج.م</Typography></Grid>
          <Grid item xs={6}><TextField fullWidth type="number" label="نقدي" value={paidCash} onChange={e => setPaidCash(+e.target.value)} /></Grid>
          <Grid item xs={6}><TextField fullWidth type="number" label="InstaPay" value={paidInsta} onChange={e => setPaidInsta(+e.target.value)} /></Grid>
          <Grid item xs={12}><TextField fullWidth label="مرجع InstaPay (اختياري)" value={instaRef} onChange={e => setInstaRef(e.target.value)} /></Grid>
          <Grid item xs={12}><Button fullWidth variant="contained" size="large" onClick={submit}>تأكيد الدخول + طباعة</Button></Grid>
        </Grid>
      </Paper>
    </Box>
  )
}
