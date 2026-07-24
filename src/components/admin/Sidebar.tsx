'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/providers/AuthProvider'
import {
  LayoutDashboard, Users, CreditCard, Calendar,
  Bell, Download, Shield, Settings, LogOut, Heart, History,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/brand/Logo'

const NAV = [
  {
    section: 'PRINCIPAL',
    items: [
      { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
      { href: '/membres', label: 'Membres', icon: Users },
      { href: '/cotisations', label: 'Cotisations', icon: CreditCard },
      { href: '/evenements', label: 'Événements', icon: Calendar },
      { href: '/collectes', label: 'Collectes', icon: Heart },
    ],
  },
  {
    section: 'GESTION',
    items: [
      { href: '/historique', label: 'Historique', icon: History },
      { href: '/notifications', label: 'Notifications', icon: Bell },
      { href: '/exports', label: 'Exports', icon: Download },
    ],
  },
  {
    section: 'SYSTÈME',
    items: [
      { href: '/roles', label: 'Rôles & accès', icon: Shield },
      { href: '/parametres', label: 'Paramètres', icon: Settings },
    ],
  },
]

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <aside className="flex flex-col w-56 h-full bg-sidebar border-r border-sidebar-border shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[rgba(255,255,255,0.10)]">
        <Logo size={32} className="shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-display font-semibold text-sidebar-foreground truncate">Fondation Météo Assistance</p>
          <p className="text-xs text-[rgba(255,255,255,0.55)] truncate">{user?.roles?.[0] ?? 'Membre'}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-5 px-3">
        {NAV.map(({ section, items }) => (
          <div key={section}>
            <p className="text-[10px] font-semibold tracking-widest text-[rgba(255,255,255,0.35)] px-2 mb-1">
              {section}
            </p>
            <ul className="space-y-0.5">
              {items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/')
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-2.5 px-2 py-2 rounded-md text-sm transition-colors',
                        active
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-2 border-sidebar-ring'
                          : 'text-[rgba(255,255,255,0.70)] hover:text-white hover:bg-[rgba(255,255,255,0.08)] border-l-2 border-transparent',
                      )}
                    >
                      <Icon size={15} />
                      {label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-[rgba(255,255,255,0.10)] p-3">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="w-7 h-7 rounded-full bg-sidebar-accent flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-sidebar-accent-foreground">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">
              {user?.first_name} {user?.last_name}
            </p>
          </div>
          <button
            onClick={logout}
            aria-label="Déconnexion"
            className="text-[rgba(255,255,255,0.40)] hover:text-red-300 transition-colors"
            title="Déconnexion"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
