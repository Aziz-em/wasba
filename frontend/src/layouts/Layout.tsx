import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItemButton, ListItemText, Box, Button } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import { useAuth } from '../features/auth'
import api from '../api/client'
import { mediaUrl } from '../utils/media'

const links = [
  { t: 'الرئيسية', p: '/' },
  { t: 'دخول طفل', p: '/checkin' },
  { t: 'الحاليون', p: '/active' },
  { t: 'خروج', p: '/checkout' },
  { t: 'العملاء', p: '/customers' },
  { t: 'العضويات', p: '/memberships' },
  { t: 'حفلة', p: '/party' },
  { t: 'الخزنة', p: '/treasury' },
  { t: 'إقفال الوردية', p: '/close-shift' },
  { t: 'التقارير', p: '/reports' },
  { t: 'الإعدادات', p: '/settings', owner: true },
]

export default function Layout() {
  const [open, setOpen] = useState(false)
  const [brand, setBrand] = useState<any>(null)
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()

  useEffect(() => {
    api.get('/Shifts/current').then(r => {
      if (!r.data.open && loc.pathname !== '/open-shift') nav('/open-shift')
    }).catch(() => {})
    api.get('/Settings').then(r => setBrand(r.data)).catch(() => {})
  }, [loc.pathname])

  const logo = mediaUrl(brand?.logoPath)
  const homeBg = mediaUrl(brand?.homeBackgroundPath)

  return (
    <Box sx={{
      minHeight: '100vh', bgcolor: '#f5f7fa',
      backgroundImage: loc.pathname === '/' && homeBg ? `url(${homeBg})` : undefined,
      backgroundSize: 'cover', backgroundPosition: 'center'
    }}>
      <AppBar position="sticky">
        <Toolbar>
          <IconButton color="inherit" onClick={() => setOpen(true)}><MenuIcon /></IconButton>
          {logo && <img src={logo} alt="" style={{ height: 36, marginLeft: 8, marginRight: 8, borderRadius: 4 }} />}
          <Typography variant="h6" sx={{ flexGrow: 1 }}>{brand?.centerName || 'Kids Area'}</Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>{user?.displayName}</Typography>
          <Button color="inherit" onClick={() => { logout(); nav('/login') }}>خروج</Button>
        </Toolbar>
      </AppBar>
      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: 260, pt: 2 }}>
          <List>
            {links.filter(l => !l.owner || user?.role === 'Owner').map(l => (
              <ListItemButton key={l.p} selected={loc.pathname === l.p} onClick={() => { nav(l.p); setOpen(false) }}>
                <ListItemText primary={l.t} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box sx={{ p: 2, maxWidth: 1100, mx: 'auto' }}><Outlet /></Box>
    </Box>
  )
}
