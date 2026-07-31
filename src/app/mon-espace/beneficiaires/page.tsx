'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { beneficiaries, deathReports, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Toast } from '@/components/ui/toast'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { UserPlus, Clock, CheckCircle2, XCircle, X, Heart, HeartCrack } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DeceasedBadge } from '@/components/ui/deceased-badge'
import type { BeneficiaryDesignation } from '@/lib/types'

const MAX_BENEFICIARIES = 2

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  pending: { label: 'En attente de validation', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: <Clock size={11} /> },
  validated: { label: 'Validé', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <CheckCircle2 size={11} /> },
  rejected: { label: 'Rejeté', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: <XCircle size={11} /> },
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const EMPTY_FORM = { full_name: '', relation: '', contact: '' }

export default function BeneficiairesPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [reportTarget, setReportTarget] = useState<BeneficiaryDesignation | null>(null)
  const [note, setNote] = useState('')
  const [toast, setToast] = useState<{ variant: 'success' | 'error'; message: string } | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['beneficiaries', 'me'],
    queryFn: beneficiaries.mine,
  })

  const activeCount = data?.filter(b => b.status === 'pending' || b.status === 'validated').length ?? 0
  const canDeclare = activeCount < MAX_BENEFICIARIES

  const { mutate: create, isPending } = useMutation({
    mutationFn: beneficiaries.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaries', 'me'] })
      setForm(EMPTY_FORM)
      setFormError(null)
    },
    onError: (err: unknown) => {
      setFormError(err instanceof ApiError ? err.message : 'Erreur inattendue')
    },
  })

  const { mutate: revoke } = useMutation({
    mutationFn: beneficiaries.revoke,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaries', 'me'] })
    },
  })

  const { mutate: reportDeath, isPending: isReporting } = useMutation({
    mutationFn: () => deathReports.reportDesignation(reportTarget!.id, note || undefined),
    onSuccess: () => {
      setToast({ variant: 'success', message: 'Signalement transmis aux responsables.' })
      setReportTarget(null)
      setNote('')
    },
    onError: (err: unknown) => {
      setToast({ variant: 'error', message: err instanceof ApiError ? err.message : 'Erreur inattendue' })
    },
  })

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    create(form)
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Mes bénéficiaires</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Désignez jusqu'à {MAX_BENEFICIARIES} personnes vivantes (famille ou proches) pour lesquelles
          l'association pourra organiser une collecte de solidarité en cas de décès. Chaque désignation
          est examinée par un administrateur avant d'être active.
        </p>
      </div>

      {canDeclare && (
        <div className="bg-card rounded-xl border border-primary/15 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2">
            <UserPlus size={15} className="text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Désigner un bénéficiaire</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Nom complet *</label>
                <Input
                  value={form.full_name}
                  onChange={field('full_name')}
                  placeholder="Marie Dupont"
                  required
                  className="bg-card border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Lien de parenté *</label>
                <Input
                  value={form.relation}
                  onChange={field('relation')}
                  placeholder="Tante, cousin, ami proche…"
                  required
                  className="bg-card border-border text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Contact (téléphone ou email) *</label>
              <Input
                value={form.contact}
                onChange={field('contact')}
                placeholder="06 00 00 00 00"
                required
                className="bg-card border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {formError && (
              <p className="text-sm text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">
                {formError}
              </p>
            )}

            <Button
              type="submit"
              disabled={isPending}
              className="bg-primary hover:bg-primary/80 text-primary-foreground"
            >
              {isPending ? 'Envoi…' : 'Soumettre à validation'}
            </Button>
          </form>
        </div>
      )}

      {!canDeclare && (
        <div className="flex items-center gap-3 bg-warning/10 border border-warning/30 rounded-xl p-4 text-sm text-warning">
          Vous avez atteint le nombre maximum de bénéficiaires désignés ({MAX_BENEFICIARIES}).
          Retirez-en un pour pouvoir en désigner un autre.
        </div>
      )}

      <div className="bg-card rounded-xl border border-primary/15 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Mes désignations</h2>
        </div>

        {isLoading && (
          <div className="space-y-3 px-5 py-5">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}

        {!isLoading && data?.length === 0 && (
          <div className="px-5 py-5">
            <EmptyState
              title="Aucun bénéficiaire désigné"
              description="Utilisez le formulaire ci-dessus pour en désigner un."
              icon={<Heart className="size-5" />}
            />
          </div>
        )}

        {!isLoading && data && data.length > 0 && (
          <ul className="divide-y divide-border">
            {data.map(b => {
              const meta = STATUS_META[b.status] ?? STATUS_META.pending
              return (
                <li key={b.id} className={cn(
                  'px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap',
                  b.person_deceased && 'opacity-60',
                )}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate flex items-center gap-1.5">
                      {b.full_name}
                      {b.person_deceased && <DeceasedBadge />}
                    </p>
                    <p className="text-xs text-muted-foreground">{b.relation} · {b.contact}</p>
                    {b.status === 'validated' && b.active_from && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Actif à partir du {fmtDate(b.active_from)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border',
                      meta.bg, meta.color, meta.border,
                    )}>
                      {meta.icon}
                      {meta.label}
                    </span>
                    {b.status === 'validated' && !b.person_deceased && (
                      <button
                        onClick={() => setReportTarget(b)}
                        className="text-muted-foreground hover:text-error transition-colors"
                        title="Signaler le décès de cette personne"
                      >
                        <HeartCrack size={14} />
                      </button>
                    )}
                    {b.status !== 'rejected' && (
                      <button
                        onClick={() => revoke(b.id)}
                        className="text-muted-foreground hover:text-error transition-colors"
                        title="Retirer cette désignation"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm">
          <Toast variant={toast.variant} description={toast.message} closeable onClose={() => setToast(null)} />
        </div>
      )}

      <Dialog open={!!reportTarget} onOpenChange={next => { if (!next) { setReportTarget(null); setNote('') } }}>
        <DialogContent className="bg-card border-primary/15 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Signaler un décès</DialogTitle>
          </DialogHeader>

          {reportTarget && (
            <form
              onSubmit={e => { e.preventDefault(); reportDeath() }}
              className="space-y-4 mt-1"
            >
              <p className="text-sm text-foreground">
                Vous êtes sur le point de signaler le décès de{' '}
                <span className="font-medium">{reportTarget.full_name}</span> ({reportTarget.relation}) aux
                responsables de l&apos;association. Ce signalement sera vérifié humainement avant toute action.
              </p>

              <div className="space-y-1.5">
                <label htmlFor="death-report-note-designation" className="text-xs text-muted-foreground">
                  Précisions <span className="text-muted-foreground">(optionnel)</span>
                </label>
                <textarea
                  id="death-report-note-designation"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  rows={3}
                  placeholder="Circonstances, contact de la famille…"
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setReportTarget(null); setNote('') }}
                  className="border-border text-muted-foreground bg-transparent"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isReporting}
                  className="bg-error hover:bg-error/80 text-white"
                >
                  {isReporting ? 'Envoi…' : 'Signaler'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
