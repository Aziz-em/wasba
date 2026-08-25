import { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material'
import api from '../api/client'
import { toast } from 'react-toastify'
import { useAuth } from '../features/auth'
import { localDateTime } from '../utils/time'

export default function PartyPage() {
  const [settings, setSettings] = useState<any>(null)
  const { user } = useAuth()

  const [f, setF] = useState({
    customerName: '',
    phone: '',
    partyDate: '',
    childrenCount: 10,
    amount: 0,
    paidCash: 0,
    paidInstaPay: 0,
    notes: ''
  })

  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
  api.get('/Parties/today')
    .then(r => setHistory(r.data))
    .catch(() => {})

  api.get('/Settings')
    .then(r => setSettings(r.data))
    .catch(() => {})
}, [])

  useEffect(() => {
    setF(prev => ({
      ...prev,
      paidCash: prev.amount,
      paidInstaPay: 0
    }))
  }, [f.amount])

  const printReceipt = (party: any) => {
    const w = window.open('', '_blank', 'width=360,height=600')
    if (!w) return

    w.document.write(`
<html dir="rtl">
<head>
<title>إيصال حفلة</title>

<style>
body{
  font-family:Tahoma,Arial;
  width:300px;
  margin:8px auto;
  font-size:12px;
}

h3,h4{
  text-align:center;
  margin:6px 0;
}

.line{
  border-top:1px dashed #333;
  margin:10px 0;
}

table{
  width:100%;
  border-collapse:collapse;
  margin:8px 0;
}

th,td{
  border:1px solid #333;
  padding:5px;
}

th{
  background:#f0f0f0;
}

.total{
  margin-top:10px;
  font-size:14px;
  font-weight:bold;
}

.thanks{
  margin-top:15px;
  text-align:center;
  font-weight:bold;
}
</style>

</head>

<body>

<h3>${settings?.centerName || 'Kids Area'}</h3>

<div style="text-align:center">
  ${settings?.centerPhone || ''}
</div>

<div class="line"></div>

<h4>إيصال حفلة</h4>

<div>
  اسم العميل:
  <b>${party.customerName}</b>
</div>

<div>
  رقم الهاتف:
  ${party.phone}
</div>

<div>
  تاريخ التسجيل:
  ${party.saleTime ? localDateTime(party.saleTime) : '—'}
</div>

<table>

<thead>
<tr>
  <th>عدد الأطفال</th>
  <th>موعد الحفلة</th>
  <th>التكلفة</th>
</tr>
</thead>

<tbody>
<tr>
  <td>${party.childrenCount}</td>
  <td>${party.partyDate ? localDateTime(party.partyDate) : '—'}</td>
  <td>${party.amount} ج.م</td>
</tr>
</tbody>

</table>

<div class="total">
  الإجمالي: ${party.amount} ج.م
</div>

<div style="font-weight:bold;margin-top:5px">
  طريقة الدفع:
  ${party.paidInstaPay > 0 ? 'InstaPay' : 'نقدي'}
</div>

<div class="thanks">
  شكراً لزيارتكم
</div>

<script>
setTimeout(function(){
  window.print();
},300);
<\/script>

</body>
</html>
`)

    w.document.close()
  }

  const deleteParty = async (id: number) => {
    if (!window.confirm('هل تريد حذف سجل هذه الحفلة؟')) return

    try {
      await api.delete(`/Parties/${id}`)

      setHistory(current =>
        current.filter(p => p.id !== id)
      )

      toast.success('تم حذف سجل الحفلة')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'فشل حذف سجل الحفلة')
    }
  }

  const save = async () => {
    try {
      const { data } = await api.post('/Parties', {
        ...f,
        paidOther: 0
      })

      const party = {
        ...f,
        ...data,
        id: data.id ?? data.Id,
        saleTime: data.saleTime || new Date().toISOString()
      }

      setHistory(current => [party, ...current])

      printReceipt(party)

      toast.success('تم تسجيل وارد حفلة')

      setF({
        customerName: '',
        phone: '',
        partyDate: '',
        childrenCount: 10,
        amount: 0,
        paidCash: 0,
        paidInstaPay: 0,
        notes: ''
      })
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'فشل')
    }
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        تسجيل حفلة
      </Typography>

      <Paper sx={{ p: 2, maxWidth: 520 }}>
        <Grid container spacing={2}>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="اسم العميل"
              value={f.customerName}
              onChange={e =>
                setF({ ...f, customerName: e.target.value })
              }
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="رقم الهاتف"
              value={f.phone}
              onChange={e =>
                setF({ ...f, phone: e.target.value })
              }
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              type="datetime-local"
              label="موعد الحفلة"
              InputLabelProps={{ shrink: true }}
              value={f.partyDate}
              onChange={e =>
                setF({ ...f, partyDate: e.target.value })
              }
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="عدد الأطفال"
              value={f.childrenCount}
              onChange={e =>
                setF({
                  ...f,
                  childrenCount: +e.target.value
                })
              }
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="المبلغ"
              value={f.amount}
              onChange={e =>
                setF({
                  ...f,
                  amount: +e.target.value
                })
              }
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="نقدي"
              value={f.paidCash}
              onChange={e =>
                setF({
                  ...f,
                  paidCash: +e.target.value
                })
              }
            />
          </Grid>

          <Grid item xs={6}>
            <TextField
              fullWidth
              type="number"
              label="InstaPay"
              value={f.paidInstaPay}
              onChange={e =>
                setF({
                  ...f,
                  paidInstaPay: +e.target.value
                })
              }
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="ملاحظة"
              value={f.notes}
              onChange={e =>
                setF({
                  ...f,
                  notes: e.target.value
                })
              }
            />
          </Grid>

          <Grid item xs={12}>
            <Button
              fullWidth
              variant="contained"
              onClick={save}
            >
              حفظ
            </Button>
          </Grid>

        </Grid>
      </Paper>

      <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
        سجل الحفلات
      </Typography>

      <Table size="small" component={Paper}>
        <TableHead>
          <TableRow>
            <TableCell>العميل</TableCell>
            <TableCell>رقم الهاتف</TableCell>
            <TableCell>عدد الأطفال</TableCell>
            <TableCell>المبلغ</TableCell>
            <TableCell>تاريخ التسجيل</TableCell>
            <TableCell>موعد الحفلة</TableCell>
            <TableCell>ملاحظات</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>

        <TableBody>
          {history.map(p => (
            <TableRow key={p.id}>
              <TableCell>{p.customerName}</TableCell>
<TableCell>{p.phone}</TableCell>
<TableCell>{p.childrenCount}</TableCell>
<TableCell>{p.amount}</TableCell>
<TableCell>{p.saleTime ? localDateTime(p.saleTime) : ''}</TableCell>
<TableCell>{p.partyDate ? localDateTime(p.partyDate) : '—'}</TableCell>
<TableCell>{p.notes || '—'}</TableCell>
              <TableCell>
                <Button
                  size="small"
                  onClick={() => printReceipt(p)}
                >
                  عرض / طباعة
                </Button>

                {user?.role === 'Owner' && (
                  <Button
                    color="error"
                    size="small"
                    onClick={() => deleteParty(p.id)}
                  >
                    حذف
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  )
}