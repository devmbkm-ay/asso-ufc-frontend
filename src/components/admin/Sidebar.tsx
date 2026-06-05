'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/providers/AuthProvider'
import {
  LayoutDashboard, Users, CreditCard, Calendar,
  Bell, Download, Shield, Settings, LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  {
    section: 'PRINCIPAL',
    items: [
      { href: '/dashboard',    label: 'Tableau de bord', icon: LayoutDashboard },
      { href: '/membres',      label: 'Membres',         icon: Users },
      { href: '/cotisations',  label: 'Cotisations',     icon: CreditCard },
      { href: '/evenements',   label: 'Événements',      icon: Calendar },
    ],
  },
  {
    section: 'GESTION',
    items: [
      { href: '/notifications', label: 'Notifications', icon: Bell },
      { href: '/exports',       label: 'Exports',       icon: Download },
    ],
  },
  {
    section: 'SYSTÈME',
    items: [
      { href: '/roles',      label: 'Rôles & accès', icon: Shield },
      { href: '/parametres', label: 'Paramètres',    icon: Settings },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <aside className="flex flex-col w-56 h-screen bg-[#181818] border-r border-[rgba(255,255,255,0.06)] shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[rgba(255,255,255,0.06)]">
        <div className="w-8 h-8 rounded-full bg-[#C8A96E] flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-[#141414]">M</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">Mboka</p>
          <p className="text-xs text-[#888] truncate">{user?.roles?.[0] ?? 'Membre'}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-5 px-3">
        {NAV.map(({ section, items }) => (
          <div key={section}>
            <p className="text-[10px] font-semibold tracking-widest text-[#555] px-2 mb-1">
              {section}
            </p>
            <ul className="space-y-0.5">
              {items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/')
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={cn(
                        'flex items-center gap-2.5 px-2 py-2 rounded-md text-sm transition-colors',
                        active
                          ? 'bg-[#C8A96E]/15 text-[#C8A96E] font-medium'
                          : 'text-[#888] hover:text-[#c8c4bc] hover:bg-[#252525]',
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
      <div className="border-t border-[rgba(255,255,255,0.06)] p-3">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="w-7 h-7 rounded-full bg-[#2D5016] flex items-center justify-center shrink-0">
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
            className="text-[#555] hover:text-red-400 transition-colors"
            title="Déconnexion"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
