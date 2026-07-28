'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { deathReports, beneficiaries } from '@/lib/api'
import { useAuth } from '@/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { SkeletonTableRow } from '@/components/ui/skeleton'
import { CheckCheck, XCircle, Clock, CheckCircle2, Ban, Lock, HeartHandshake } from 'lucide-react'
import { cn, avatarColor } from '@/lib/utils'

const STATUS_TABS = [
  { value: '', label: 'Tous' },
  { value: 'pending', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmés' },
  { value: 'dismissed', label: 'Rejetés' },
]

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  pending: { label: 'En attente', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: <Clock size={11} /> },
  confirmed: { label: 'Confirmé', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <CheckCircle2 size={11} /> },
  dismissed: { label: 'Rejeté', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: <Ban size={11} /> },
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function SignalementsDecesAdminPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('')

  const canReview = user?.roles?.some(r => ['super_admin', 'president'].includes(r)) ?? false

  const { data, isLoading } = useQuery({
    queryKey: ['death-reports', 'admin', status],
    queryFn: () => deathReports.list(status || undefined),
    enabled: canReview,
  })

  // Chargé une seule fois pour la page : sert à retrouver les désignations
  // validées d'un membre décédé (sens A) ou le désignateur d'une personne
  // désignée décédée (sens B), sans requête dédiée par ligne.
  const { data: designations } = useQuery({
    queryKey: ['beneficiaries', 'admin', 'all'],
    queryFn: () => beneficiaries.list(),
    enabled: canReview,
  })

  const { mutate: confirm, isPending: isConfirming } = useMutation({
    mutationFn: deathReports.confirm,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['death-reports', 'admin'] }),
  })

  const { mutate: dismiss, isPending: isDismissing } = useMutation({
    mutationFn: deathReports.dismiss,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['death-reports', 'admin'] }),
  })

  if (!canReview) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <EmptyState
          title="Accès réservé"
          description="Seuls le président et le super_admin peuvent instruire les signalements de décès."
          icon={<Lock className="size-5" />}
        />
      </div>
    )
  }

  function collecteLink(prefillName: string, designationId?: string) {
    const q = new URLSearchParams()
    q.set('prefill_name', prefillName)
    q.set('prefill_category', 'deces')
    if (designationId) q.set('prefill_designation', designationId)
    return `/collectes?${q}`
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Signalements de décès</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Signalements du décès d&apos;un membre ou d&apos;une personne désignée par un membre. Chaque signalement
          doit être vérifié humainement avant de créer la collecte de solidarité correspondante.
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
              title="Aucun signalement"
              description="Les signalements de décès déposés par les membres apparaîtront ici."
            />
          </div>
        )}

        {!isLoading && data && data.length > 0 && (
          <ul className="divide-y divide-border">
            {data.map(r => {
              const meta = STATUS_META[r.status] ?? STATUS_META.pending

              // Sens A : le membre est décédé → ses bénéficiaires désignés validés.
              const memberBeneficiaries = r.member_id
                ? (designations ?? []).filter(d => d.member_id === r.member_id && d.status === 'validated')
                : []

              // Sens B : la personne désignée est décédée → le membre désignateur.
              const sourceDesignation = r.designation_id
                ? (designations ?? []).find(d => d.id === r.designation_id)
                : undefined

              return (
                <li key={r.id} className="px-5 py-3.5 flex flex-col gap-3 hover:bg-muted">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', avatarColor(r.target_label))}>
                      <span className="text-[11px] font-bold">
                        {r.target_label.split(' ').map(p => p[0]).slice(0, 2).join('')}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{r.target_label}</p>
                      <p className="text-xs text-muted-foreground">
                        Signalé par {r.reporter_name} · le {fmtDate(r.created_at)}
                      </p>
                      {r.note && (
                        <p className="text-xs text-muted-foreground mt-0.5 italic">« {r.note} »</p>
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
                      {r.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isConfirming}
                            onClick={() => confirm(r.id)}
                            className="text-success border-success/30 hover:bg-success/10 gap-1"
                          >
                            <CheckCheck size={12} />
                            Confirmer
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isDismissing}
                            onClick={() => dismiss(r.id)}
                            className="text-error border-error/30 hover:bg-error/10 gap-1"
                          >
                            <XCircle size={12} />
                            Rejeter
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {r.status === 'confirmed' && r.member_id && memberBeneficiaries.length > 0 && (
                    <div className="flex flex-wrap gap-2 pl-12">
                      {memberBeneficiaries.map(b => (
                        <Link
                          key={b.id}
                          href={collecteLink(b.full_name, b.id)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-primary/20 bg-primary/5 text-xs text-primary hover:bg-primary/10 transition-colors"
                        >
                          <HeartHandshake size={12} />
                          Créer une collecte pour {b.full_name} ({b.relation})
                        </Link>
                      ))}
                    </div>
                  )}

                  {r.status === 'confirmed' && r.designation_id && sourceDesignation && (
                    <div className="flex flex-wrap gap-2 pl-12">
                      <Link
                        href={collecteLink(sourceDesignation.member_name, sourceDesignation.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-primary/20 bg-primary/5 text-xs text-primary hover:bg-primary/10 transition-colors"
                      >
                        <HeartHandshake size={12} />
                        Créer une collecte pour {sourceDesignation.member_name}
                      </Link>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
