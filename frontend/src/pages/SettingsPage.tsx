import { useEffect, useState, useRef } from 'react'
import { Box, Typography, Paper, Grid, TextField, Button, Switch, FormControlLabel, MenuItem, Divider, Alert } from '@mui/material'
import api from '../api/client'
import { toast } from 'react-toastify'
import { useAuth } from '../features/auth'
import { mediaUrl } from '../utils/media'

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
        graceMinutes: s.graceMinutes,
        price1Hour: s.price1Hour,
        price2Hours: s.price2Hours,
        price3Hours: s.price3Hours,
        priceFullDay: s.priceFullDay,
        extraCompanionPrice: s.extraCompanionPrice,
        flexibleFieldEnabled: s.flexibleFieldEnabled,
        flexibleFieldLabel: s.flexibleFieldLabel,
        flexibleFieldPrice: s.flexibleFieldPrice,
        qrOnReceipt: s.qrOnReceipt,
        siblingPrices: s.siblingPrices || []
      })
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
    } catch (e: any) { toast.error(e.response?.data?.message || 'فشل إنشاء النسخة الاحتياطية') }
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>الإعدادات</Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography fontWeight="bold" gutterBottom>الهوية والصور</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="اسم المركز" value={s.centerName} onChange={e => set('centerName', e.target.value)} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="هاتف المركز" value={s.centerPhone || ''} onChange={e => set('centerPhone', e.target.value)} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth label="وقت الإغلاق (HH:mm)" value={s.closingTime} onChange={e => set('closingTime', e.target.value)} />
          </Grid>
          <Grid item xs={6}>
            <TextField fullWidth select label="سمة الأيقونات" value={s.iconTheme} onChange={e => set('iconTheme', e.target.value)}>
              <MenuItem value="classic">كلاسيك</MenuItem>
              <MenuItem value="colorful">ملون</MenuItem>
              <MenuItem value="simple">بسيط</MenuItem>
              <MenuItem value="ocean">محيط هادئ</MenuItem>
              <MenuItem value="sunset">غروب دافئ</MenuItem>
              <MenuItem value="garden">حديقة مرحة</MenuItem>
              <MenuItem value="candy">ألوان حلوة</MenuItem>
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
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography fontWeight="bold">تسعير فردي (ج.م)</Typography>
        <Grid container spacing={2} mt={0}>
          <Grid item xs={6} sm={3}><TextField fullWidth type="number" label="ساعة" value={s.price1Hour} onChange={e => set('price1Hour', +e.target.value)} /></Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth type="number" label="ساعتان" value={s.price2Hours} onChange={e => set('price2Hours', +e.target.value)} /></Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth type="number" label="3 ساعات" value={s.price3Hours} onChange={e => set('price3Hours', +e.target.value)} /></Grid>
          <Grid item xs={6} sm={3}><TextField fullWidth type="number" label="يوم كامل" value={s.priceFullDay} onChange={e => set('priceFullDay', +e.target.value)} /></Grid>
          <Grid item xs={6}><TextField fullWidth type="number" label="رسوم المرافق الإضافي (من 3)" value={s.extraCompanionPrice} onChange={e => set('extraCompanionPrice', +e.target.value)} /></Grid>
          <Grid item xs={6}><TextField fullWidth type="number" label="سماحية التجاوز (دقيقة)" value={s.graceMinutes} onChange={e => set('graceMinutes', +e.target.value)} /></Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography fontWeight="bold">الحقل المرن</Typography>
        <FormControlLabel control={<Switch checked={s.flexibleFieldEnabled} onChange={e => set('flexibleFieldEnabled', e.target.checked)} />} label="تفعيل" />
        <Grid container spacing={2}>
          <Grid item xs={6}><TextField fullWidth label="اسم الخانة" value={s.flexibleFieldLabel} onChange={e => set('flexibleFieldLabel', e.target.value)} /></Grid>
          <Grid item xs={6}><TextField fullWidth type="number" label="السعر" value={s.flexibleFieldPrice} onChange={e => set('flexibleFieldPrice', +e.target.value)} /></Grid>
        </Grid>
        <FormControlLabel control={<Switch checked={s.qrOnReceipt} onChange={e => set('qrOnReceipt', e.target.checked)} />} label="QR على الإيصال" />
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography fontWeight="bold" gutterBottom>تسعير الأخوة (عدد × باقة)</Typography>
        {(s.siblingPrices || []).map((sp: any, idx: number) => (
          <Grid container spacing={1} key={idx} sx={{ mb: 1 }}>
            <Grid item xs={3}>
              <TextField fullWidth size="small" type="number" label="عدد" value={sp.siblingsCount} onChange={e => {
                const arr = [...s.siblingPrices]
                arr[idx] = { ...sp, siblingsCount: +e.target.value }
                set('siblingPrices', arr)
              }} />
            </Grid>
            <Grid item xs={3}>
              <TextField fullWidth size="small" select label="الباقة" value={sp.durationPackage} onChange={e => {
                const arr = [...s.siblingPrices]
                arr[idx] = { ...sp, durationPackage: +e.target.value }
                set('siblingPrices', arr)
              }}>
                <MenuItem value={1}>ساعة</MenuItem>
                <MenuItem value={2}>ساعتان</MenuItem>
                <MenuItem value={3}>3 ساعات</MenuItem>
                <MenuItem value={4}>يوم كامل</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={3}>
              <TextField fullWidth size="small" type="number" label="السعر" value={sp.price} onChange={e => {
                const arr = [...s.siblingPrices]
                arr[idx] = { ...sp, price: +e.target.value }
                set('siblingPrices', arr)
              }} />
            </Grid>
          </Grid>
        ))}
        <Button size="small" onClick={() => set('siblingPrices', [...(s.siblingPrices || []), { siblingsCount: 2, durationPackage: 1, price: 0 }])}>
          + صف أخوة
        </Button>
      </Paper>

      <Button variant="contained" size="large" onClick={save} sx={{ mb: 3 }}>حفظ كل الإعدادات</Button>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography fontWeight="bold" gutterBottom>النسخ الاحتياطي</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          يتم إنشاء نسخة تلقائية يوميًا. يمكنك أيضًا تنزيل نسخة مضغوطة يدويًا وحفظها على جهازك.
        </Typography>
        <Button variant="outlined" onClick={downloadBackup}>تنزيل نسخة احتياطية ZIP</Button>
      </Paper>

      <Divider sx={{ mb: 2 }} />

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography fontWeight="bold" gutterBottom>المستخدمون الحاليون</Typography>
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
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography fontWeight="bold" gutterBottom>إضافة مستخدم</Typography>
        <Grid container spacing={1}>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth size="small" label="اسم المستخدم" value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <TextField fullWidth size="small" label="الاسم الظاهر" value={newUser.displayName} onChange={e => setNewUser({ ...newUser, displayName: e.target.value })} />
          </Grid>
          <Grid item xs={6} sm={2}>
            <TextField fullWidth size="small" type="password" label="كلمة المرور" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
          </Grid>
          <Grid item xs={6} sm={2}>
            <TextField fullWidth size="small" select label="الدور" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
              <MenuItem value="Cashier">كاشير</MenuItem>
              <MenuItem value="Owner">مالك</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button fullWidth variant="outlined" onClick={addUser}>إضافة</Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  )
}