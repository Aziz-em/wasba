import React, { createContext, useContext, useMemo, useState } from 'react'
import api from '../api/client'

type User = {
  displayName: string
  role: string
  userId: number
  token: string
}

type Ctx = {
  user: User | null
  login: (u: string, p: string) => Promise<void>
  logout: () => void
}

const AuthCtx = createContext<Ctx>(null!)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = sessionStorage.getItem('ka_user')
    return raw ? JSON.parse(raw) : null
  })

  const login = async (username: string, password: string) => {
    const { data } = await api.post('/Auth/login', { username, password })

    const u = {
      displayName: data.displayName,
      role: data.role,
      userId: data.userId,
      token: data.token
    }

    sessionStorage.setItem('ka_token', data.token)
    sessionStorage.setItem('ka_user', JSON.stringify(u))
    setUser(u)
  }

  const logout = () => {
    sessionStorage.removeItem('ka_token')
    sessionStorage.removeItem('ka_user')
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      login,
      logout
    }),
    [user]
  )

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  return useContext(AuthCtx)
}