import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './features/auth'
import LoginPage from './pages/LoginPage'
import OpenShiftPage from './pages/OpenShiftPage'
import Layout from './layouts/Layout'
import HomePage from './pages/HomePage'
import CheckInPage from './pages/CheckInPage'
import ActivePage from './pages/ActivePage'
import CheckOutPage from './pages/CheckOutPage'
import CustomersPage from './pages/CustomersPage'
import PartyPage from './pages/PartyPage'
import TreasuryPage from './pages/TreasuryPage'
import CloseShiftPage from './pages/CloseShiftPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'

function Private({ children }: { children: JSX.Element }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/open-shift" element={<Private><OpenShiftPage /></Private>} />
      <Route path="/" element={<Private><Layout /></Private>}>
        <Route index element={<HomePage />} />
        <Route path="checkin" element={<CheckInPage />} />
        <Route path="active" element={<ActivePage />} />
        <Route path="checkout" element={<CheckOutPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="party" element={<PartyPage />} />
        <Route path="treasury" element={<TreasuryPage />} />
        <Route path="close-shift" element={<CloseShiftPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
