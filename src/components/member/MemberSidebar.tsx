'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/providers/AuthProvider'
import { Logo } from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import {
  LayoutDashboard, Users, Heart, Calendar, CreditCard, LogOut, Settings2, User,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/mon-espace', label: 'Mon espace', icon: LayoutDashboard, exact: true },
  { href: '/mon-espace/membres', label: 'Membres', icon: Users },
  { href: '/mon-espace/collectes', label: 'Collectes', icon: Heart },
  { href: '/mon-espace/evenements', label: 'Événements', icon: Calendar },
  { href: '/mon-espace/ma-cotisation', label: 'Ma cotisation', icon: CreditCard },
  { href: '/mon-espace/parametres', label: 'Paramètres', icon: User },
]

export function MemberSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const isElevated = user?.roles.some(r =>
    ['super_admin', 'president', 'treasurer', 'secretary'].includes(r),
  )

  return (
    <aside className="flex flex-col w-56 h-full bg-sidebar border-r border-sidebar-border shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <Logo variant="icon" size="sm" href="/mon-espace" className="shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-sidebar-foreground truncate">Météo Assistance</p>
          <p className="text-xs text-sidebar-foreground/55 truncate">Espace membre</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-2.5 px-2 py-2 rounded-md text-sm transition-colors',
                active
                  ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                  : 'text-sidebar-foreground/65 hover:text-sidebar-foreground hover:bg-sidebar-foreground/8',
              )}
            >
              <Icon size={15} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Admin switch for elevated roles */}
      {isElevated && (
        <div className="px-3 pb-2">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="flex items-center gap-2.5 px-2 py-2 rounded-md text-xs text-sidebar-foreground/65 hover:text-sidebar-primary hover:bg-sidebar-accent transition-colors"
          >
            <Settings2 size={13} />
            Espace administration
          </Link>
        </div>
      )}

      {/* User footer */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="w-7 h-7 rounded-full bg-sidebar-primary/20 flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-sidebar-foreground">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-sidebar-foreground truncate">
              {user?.first_name} {user?.last_name}
            </p>
          </div>
          <ThemeToggle className="text-sidebar-foreground/40 hover:text-sidebar-foreground transition-colors" />
          <button
            onClick={logout}
            className="text-sidebar-foreground/40 hover:text-error transition-colors"
            title="Déconnexion"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
