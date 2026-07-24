'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/providers/AuthProvider'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) { router.push('/login'); return }
    const isElevated = user.roles.some(r =>
      ['super_admin', 'president', 'treasurer', 'secretary'].includes(r),
    )
    router.push(isElevated ? '/dashboard' : '/mon-espace')
  }, [user, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
