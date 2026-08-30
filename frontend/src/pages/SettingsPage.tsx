import { useEffect, useState, useRef } from 'react'
import {
  Box, Typography, Paper, Grid, TextField, Button, Switch, FormControlLabel, MenuItem,
  Alert, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import api from '../api/client'
import { toast } from 'react-toastify'
import { useAuth } from '../features/auth'
import { mediaUrl } from '../utils/media'
import { UI_THEME_OPTIONS } from '../theme/themes'
import { useAppTheme } from '../theme/AppThemeProvider'

const fieldSx = {
  direction: 'rtl',
  textAlign: 'right',
  '& .MuiInputBase-input': {
    textAlign: 'right',
    direction: 'rtl'
  },
  '& .MuiInputLabel-root': {
    left: 'auto',
    right: 24,
    transformOrigin: 'top right'
  },
  '& .MuiInputLabel-shrink': {
    left: 'auto',
    right: 24,
    transformOrigin: 'top right'
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderWidth: 2,
    textAlign: 'right'
  },
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      textAlign: 'right'
    },
    '& legend': {
      textAlign: 'right'
    }
  },
  '& .MuiFormHelperText-root': {
    textAlign: 'right',
    direction: 'rtl',
    marginRight: 0,
    marginLeft: 'auto'
  }
}

function ImageUpload({ label, type, current, onDone }: { label: string; type: string; current?: string; onDone: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const upload = async (file: File) => {
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      await api.post(`/Uploads/${type}`, fd)
      toast.success('تم رفع الصورة')
      onDone()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'فشل الرفع')
    } finally {
      setBusy(false)
    }
  }
  const clear = async () => {
    try {
      await api.delete(`/Uploads/${type}`)
      toast.success('تم الحذف')
      onDone()
    } catch {
      toast.error('فشل الحذف')
    }
  }
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography fontWeight="bold" gutterBottom>{label}</Typography>
      {current && (
        <Box sx={{ mb: 1 }}>
          <img src={mediaUrl(current)} alt="" style={{ maxHeight: 80, maxWidth: '100%', objectFit: 'contain', borderRadius: 4 }} />
        </Box>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        hidden
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) upload(f)
        }}
      />
      <Button size="small" variant="contained" disabled={busy} onClick={() => inputRef.current?.click()} sx={{ mr: 1 }}>
        {busy ? 'جاري الرفع...' : 'اختيار من الجهاز'}
      </Button>
      {current && (
        <Button size="small" color="error" onClick={clear}>إزالة</Button>
      )}
    </Paper>
  )
}

