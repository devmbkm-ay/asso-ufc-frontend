'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/providers/AuthProvider'
import { Sidebar } from '@/components/admin/Sidebar'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Menu } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) { router.push('/login'); return }
    const isElevated = user.roles.some(r =>
      ['super_admin', 'president', 'treasurer', 'secretary'].includes(r),
    )
    if (!isElevated) router.push('/mon-espace')
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex h-screen overflow-hidden brand-bg">
      {/* Desktop sidebar */}
      <div className="hidden md:flex h-full">
        <Sidebar />
      </div>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 h-14 px-4 bg-sidebar border-b border-[rgba(255,255,255,0.10)]">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu"
          className="p-1.5 rounded-md text-[rgba(255,255,255,0.70)] hover:text-white hover:bg-[rgba(255,255,255,0.10)] transition-colors"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <Logo size={28} className="shrink-0" />
          <span className="text-sm font-display font-semibold text-sidebar-foreground">Fondation Météo Assistance</span>
        </div>
      </div>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="p-0 border-0"
          style={{ width: '224px' }}
        >
          <Sidebar onClose={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <main className="flex-1 overflow-y-auto pt-14 md:pt-0 bg-[#F8FAFF]">
        {children}
      </main>
    </div>
  )
}
