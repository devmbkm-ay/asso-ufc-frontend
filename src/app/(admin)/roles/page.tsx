'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { members as membersApi, ApiError } from '@/lib/api'
import { useAuth } from '@/providers/AuthProvider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Shield, Crown, BookOpen, Wallet, User, X, Plus } from 'lucide-react'
import { cn, avatarColor } from '@/lib/utils'

const ROLE_META: Record<string, {
  label: string
  icon: React.ElementType
  color: string
  bg: string
  border: string
}> = {
  super_admin: { label: 'Super admin', icon: Crown,    color: 'text-[#6366F1]',  bg: 'bg-indigo-50',    border: 'border-indigo-200' },
  treasurer:   { label: 'Trésorier',   icon: Wallet,   color: 'text-purple-700', bg: 'bg-purple-50',    border: 'border-purple-200' },
  secretary:   { label: 'Secrétaire',  icon: BookOpen, color: 'text-emerald-700',bg: 'bg-emerald-50',   border: 'border-emerald-200' },
  member:      { label: 'Membre',      icon: User,     color: 'text-gray-500',   bg: 'bg-gray-100',     border: 'border-gray-200' },
}

const ALL_ROLES = ['super_admin', 'treasurer', 'secretary', 'member']

export default function RolesPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [addingFor, setAddingFor]     = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState('')
  const [error, setError]             = useState<string | null>(null)

  const canAdmin = user?.roles.includes('super_admin')

  const { data, isLoading } = useQuery({
    queryKey: ['members-all'],
    queryFn:  () => membersApi.list({ size: 500 }),
  })

  const { mutate: assign, isPending: isAssigning } = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      membersApi.assignRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members-all'] })
      setAddingFor(null)
      setSelectedRole('')
      setError(null)
    },
    onError: (err: unknown) =>
      setError(err instanceof ApiError ? err.message : 'Erreur inattendue'),
  })

  const { mutate: revoke } = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      membersApi.revokeRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members-all'] })
    },
  })

  const membersWithRoles = data?.items.filter(m => m.roles.some(r => r !== 'member')) ?? []
  const membersOnly      = data?.items.filter(m => m.roles.every(r => r === 'member')) ?? []

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Rôles & accès</h1>
        <p className="text-sm text-slate-400 mt-1">
          Attribuez et révoquez les rôles des membres de l'association.
        </p>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ALL_ROLES.map(role => {
          const m = ROLE_META[role]
          const Icon = m.icon
          return (
            <div key={role} className="bg-white rounded-xl border border-[rgba(99,102,241,0.15)] shadow-sm p-3 flex items-center gap-2.5">
              <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', m.bg)}>
                <Icon size={13} className={m.color} />
              </div>
              <span className="text-xs font-medium text-slate-800">{m.label}</span>
            </div>
          )
        })}
      </div>

      {/* Members list */}
      <div className="bg-white rounded-xl border border-[rgba(99,102,241,0.15)] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800">Membres & rôles</h2>
        </div>

        {isLoading && (
          <div className="px-5 py-10 text-center text-sm text-slate-400">Chargement…</div>
        )}

        {!isLoading && (
          <ul className="divide-y divide-slate-100">
            {[...membersWithRoles, ...membersOnly].map(m => {
              const isAdding = addingFor === m.id
              const availableRoles = ALL_ROLES.filter(r => !m.roles.includes(r))

              return (
                <li key={m.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-slate-50">
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${avatarColor(m.first_name + m.last_name)}`}>
                    <span className="text-[11px] font-bold">
                      {m.first_name[0]}{m.last_name[0]}
                    </span>
                  </div>

                  {/* Name */}
                  <div className="w-40 shrink-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {m.first_name} {m.last_name}
                    </p>
                  </div>

                  {/* Role chips */}
                  <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                    {m.roles.map(role => {
                      const meta = ROLE_META[role]
                      if (!meta) return null
                      const Icon = meta.icon
                      const isSelf = m.id === user?.id
                      const isLastRole = m.roles.length === 1
                      return (
                        <span
                          key={role}
                          className={cn(
                            'inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-[11px] font-medium border',
                            meta.bg, meta.color, meta.border,
                          )}
                        >
                          <Icon size={10} />
                          {meta.label}
                          {canAdmin && !isSelf && !isLastRole && (
                            <button
                              onClick={() => revoke({ id: m.id, role })}
                              className="ml-0.5 hover:opacity-70 transition-opacity"
                              title={`Révoquer ${meta.label}`}
                            >
                              <X size={10} />
                            </button>
                          )}
                        </span>
                      )
                    })}
                  </div>

                  {/* Add role */}
                  {canAdmin && m.id !== user?.id && availableRoles.length > 0 && (
                    <div className="shrink-0">
                      {isAdding ? (
                        <div className="flex items-center gap-1.5">
                          <select
                            value={selectedRole}
                            onChange={e => { setSelectedRole(e.target.value); setError(null) }}
                            className="text-xs rounded-md border border-slate-200 bg-white text-slate-800 px-2 py-1 focus:outline-none focus:border-[#6366F1]"
                          >
                            <option value="">Choisir…</option>
                            {availableRoles.map(r => (
                              <option key={r} value={r}>{ROLE_META[r]?.label ?? r}</option>
                            ))}
                          </select>
                          <Button
                            size="sm"
                            disabled={!selectedRole || isAssigning}
                            onClick={() => assign({ id: m.id, role: selectedRole })}
                            className="h-6 px-2 text-[11px] bg-[#6366F1] hover:bg-[#4F46E5] text-white"
                          >
                            OK
                          </Button>
                          <button
                            onClick={() => { setAddingFor(null); setSelectedRole(''); setError(null) }}
                            className="text-slate-400 hover:text-slate-800"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setAddingFor(m.id); setSelectedRole('') }}
                          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-[#6366F1] transition-colors"
                          title="Attribuer un rôle"
                        >
                          <Plus size={12} />
                          Ajouter
                        </button>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Error toast */}
      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Bottom note */}
      <p className="flex items-center gap-2 text-xs text-slate-400 border-t border-slate-100 pt-4">
        <Shield size={12} />
        Un membre doit toujours conserver au moins un rôle. Le rôle super_admin ne peut pas être révoqué par lui-même.
      </p>
    </div>
  )
}