export default function SettingsPage() {
  const { user } = useAuth()
  const { setUiTheme, refreshTheme } = useAppTheme()
  const [s, setS] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [newUser, setNewUser] = useState({ username: '', displayName: '', password: '', role: 'Cashier' })

  const load = () => api.get('/Settings').then(r => setS(r.data)).catch(() => {})
  const loadUsers = () => api.get('/Settings/users').then(r => setUsers(r.data)).catch(() => {})

  useEffect(() => {
    load()
    loadUsers()
  }, [])

  if (user?.role !== 'Owner') return <Alert severity="warning">الإعدادات للمالك فقط</Alert>
  if (!s) return null

  const set = (k: string, v: any) => setS({ ...s, [k]: v })

  const save = async () => {
    try {
      await api.put('/Settings', {
        centerName: s.centerName,
        centerPhone: s.centerPhone,
        closingTime: s.closingTime,
        iconTheme: s.iconTheme,
        uiTheme: s.uiTheme || 'classic',
        graceMinutes: s.graceMinutes,
        price1Hour: s.price1Hour,
        price2Hours: s.price2Hours,
        price3Hours: s.price3Hours,
        price4Hours: s.price4Hours ?? 0,
        priceFullDay: s.priceFullDay,
        extraCompanionPrice: s.extraCompanionPrice,
        flexibleFieldEnabled: s.flexibleFieldEnabled,
        flexibleFieldLabel: s.flexibleFieldLabel,
        flexibleFieldPrice: s.flexibleFieldPrice,
        qrOnReceipt: s.qrOnReceipt,
        siblingPrices: s.siblingPrices || []
      })
      if (s.uiTheme) setUiTheme(s.uiTheme)
      refreshTheme()
      toast.success('تم حفظ الإعدادات')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'فشل')
    }
  }

  const addUser = async () => {
    try {
      await api.post('/Settings/users', newUser)
      toast.success('تم إنشاء المستخدم')
      setNewUser({ username: '', displayName: '', password: '', role: 'Cashier' })
      loadUsers()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'فشل')
    }
  }

  const toggleUser = async (id: number) => {
    try {
      await api.post(`/Settings/users/${id}/toggle`)
      loadUsers()
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'فشل')
    }
  }

  const downloadBackup = async () => {
    try {
      const response = await api.get('/Backups/create', { responseType: 'blob' })
      const url = URL.createObjectURL(response.data)
      const link = document.createElement('a')
      link.href = url
      link.download = `kidsarea-backup-${new Date().toISOString().slice(0, 10)}.zip`
      link.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'فشل إنشاء النسخة الاحتياطية')
    }
  }

  // تجميع تسعير الأخوة حسب العدد
  const siblingGroups = () => {
    const map = new Map<number, any[]>()
    ;(s.siblingPrices || []).forEach((sp: any, idx: number) => {
      const n = sp.siblingsCount || 0
      if (!map.has(n)) map.set(n, [])
      map.get(n)!.push({ ...sp, _idx: idx })
    })
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0])
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>الإعدادات</Typography>

      {/* الهوية */}
      <Accordion defaultExpanded sx={{ mb: 1 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight="bold">الهوية والصور</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="اسم المركز" value={s.centerName}
                onChange={e => set('centerName', e.target.value)} sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="هاتف المركز" value={s.centerPhone || ''}
                onChange={e => set('centerPhone', e.target.value)} sx={fieldSx} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="وقت الإغلاق (HH:mm)" value={s.closingTime}
                onChange={e => set('closingTime', e.target.value)} sx={fieldSx} />
            </Grid>
            <Grid item xs={6} sm={4}>
              <TextField fullWidth select label="سمة الأيقونات" value={s.iconTheme || 'rainbow'}
                onChange={e => set('iconTheme', e.target.value)} sx={fieldSx}>
                <MenuItem value="rainbow">قوس قزح (ألوان صارخة)</MenuItem>
                <MenuItem value="neon">نيون داكن</MenuItem>
                <MenuItem value="kids">أطفال مرح</MenuItem>
                <MenuItem value="ocean">محيط</MenuItem>
                <MenuItem value="contrast">تباين قوي</MenuItem>
                <MenuItem value="pastel">باستيل ناعم</MenuItem>
                <MenuItem value="darkblock">داكن كتل لونية</MenuItem>
                <MenuItem value="metro">مترو مسطح</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth select label="ثيم الواجهة" value={s.uiTheme || 'classic'}
                onChange={e => set('uiTheme', e.target.value)} sx={fieldSx}
                helperText="ألوان وخط التطبيق بالكامل">
                {UI_THEME_OPTIONS.map(o => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={4}>
              <ImageUpload label="الشعار (Logo)" type="logo" current={s.logoPath} onDone={load} />
            </Grid>
            <Grid item xs={12} md={4}>
              <ImageUpload label="خلفية تسجيل الدخول" type="loginBg" current={s.loginBackgroundPath} onDone={load} />
            </Grid>
            <Grid item xs={12} md={4}>
              <ImageUpload label="خلفية الرئيسية" type="homeBg" current={s.homeBackgroundPath} onDone={load} />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* تسعير فردي */}
      <Accordion sx={{ mb: 1 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight="bold">تسعير فردي (ج.م)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={4} md={2}>
              <TextField fullWidth type="number" label="ساعة" value={s.price1Hour}
                onChange={e => set('price1Hour', +e.target.value)} sx={fieldSx} />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <TextField fullWidth type="number" label="ساعتان" value={s.price2Hours}
                onChange={e => set('price2Hours', +e.target.value)} sx={fieldSx} />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <TextField fullWidth type="number" label="3 ساعات" value={s.price3Hours}
                onChange={e => set('price3Hours', +e.target.value)} sx={fieldSx} />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <TextField fullWidth type="number" label="4 ساعات" value={s.price4Hours ?? 0}
                onChange={e => set('price4Hours', +e.target.value)} sx={fieldSx} />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <TextField fullWidth type="number" label="يوم كامل" value={s.priceFullDay}
                onChange={e => set('priceFullDay', +e.target.value)} sx={fieldSx} />
            </Grid>
            <Grid item xs={6} sm={4} md={3}>
              <TextField fullWidth type="number" label="رسوم المرافق الإضافي (من 3)" value={s.extraCompanionPrice}
                onChange={e => set('extraCompanionPrice', +e.target.value)} sx={fieldSx} />
            </Grid>
            <Grid item xs={6} sm={4} md={3}>
              <TextField fullWidth type="number" label="سماحية الساعات الإضافية (دقيقة)" value={s.graceMinutes}
                onChange={e => set('graceMinutes', +e.target.value)} sx={fieldSx} />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* تسعير الأخوة */}
      <Accordion sx={{ mb: 1 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight="bold">تسعير الأخوة</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {siblingGroups().map(([count, rows]) => (
            <Accordion key={count} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography fontWeight="bold">عدد الأخوة: {count}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {rows.map((sp: any) => (
                  <Grid container spacing={1} key={sp._idx} sx={{ mb: 1 }}>
                    <Grid item xs={4}>
                      <TextField fullWidth size="small" select label="الباقة" value={sp.durationPackage}
                        onChange={e => {
                          const arr = [...s.siblingPrices]
                          arr[sp._idx] = { ...arr[sp._idx], durationPackage: +e.target.value }
                          set('siblingPrices', arr)
                        }} sx={fieldSx}>
                        <MenuItem value={1}>ساعة</MenuItem>
                        <MenuItem value={2}>ساعتان</MenuItem>
                        <MenuItem value={3}>3 ساعات</MenuItem>
                        <MenuItem value={5}>4 ساعات</MenuItem>
                        <MenuItem value={4}>يوم كامل</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={4}>
                      <TextField fullWidth size="small" type="number" label="السعر" value={sp.price}
                        onChange={e => {
                          const arr = [...s.siblingPrices]
                          arr[sp._idx] = { ...arr[sp._idx], price: +e.target.value }
                          set('siblingPrices', arr)
                        }} sx={fieldSx} />
                    </Grid>
                    <Grid item xs={4}>
                      <Button color="error" size="small" onClick={() => {
                        const arr = [...s.siblingPrices]
                        arr.splice(sp._idx, 1)
                        set('siblingPrices', arr)
                      }}>حذف</Button>
                    </Grid>
                  </Grid>
                ))}
              </AccordionDetails>
            </Accordion>
          ))}
          <Button size="small" sx={{ mt: 1 }} onClick={() =>
            set('siblingPrices', [...(s.siblingPrices || []), { siblingsCount: 2, durationPackage: 1, price: 0 }])
          }>
            + صف تسعير أخوة
          </Button>
          <Typography variant="caption" display="block" sx={{ mt: 1 }} color="text.secondary">
            أضف صفاً ثم اختر عدد الأخوة من الحقل عند الحاجة عبر تعديل القيمة في الصف الجديد من الكود لاحقاً، أو عدّل العدد من صف موجود.
          </Typography>
          <Grid container spacing={1} sx={{ mt: 1 }}>
            <Grid item xs={4}>
              <TextField fullWidth size="small" type="number" label="عدد أخوة لصف جديد" id="newSibCount"
                defaultValue={2} sx={fieldSx}
                onBlur={e => {
                  const n = +e.target.value || 2
                  set('siblingPrices', [...(s.siblingPrices || []), { siblingsCount: n, durationPackage: 1, price: 0 }])
                }}
              />
            </Grid>
            <Grid item xs={8}>
              <Typography variant="body2" color="text.secondary" sx={{ pt: 1 }}>
                اكتب العدد واخرج من الخانة لإضافة صف بهذا العدد
              </Typography>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* حقل مرن */}
      <Accordion sx={{ mb: 1 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight="bold">الحقل المرن و QR</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormControlLabel
            control={<Switch checked={s.flexibleFieldEnabled} onChange={e => set('flexibleFieldEnabled', e.target.checked)} />}
            label="تفعيل الحقل المرن"
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField fullWidth label="اسم الخانة" value={s.flexibleFieldLabel}
                onChange={e => set('flexibleFieldLabel', e.target.value)} sx={fieldSx} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth type="number" label="السعر" value={s.flexibleFieldPrice}
                onChange={e => set('flexibleFieldPrice', +e.target.value)} sx={fieldSx} />
            </Grid>
          </Grid>
          <FormControlLabel
            control={<Switch checked={s.qrOnReceipt} onChange={e => set('qrOnReceipt', e.target.checked)} />}
            label="QR على الإيصال"
          />
        </AccordionDetails>
      </Accordion>

      <Button variant="contained" size="large" onClick={save} sx={{ mb: 2, mt: 1 }}>
        حفظ كل الإعدادات
      </Button>

      {/* نسخ احتياطي */}
      <Accordion sx={{ mb: 1 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight="bold">النسخ الاحتياطي</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            نسخة تلقائية يومياً. يمكنك تنزيل ZIP يدوياً وحفظه على جهازك أو فلاشة.
          </Typography>
          <Button variant="outlined" onClick={downloadBackup}>تنزيل نسخة احتياطية ZIP</Button>
        </AccordionDetails>
      </Accordion>

      {/* مستخدمون */}
      <Accordion sx={{ mb: 1 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography fontWeight="bold">المستخدمون</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {users.map(u => (
            <Box key={u.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
              <Typography sx={{ minWidth: 220 }}>
                {u.displayName} ({u.username}) — {u.role}
              </Typography>
              <Typography color={u.isActive ? 'green' : 'error'}>
                {u.isActive ? 'نشط' : 'معطّل'}
              </Typography>
              <Button size="small" variant="outlined" onClick={() => toggleUser(u.id)}>
                {u.isActive ? 'تعطيل' : 'تفعيل'}
              </Button>
            </Box>
          ))}
          {users.length === 0 && <Typography color="text.secondary">لا يوجد مستخدمون</Typography>}

          <Typography fontWeight="bold" sx={{ mt: 2, mb: 1 }}>إضافة مستخدم</Typography>
          <Grid container spacing={1}>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth size="small" label="اسم المستخدم" value={newUser.username}
                onChange={e => setNewUser({ ...newUser, username: e.target.value })} sx={fieldSx} />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth size="small" label="الاسم الظاهر" value={newUser.displayName}
                onChange={e => setNewUser({ ...newUser, displayName: e.target.value })} sx={fieldSx} />
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField fullWidth size="small" type="password" label="كلمة المرور" value={newUser.password}
                onChange={e => setNewUser({ ...newUser, password: e.target.value })} sx={fieldSx} />
            </Grid>
            <Grid item xs={6} sm={2}>
              <TextField fullWidth size="small" select label="الدور" value={newUser.role}
                onChange={e => setNewUser({ ...newUser, role: e.target.value })} sx={fieldSx}>
                <MenuItem value="Cashier">كاشير</MenuItem>
                <MenuItem value="Owner">مالك</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button fullWidth variant="contained" onClick={addUser}>إضافة</Button>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Box>
  )
}