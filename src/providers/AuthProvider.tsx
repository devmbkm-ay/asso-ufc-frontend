'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { auth, ApiError } from '@/lib/api'
import type { Member } from '@/lib/types'

interface AuthCtx {
  user: Member | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const Context = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) { setLoading(false); return }
    auth.me()
      .then(setUser)
      .catch((err: unknown) => {
        // Only clear token on confirmed 401; keep it on network/server errors
        if (err instanceof ApiError && err.status === 401) {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        }
      })
      .finally(() => setLoading(false))
  }, [])

  // Listen for 401s triggered by any API call (without hard reload)
  useEffect(() => {
    function handleLogout() {
      setUser(null)
      setLoading(false)
    }
    window.addEventListener('auth:logout', handleLogout)
    return () => window.removeEventListener('auth:logout', handleLogout)
  }, [])

  async function login(email: string, password: string) {
    const tokens = await auth.login(email, password)
    localStorage.setItem('access_token',  tokens.access_token)
    localStorage.setItem('refresh_token', tokens.refresh_token)
    const me = await auth.me()
    setUser(me)
  }

  function logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }

  return (
    <Context.Provider value={{ user, loading, login, logout }}>
      {children}
    </Context.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
