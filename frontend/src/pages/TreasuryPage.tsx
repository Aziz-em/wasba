import { useEffect, useState } from 'react'
import { Box, Typography, Paper, Grid, Card, CardContent } from '@mui/material'
import api from '../api/client'

export default function TreasuryPage() {
  const [t, setT] = useState<any>(null)
  useEffect(() => { api.get('/Shifts/treasury').then(r => setT(r.data)).catch(() => {}) }, [])
  if (!t) return <Typography>لا توجد وردية مفتوحة أو جاري التحميل...</Typography>
  const items = [
    ['إجمالي الإيراد', t.totalRevenue],
    ['نقدي', t.cashTotal],
    ['InstaPay', t.instaPayTotal],
    ['زيارات', t.visitsTotal],
    ['عضويات', t.membershipsTotal],
    ['حفلات', t.partiesTotal],
    ['تجاوزات', t.overageTotal],
    ['مرافقين', t.companionsTotal],
    ['افتتاحي الدرج', t.openingBalance],
    ['النقد المتوقع بالدرج', t.expectedCash],
  ]
  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>الخزنة — اليوم الحالي</Typography>
      <Grid container spacing={2}>
        {items.map(([l, v]) => (
          <Grid item xs={6} sm={4} key={l as string}>
            <Card><CardContent>
              <Typography variant="caption" color="text.secondary">{l as string}</Typography>
              <Typography variant="h6">{v} ج.م</Typography>
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
