'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/providers/AuthProvider'
import {
  LayoutDashboard, Users, CreditCard, Calendar,
  Bell, Download, Shield, Settings, LogOut, Heart, History,
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
    <aside className="flex flex-col w-56 h-full bg-[#1F2139] border-r border-[rgba(99,102,241,0.20)] shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[rgba(255,255,255,0.10)]">
        <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#6366F1] to-[#4F46E5] flex items-center justify-center shrink-0 shadow-lg">
          <span className="text-sm font-bold text-white">M</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">Mboka</p>
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
                          ? 'bg-[#312E81] text-[#E0E7FF] font-medium border-l-2 border-[#818CF8]'
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
          <div className="w-7 h-7 rounded-full bg-[#312E81] flex items-center justify-center shrink-0">
            <span className="text-xs font-semibold text-white">
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
