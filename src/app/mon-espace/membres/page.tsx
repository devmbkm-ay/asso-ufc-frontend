'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { members as membersApi } from '@/lib/api'
import { useAuth } from '@/providers/AuthProvider'
import { Search, Crown, BookOpen, Wallet, User } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, avatarColor } from '@/lib/utils'

const ROLE_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  super_admin: { label: 'Admin', icon: Crown, color: 'text-[#6366F1]', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  treasurer: { label: 'Trésorier', icon: Wallet, color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  secretary: { label: 'Secrétaire', icon: BookOpen, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  member: { label: 'Membre', icon: User, color: 'text-gray-500', bg: 'bg-gray-100', border: 'border-gray-200' },
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
}

export default function MembresPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['members-list-public'],
    queryFn: () => membersApi.list({ size: 500, status: 'active' }),
  })

  const filtered = (data?.items ?? []).filter(m => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      m.first_name.toLowerCase().includes(q) ||
      m.last_name.toLowerCase().includes(q)
    )
  })

  const total = data?.total ?? 0

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Membres</h1>
        <p className="text-sm text-slate-400 mt-1">
          {isLoading ? '—' : `${total} membre${total > 1 ? 's' : ''} actifs`}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher un membre…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]/20"
        />
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-[rgba(99,102,241,0.15)] shadow-sm overflow-hidden">

        {isLoading && (
          <div className="space-y-3 px-5 py-5">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="px-5 py-5">
            <EmptyState
              title="Aucun résultat"
              description="Ajustez votre recherche pour retrouver un membre dans la liste."
            />
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <ul className="divide-y divide-slate-100">
            {filtered.map(m => {
              const isSelf = m.id === user?.id
              const visibleRoles = m.roles.filter(r => r !== 'member')

              return (
                <li
                  key={m.id}
                  className={cn(
                    'flex items-center gap-4 px-5 py-3.5',
                    isSelf && 'bg-indigo-50/50',
                  )}
                >
                  {/* Avatar */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${avatarColor(m.first_name + m.last_name)}`}>
                    <span className="text-[11px] font-bold">
                      {m.first_name[0]}{m.last_name[0]}
                    </span>
                  </div>

                  {/* Name + meta */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {m.first_name} {m.last_name}
                      {isSelf && <span className="ml-1.5 text-[11px] text-[#6366F1] font-normal">(vous)</span>}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">Membre depuis {fmtDate(m.joined_at)}</p>
                  </div>

                  {/* Role chips */}
                  <div className="hidden sm:flex gap-1.5 shrink-0">
                    {visibleRoles.length > 0 ? visibleRoles.map(role => {
                      const meta = ROLE_META[role]
                      if (!meta) return null
                      const Icon = meta.icon
                      return (
                        <span
                          key={role}
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border',
                            meta.bg, meta.color, meta.border,
                          )}
                        >
                          <Icon size={9} />
                          {meta.label}
                        </span>
                      )
                    }) : (
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border',
                        ROLE_META.member.bg, ROLE_META.member.color, ROLE_META.member.border,
                      )}>
                        <User size={9} />
                        Membre
                      </span>
                    )}
                  </div>

                </li>
              )
            })}
          </ul>
        )}
      </div>

    </div>
  )
}
