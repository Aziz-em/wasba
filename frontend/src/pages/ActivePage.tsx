import { useEffect, useState } from 'react'
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Button, Chip } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

export default function ActivePage() {
  const [list, setList] = useState<any[]>([])
  const nav = useNavigate()
  const load = () => api.get('/Visits/active').then(r => setList(r.data)).catch(() => {})
  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t) }, [])
  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>الأطفال الحاليون ({list.length})</Typography>
      <Table size="small" component={Paper}>
        <TableHead>
          <TableRow>
            <TableCell>الإيصال</TableCell><TableCell>الطفل</TableCell><TableCell>الجوال</TableCell>
            <TableCell>الباقة</TableCell><TableCell>الدخول</TableCell><TableCell>المدة (د)</TableCell><TableCell></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {list.map(v => (
            <TableRow key={v.id}>
              <TableCell>{v.receiptNumber}</TableCell>
              <TableCell>{v.childName}</TableCell>
              <TableCell>{v.phone}</TableCell>
              <TableCell>{v.packageName}</TableCell>
              <TableCell>{new Date(v.checkInTime).toLocaleTimeString('ar-EG')}</TableCell>
              <TableCell>{Math.floor(v.elapsedMinutes)}</TableCell>
              <TableCell>
                <Button size="small" onClick={() => nav(`/checkout?r=${encodeURIComponent(v.receiptNumber)}`)}>خروج</Button>
              </TableCell>
            </TableRow>
          ))}
          {list.length === 0 && <TableRow><TableCell colSpan={7} align="center">لا يوجد أطفال الآن</TableCell></TableRow>}
        </TableBody>
      </Table>
    </Box>
  )
}
