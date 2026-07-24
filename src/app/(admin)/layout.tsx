'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/providers/AuthProvider'
import { Sidebar } from '@/components/admin/Sidebar'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { PageTransition } from '@/components/PageTransition'
import { Menu } from 'lucide-react'

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
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 h-14 px-4 bg-sidebar border-b border-sidebar-border">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu"
          className="p-1.5 rounded-md text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-foreground/10 transition-colors"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-linear-to-br from-primary to-primary/80 flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-xs font-bold text-sidebar-foreground">M</span>
          </div>
          <span className="text-sm font-semibold text-sidebar-foreground">Fondation Météo Assistance</span>
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

      <main className="flex-1 overflow-y-auto pt-14 md:pt-0 bg-background">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  )
}
