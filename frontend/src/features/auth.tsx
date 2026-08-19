import React, { createContext, useContext, useMemo, useState } from 'react'
import api from '../api/client'

type User = { displayName: string; role: string; userId: number; token: string }
type Ctx = { user: User | null; login: (u: string, p: string) => Promise<void>; logout: () => void }
const AuthCtx = createContext<Ctx>(null!)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('ka_user')
    return raw ? JSON.parse(raw) : null
  })
  const login = async (username: string, password: string) => {
    const { data } = await api.post('/Auth/login', { username, password })
    const u = { displayName: data.displayName, role: data.role, userId: data.userId, token: data.token }
    localStorage.setItem('ka_token', data.token)
    localStorage.setItem('ka_user', JSON.stringify(u))
    setUser(u)
  }
  const logout = () => { localStorage.removeItem('ka_token'); localStorage.removeItem('ka_user'); setUser(null) }
  const v = useMemo(() => ({ user, login, logout }), [user])
  return <AuthCtx.Provider value={v}>{children}</AuthCtx.Provider>
}
export const useAuth = () => useContext(AuthCtx)
