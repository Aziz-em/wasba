import { useEffect, useState } from 'react'
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Button, Chip } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { localTime } from '../utils/time'

export default function ActivePage() {
  const [list, setList] = useState<any[]>([])
  const nav = useNavigate()
  const load = () => api.get('/Visits/active').then(r => setList(r.data)).catch(() => {})
  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t) }, [])
  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>الأطفال النشيطون الآن ({list.reduce((sum, visit) => sum + (visit.childrenCount || 1), 0)})</Typography>
      <Table size="small" component={Paper}>
        <TableHead>
          <TableRow>
            <TableCell>الإيصال</TableCell><TableCell>الأطفال</TableCell><TableCell>رقم الهاتف</TableCell>
            <TableCell>الباقة</TableCell><TableCell>الدخول</TableCell><TableCell>الخروج المتوقع</TableCell><TableCell>المرافقون</TableCell><TableCell></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {list.map(v => (
            <TableRow key={v.id}>
              <TableCell>{v.receiptNumber}</TableCell>
              <TableCell>{(v.childrenNames || [v.childName]).map((name: string, index: number) => {
                const age = (v.childrenAges || [v.childAge])[index]
                return <div key={index}>{name} ({age > 0 ? age : '—'} سنة)</div>
              })}</TableCell>
              <TableCell>{v.phone}</TableCell>
              <TableCell>{v.packageName}</TableCell>
              <TableCell>{localTime(v.checkInTime)}</TableCell>
              <TableCell>{v.expectedCheckOutTime ? localTime(v.expectedCheckOutTime) : '—'}</TableCell>
              <TableCell>{v.companionsCount}</TableCell>
              <TableCell>
                <Button size="small" onClick={() => nav(`/checkout?r=${encodeURIComponent(v.receiptNumber)}`)}>خروج</Button>
              </TableCell>
            </TableRow>
          ))}
          {list.length === 0 && <TableRow><TableCell colSpan={8} align="center">لا يوجد أطفال الآن</TableCell></TableRow>}
        </TableBody>
      </Table>
    </Box>
  )
}
