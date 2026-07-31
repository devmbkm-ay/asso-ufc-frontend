'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { beneficiaries } from '@/lib/api'
import { useAuth } from '@/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { SkeletonTableRow } from '@/components/ui/skeleton'
import { UserCheck, UserX, Clock, CheckCircle2, XCircle, Lock, Ban } from 'lucide-react'
import { cn, avatarColor } from '@/lib/utils'
import { DeceasedBadge } from '@/components/ui/deceased-badge'

const STATUS_TABS = [
  { value: '', label: 'Toutes' },
  { value: 'pending', label: 'En attente' },
  { value: 'validated', label: 'Validées' },
  { value: 'rejected', label: 'Rejetées' },
  { value: 'revoked', label: 'Révoquées' },
]

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  pending: { label: 'En attente', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: <Clock size={11} /> },
  validated: { label: 'Validé', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <CheckCircle2 size={11} /> },
  rejected: { label: 'Rejeté', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: <XCircle size={11} /> },
  revoked: { label: 'Révoquée', color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border', icon: <Ban size={11} /> },
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function BeneficiairesAdminPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('')

  const canValidate = user?.roles?.some(r => ['super_admin', 'president'].includes(r)) ?? false

  const { data, isLoading } = useQuery({
    queryKey: ['beneficiaries', 'admin', status],
    queryFn: () => beneficiaries.list(status || undefined),
    enabled: canValidate,
  })

  const { mutate: validate, isPending: isValidating } = useMutation({
    mutationFn: beneficiaries.validate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['beneficiaries', 'admin'] }),
  })

  const { mutate: reject, isPending: isRejecting } = useMutation({
    mutationFn: beneficiaries.reject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['beneficiaries', 'admin'] }),
  })

  if (!canValidate) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <EmptyState
          title="Accès réservé"
          description="Seuls le président et le super_admin peuvent instruire les désignations de bénéficiaires."
          icon={<Lock className="size-5" />}
        />
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Bénéficiaires désignés</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Personnes désignées par des membres pour bénéficier d'une collecte de solidarité en cas de
          décès. Ces informations sont confidentielles — réservées à l'instruction des dossiers, jamais
          affichées publiquement.
        </p>
      </div>

      <div className="flex gap-1 bg-muted border border-border rounded-lg p-1 overflow-x-auto w-fit">
        {STATUS_TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setStatus(t.value)}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors shrink-0 whitespace-nowrap',
              status === t.value
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-card rounded-xl border border-primary/15 shadow-sm overflow-hidden">
        {isLoading && (
          <div className="space-y-3 px-5 py-5">
            <SkeletonTableRow />
            <SkeletonTableRow />
            <SkeletonTableRow />
          </div>
        )}

        {!isLoading && data?.length === 0 && (
          <div className="px-5 py-5">
            <EmptyState
              title="Aucune désignation trouvée"
              description="Les bénéficiaires désignés par les membres apparaîtront ici."
            />
          </div>
        )}

        {!isLoading && data && data.length > 0 && (
          <ul className="divide-y divide-border">
            {data.map(b => {
              const meta = STATUS_META[b.status] ?? STATUS_META.pending
              return (
                <li key={b.id} className={cn(
                  'px-5 py-3.5 flex items-center gap-4 flex-wrap hover:bg-muted',
                  b.person_deceased && 'opacity-60',
                )}>
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', avatarColor(b.member_name))}>
                    <span className="text-[11px] font-bold">
                      {b.member_name.split(' ').map(p => p[0]).slice(0, 2).join('')}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground flex items-center gap-1.5 flex-wrap">
                      {b.full_name} <span className="text-muted-foreground font-normal">({b.relation})</span>
                      {b.person_deceased && <DeceasedBadge />}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                      Désigné par {b.member_name}
                      {b.member_deceased && <DeceasedBadge />}
                      · {b.contact} · le {fmtDate(b.created_at)}
                    </p>
                    {b.status === 'validated' && b.active_from && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Actif à partir du {fmtDate(b.active_from)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-auto">
                    <span className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border',
                      meta.bg, meta.color, meta.border,
                    )}>
                      {meta.icon}
                      {meta.label}
                    </span>
                    {b.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isValidating}
                          onClick={() => validate(b.id)}
                          className="text-success border-success/30 hover:bg-success/10 gap-1"
                        >
                          <UserCheck size={12} />
                          Valider
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isRejecting}
                          onClick={() => reject(b.id)}
                          className="text-error border-error/30 hover:bg-error/10 gap-1"
                        >
                          <UserX size={12} />
                          Rejeter
                        </Button>
                      </>
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
