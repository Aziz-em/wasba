import { useEffect, useState } from 'react'
import {
  Box, Typography, Paper, TextField, Button, Grid, MenuItem, Divider, Alert,
  Accordion, AccordionSummary, AccordionDetails
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import api from '../api/client'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { localDateTime } from '../utils/time'
import { mediaUrl } from '../utils/media'

const fieldSx = {
  direction: 'rtl' as const,
  '& .MuiInputBase-input': { textAlign: 'right', direction: 'rtl' },
  '& .MuiInputLabel-root': { right: 24, left: 'auto', transformOrigin: 'top right' },
  '& .MuiOutlinedInput-notchedOutline': { borderWidth: 2 },
  '& .MuiFormHelperText-root': { textAlign: 'right', direction: 'rtl' }
}

function packagePriceOf(settings: any, pkg: number, siblings: number) {
  if (!settings) return 0
  if (siblings >= 2) {
    const row = (settings.siblingPrices || []).find(
      (x: any) => x.siblingsCount === siblings && x.durationPackage === pkg
    )
    return row?.price || 0
  }
  if (pkg === 1) return settings.price1Hour || 0
  if (pkg === 2) return settings.price2Hours || 0
  if (pkg === 3) return settings.price3Hours || 0
  if (pkg === 5) return settings.price4Hours || 0
  return settings.priceFullDay || 0
}

function hoursLabelOf(pkg: number) {
  if (pkg === 1) return '1'
  if (pkg === 2) return '2'
  if (pkg === 3) return '3'
  if (pkg === 5) return '4'
  return 'يوم كامل'
}

export default function CheckInPage() {
  const nav = useNavigate()
  const [settings, setSettings] = useState<any>(null)
  const [phone, setPhone] = useState('')
  const [childName, setChildName] = useState('')
  const [childAge, setChildAge] = useState(5)
  const [childWristband, setChildWristband] = useState('')
  const [companions, setCompanions] = useState(0)
  const [companionBands, setCompanionBands] = useState<string[]>([])
  const [siblings, setSiblings] = useState(0)
  const [siblingDetails, setSiblingDetails] = useState<{ name: string; age: number; wristband: string }[]>([])
  const [pkg, setPkg] = useState(1)
  const [useFlex, setUseFlex] = useState(false)
  const [paidCash, setPaidCash] = useState(0)
  const [paidInsta, setPaidInsta] = useState(0)
  const [instaRef, setInstaRef] = useState('')
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    api.get('/Settings').then(r => setSettings(r.data)).catch(() => {})
  }, [])

  const findCustomer = async () => {
    if (phone.length < 3) return
    try { await api.get(`/Customers/phone/${phone}`) } catch { /* تجاهل */ }
  }

  const total = (() => {
    if (!settings) return 0
    const packagePrice = packagePriceOf(settings, pkg, 1 + siblings); // أضف 1 للطفل الأساسي
    const extraComp = Math.max(0, companions - 2) * (settings.extraCompanionPrice || 0)
    const flex = settings.flexibleFieldEnabled && useFlex ? (settings.flexibleFieldPrice || 0) : 0
    return packagePrice + extraComp + flex
  })()

  const changeSiblings = (count: number) => {
    setSiblings(count)
    setSiblingDetails(current =>
      Array.from({ length: Math.max(0, count - 1) }, (_, index) =>
        current[index] || { name: '', age: 5, wristband: '' }
      )
    )
  }

  const changeCompanions = (count: number) => {
    const n = Math.max(0, count)
    setCompanions(n)
    setCompanionBands(current => Array.from({ length: n }, (_, i) => current[i] || ''))
  }

  const setCompanionBand = (index: number, value: string) => {
    setCompanionBands(cur => {
      const n = [...cur]
      while (n.length < companions) n.push('')
      n[index] = value
      return n
    })
  }

  const submit = async () => {
    try {
      const body = {
        phone,
        customerName: '',
        childName,
        childAge,
        childWristband: childWristband || null,
        companionsCount: companions,
        companionWristbands: companionBands || [],
        siblingsCount: siblings,
        package: pkg,
        membershipId: null,
        useMembership: false,
        useFlexibleField: useFlex,
        paidCash,
        paidInstaPay: paidInsta,
        paidOther: 0,
        instaPayReference: instaRef || null,
        notes: null,
        siblings: siblingDetails
          .filter(s => s.name.trim())
          .map(s => ({
            name: s.name,
            age: s.age,
            wristband: s.wristband || null
          }))
      }
      const r = await api.post('/Visits/checkin', body)
      setResult(r.data)
      toast.success(`تم التسجيل — ${r.data.receiptNumber}`)
      printReceipt(r.data)
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'فشل')
    }
  }

  const printReceipt = (data: any) => {
    const w = window.open('', '_blank', 'width=320,height=720')
    if (!w) return

    const logoSrc = mediaUrl(settings?.logoPath)
    const logoHtml = logoSrc
      ? `<div style="text-align:center"><img src="${logoSrc}" style="max-height:64px;max-width:160px"/></div>`
      : ''

    const childrenRows: { name: string; age: number; band: string }[] = [
      { name: childName, age: childAge, band: childWristband || '—' }
    ]
    siblingDetails.filter(s => s.name.trim()).forEach(s => {
      childrenRows.push({ name: s.name, age: s.age, band: s.wristband || '—' })
    })

    const childrenTableRows = childrenRows.map(c =>
      `<tr>
        <td>${(c.name || '').trim().split(/\s+/)[0] || c.name}</td>
        <td style="text-align:center">${c.age}</td>
        <td style="text-align:center">${c.band}</td>
      </tr>`
    ).join('')

    const extraCompPrice = settings?.extraCompanionPrice || 0
    const companionsCost = Math.max(0, companions - 2) * extraCompPrice
    const companionsCostText = companions <= 2 ? 'مجاني' : `${companionsCost} ج.م`
    const companionBandsText = (companionBands || []).filter(Boolean).join(' ، ') || '—'

    const hoursLabel = hoursLabelOf(pkg)
    const packagePrice = packagePriceOf(settings, pkg, siblings)
    const flex = settings?.flexibleFieldEnabled && useFlex ? (settings?.flexibleFieldPrice || 0) : 0

    const payMethods: string[] = []
    if (paidCash > 0) payMethods.push('نقدي')
    if (paidInsta > 0) payMethods.push('InstaPay')
    const payText = payMethods.length ? payMethods.join(' + ') : '—'

    const inTime = localDateTime(data.checkInTime)
    const outTime = data.expectedCheckOutTime ? localDateTime(data.expectedCheckOutTime) : '—'

    w.document.write(`<!DOCTYPE html><html dir="rtl"><head><title>إيصال</title>
<style>
  body{font-family:Tahoma,Arial;width:280px;margin:8px auto;font-size:12px;color:#000}
  h3,h4{margin:6px 0;text-align:center}
  .line{border-top:1px dashed #333;margin:10px 0}
  table{width:100%;border-collapse:collapse;margin:8px 0}
  th,td{border:1px solid #333;padding:5px 4px;vertical-align:top}
  th{background:#f0f0f0;font-size:11px}
  .cost{text-align:left;white-space:nowrap}
  .time-row{margin:6px 0}
  .time-val{font-weight:bold;font-size:12px;letter-spacing:0.3px}
  .out-val{font-weight:bold;font-size:11px;letter-spacing:0.6px}
  .thanks{text-align:center;margin:14px 0 8px;font-weight:bold}
  .qr{text-align:center;margin:6px 0 4px}
  .total{margin:8px 0;font-size:13px}
</style></head><body>
  ${logoHtml}
  <h3>${settings?.centerName || 'Kids Area'}</h3>
  <div style="text-align:center">${settings?.centerPhone || ''}</div>
  <div class="line"></div>
  <h4>إيصال دخول</h4>
  <div>رقم: <b>${data.receiptNumber}</b></div>
  <div>الهاتف: ${phone}</div>

  <table>
    <thead><tr><th>اسم الطفل</th><th>العمر</th><th>رقم السوار</th></tr></thead>
    <tbody>${childrenTableRows}</tbody>
  </table>

  <table>
    <thead><tr><th>عدد المرافقين</th><th>رقم السوار</th><th>التكلفة</th></tr></thead>
    <tbody>
      <tr>
        <td style="text-align:center">${companions}</td>
        <td>${companionBandsText}</td>
        <td class="cost">${companionsCostText}</td>
      </tr>
    </tbody>
  </table>

  <table>
    <thead><tr><th>عدد الساعات</th><th>التكلفة</th></tr></thead>
    <tbody>
      <tr>
        <td style="text-align:center">${hoursLabel}</td>
        <td class="cost">${packagePrice} ج.م</td>
      </tr>
      ${flex > 0 ? `<tr><td>${settings?.flexibleFieldLabel || 'إضافة'}</td><td class="cost">${flex} ج.م</td></tr>` : ''}
    </tbody>
  </table>

  <div class="time-row">وقت الدخول: <span class="time-val">${inTime}</span></div>
  <div class="time-row">وقت الخروج: <span class="out-val">${outTime}</span></div>

  <div class="line"></div>
  <div class="total">الإجمالي: <b>${data.totalAmount} ج.م</b> <span>(${payText})</span></div>

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
        <Button fullWidth sx={{ mt: 1 }} onClick={() => {
          setResult(null)
          setChildName('')
          setChildWristband('')
          setCompanionBands([])
          setCompanions(0)
          setSiblingDetails([])
          setSiblings(0)
          setPaidCash(0)
          setPaidInsta(0)
        }}>دخول جديد</Button>
      </Paper>
    )
  }

  const childCount = 1 + siblingDetails.length

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>تسجيل دخول طفل</Typography>
      <Paper sx={{ p: 2 }}>
        <Grid container spacing={2}>
          {/* 1) الهاتف */}
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="رقم هاتف ولي الأمر *" value={phone}
              onChange={e => setPhone(e.target.value)} onBlur={findCustomer} sx={fieldSx} />
          </Grid>

          {/* 2) مرافقين / أخوة / ساعات */}
          <Grid item xs={12} sm={4}>
            <TextField fullWidth type="number" label="عدد المرافقين" value={companions}
              onChange={e => changeCompanions(+e.target.value)} inputProps={{ min: 0 }}
              helperText="أول 2 مجاناً" sx={fieldSx} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth type="number" label="عدد الأخوة (0=فرد)" value={siblings}
              onChange={e => changeSiblings(+e.target.value)} inputProps={{ min: 0 }}
              helperText="2 فأكثر = تسعير أخوة" sx={fieldSx} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth select label="عدد الساعات" value={pkg}
              onChange={e => setPkg(+e.target.value)} sx={fieldSx}>
              <MenuItem value={1}>ساعة</MenuItem>
              <MenuItem value={2}>ساعتان</MenuItem>
              <MenuItem value={3}>3 ساعات</MenuItem>
              <MenuItem value={5}>4 ساعات</MenuItem>
              <MenuItem value={4}>يوم كامل</MenuItem>
            </TextField>
          </Grid>

          {/* 3) الطفل الأول */}
          <Grid item xs={8}>
            <TextField fullWidth label="اسم الطفل *" value={childName}
              onChange={e => setChildName(e.target.value)} sx={fieldSx} />
          </Grid>
          <Grid item xs={4}>
            <TextField fullWidth type="number" label="العمر *" value={childAge}
              onChange={e => setChildAge(+e.target.value)} inputProps={{ min: 1 }} sx={fieldSx} />
          </Grid>

          {/* 4) الأخوة */}
          {siblingDetails.map((sibling, index) => (
            <Grid item xs={12} key={index}>
              <Grid container spacing={1}>
                <Grid item xs={8}>
                  <TextField fullWidth label={`اسم الأخ ${index + 2}`} value={sibling.name}
                    onChange={e => setSiblingDetails(cur =>
                      cur.map((it, i) => i === index ? { ...it, name: e.target.value } : it)
                    )} sx={fieldSx} />
                </Grid>
                <Grid item xs={4}>
                  <TextField fullWidth type="number" label="العمر" value={sibling.age}
                    onChange={e => setSiblingDetails(cur =>
                      cur.map((it, i) => i === index ? { ...it, age: +e.target.value } : it)
                    )} inputProps={{ min: 1 }} sx={fieldSx} />
                </Grid>
              </Grid>
            </Grid>
          ))}

          {/* 5) الأساور — مطوية */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography fontWeight="bold">أرقام الأساور (اضغط للفتح)</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={1}>
                  {Array.from({ length: Math.max(childCount, companions) }, (_, i) => (
                    <Grid item xs={12} key={`band-row-${i}`}>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          {i === 0 ? (
                            <TextField fullWidth label="سوار الطفل 1" value={childWristband}
                              onChange={e => setChildWristband(e.target.value)} sx={fieldSx} />
                          ) : i < childCount ? (
                            <TextField fullWidth label={`سوار الطفل ${i + 1}`}
                              value={siblingDetails[i - 1]?.wristband || ''}
                              onChange={e => setSiblingDetails(cur =>
                                cur.map((it, idx) => idx === i - 1 ? { ...it, wristband: e.target.value } : it)
                              )} sx={fieldSx} />
                          ) : <Box />}
                        </Grid>
                        <Grid item xs={6}>
                          {i < companions ? (
                            <TextField fullWidth label={`سوار المرافق ${i + 1}`}
                              value={companionBands[i] || ''}
                              onChange={e => setCompanionBand(i, e.target.value)} sx={fieldSx} />
                          ) : <Box />}
                        </Grid>
                      </Grid>
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {settings?.flexibleFieldEnabled && (
            <Grid item xs={12}>
              <Button variant={useFlex ? 'contained' : 'outlined'} onClick={() => setUseFlex(!useFlex)}>
                {settings.flexibleFieldLabel}: {settings.flexibleFieldPrice} ج.م {useFlex ? '✓' : ''}
              </Button>
            </Grid>
          )}

          <Grid item xs={12}>
            <Divider />
            <Typography variant="h6" mt={1}>المطلوب: {total} ج.م</Typography>
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth type="number" label="نقدي" value={paidCash}
              onChange={e => setPaidCash(+e.target.value)} sx={fieldSx} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth type="number" label="InstaPay" value={paidInsta}
              onChange={e => setPaidInsta(+e.target.value)} sx={fieldSx} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="مرجع InstaPay (اختياري)" value={instaRef}
              onChange={e => setInstaRef(e.target.value)} sx={fieldSx} />
          </Grid>
          <Grid item xs={12}>
            <Button fullWidth variant="contained" size="large" onClick={submit}>
              تأكيد الدخول + طباعة
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  )
}
