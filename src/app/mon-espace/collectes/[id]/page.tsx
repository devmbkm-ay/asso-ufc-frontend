'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { collectes, ApiError } from '@/lib/api'
import { useAuth } from '@/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Toast } from '@/components/ui/toast'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import {
  Heart, Users, EyeOff, Eye, AlertCircle,
} from 'lucide-react'
import { cn, avatarColor } from '@/lib/utils'
import { categoryLabel } from '@/lib/collecte-categories'

function fmtAmount(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function CollecteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [showForm, setShowForm] = useState(false)
  const [amount, setAmount] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { data: collecte, isLoading: loadingCollecte } = useQuery({
    queryKey: ['collecte', id],
    queryFn: () => collectes.get(id),
    enabled: !!id,
  })

  const { data: contributions, isLoading: loadingContribs } = useQuery({
    queryKey: ['contributions', id],
    queryFn: () => collectes.contributions(id),
    enabled: !!id,
  })

  const { mutate: contribute, isPending } = useMutation({
    mutationFn: () => collectes.contribute(id, parseFloat(amount), isAnonymous),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contributions', id] })
      queryClient.invalidateQueries({ queryKey: ['collecte', id] })
      queryClient.invalidateQueries({ queryKey: ['collectes-active'] })
      setShowForm(false)
      setAmount('')
      setIsAnonymous(false)
      setFormError(null)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
    },
    onError: (err: unknown) => {
      setFormError(err instanceof ApiError ? err.message : 'Erreur inattendue')
    },
  })

  if (loadingCollecte) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (!collecte) return null

  const canContribute = collecte.status === 'active'
  const myContribs = contributions?.filter(c => c.member_id === user?.id) ?? []
  const myTotal = myContribs.reduce((s, c) => s + c.amount, 0)

  const minAmount = collecte.min_amount

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">

      <Breadcrumb
        items={[
          { label: 'Mon espace', href: '/mon-espace' },
          { label: 'Collectes', href: '/mon-espace/collectes' },
          { label: collecte.title },
        ]}
      />

      {/* Header card */}
      <div className="bg-card rounded-xl border border-primary/15 shadow-sm overflow-hidden">
        {collecte.photo_url && (
          <img
            src={collecte.photo_url}
            alt={collecte.beneficiary_name}
            className="w-full h-40 object-cover"
          />
        )}
        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-xl font-semibold text-foreground">{collecte.title}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {collecte.beneficiary_name}
                {collecte.category && (
                  <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {categoryLabel(collecte.category)}
                  </span>
                )}
              </p>
            </div>
            <span className={cn(
              'text-[10px] font-semibold px-2.5 py-1 rounded-full border shrink-0',
              collecte.status === 'active' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
              collecte.status === 'upcoming' && 'bg-blue-50 text-blue-600 border-blue-200',
              collecte.status === 'expired' && 'bg-amber-50 text-amber-700 border-amber-200',
              collecte.status === 'closed' && 'bg-muted text-muted-foreground border-border',
            )}>
              {collecte.status === 'active' ? 'En cours'
                : collecte.status === 'upcoming' ? 'À venir'
                  : collecte.status === 'expired' ? 'Expirée'
                    : 'Clôturée'}
            </span>
          </div>

          {collecte.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{collecte.description}</p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-6 pt-1">
            <div>
              <p className="text-xl font-bold text-foreground">{fmtAmount(collecte.total_collected)}</p>
              <p className="text-xs text-muted-foreground">collectés</p>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <p className="text-xl font-bold text-foreground">{collecte.contributors_count}</p>
              <p className="text-xs text-muted-foreground">contributeur{collecte.contributors_count > 1 ? 's' : ''}</p>
            </div>
            {myTotal > 0 && (
              <>
                <div className="w-px h-8 bg-slate-200" />
                <div>
                  <p className="text-xl font-bold text-emerald-600">{fmtAmount(myTotal)}</p>
                  <p className="text-xs text-muted-foreground">ma contribution</p>
                </div>
              </>
            )}
          </div>

          {/* Progress bar */}
          {!!collecte.goal_amount && (
            <div className="space-y-1.5">
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min((collecte.total_collected / collecte.goal_amount) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">Objectif {fmtAmount(collecte.goal_amount)}</p>
            </div>
          )}

          {/* Dates */}
          <p className="text-xs text-muted-foreground">
            {fmtDate(collecte.start_date)} → {fmtDate(collecte.end_date)}
          </p>
        </div>
      </div>

      {/* Contribute section */}
      {canContribute && (
        <div className="bg-card rounded-xl border border-primary/15 shadow-sm p-5 space-y-4">
          {success && (
            <Toast
              variant="success"
              title="Merci pour votre contribution !"
              description="Votre participation a bien été enregistrée."
            />
          )}

          {!showForm ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Contribuer à cette collecte</p>
                <p className="text-xs text-muted-foreground mt-0.5">Minimum {fmtAmount(minAmount)}</p>
              </div>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-primary hover:bg-primary/80 text-primary-foreground gap-2"
              >
                <Heart size={14} />
                Je contribue
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-foreground">Votre contribution</p>

              {/* Amount input */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">
                  Montant (min. {fmtAmount(minAmount)})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={minAmount}
                    step="1"
                    placeholder={String(minAmount)}
                    value={amount}
                    onChange={e => { setAmount(e.target.value); setFormError(null) }}
                    className="w-full pr-8 pl-3 py-2 text-sm rounded-xl border border-border text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                </div>
              </div>

              {/* Anonymous toggle */}
              <button
                type="button"
                onClick={() => setIsAnonymous(a => !a)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <div className={cn(
                  'w-4 h-4 rounded border flex items-center justify-center transition-colors',
                  isAnonymous
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'border-slate-300 bg-card',
                )}>
                  {isAnonymous && <span className="text-[8px] font-bold">✓</span>}
                </div>
                {isAnonymous
                  ? <><EyeOff size={13} className="text-muted-foreground" /> Contribution anonyme</>
                  : <><Eye size={13} className="text-muted-foreground" /> Afficher mon nom</>
                }
              </button>

              {isAnonymous && (
                <p className="text-[11px] text-muted-foreground bg-muted rounded-lg px-3 py-2">
                  Votre nom n'apparaîtra pas dans la liste des contributions.
                </p>
              )}

              {formError && (
                <Toast
                  variant="error"
                  title="Contribution non enregistrée"
                  description={formError}
                  closeable
                  onClose={() => setFormError(null)}
                />
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => contribute()}
                  disabled={!amount || parseFloat(amount) < minAmount || isPending}
                  className="bg-primary hover:bg-primary/80 text-primary-foreground"
                >
                  {isPending ? 'Envoi…' : `Contribuer ${amount ? fmtAmount(parseFloat(amount)) : ''}`}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setShowForm(false); setAmount(''); setFormError(null) }}
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Contributions wall */}
      <div className="bg-card rounded-xl border border-primary/15 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <Users size={14} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Contributeurs</h2>
          <span className="ml-auto text-xs text-muted-foreground">
            {loadingContribs ? '—' : `${contributions?.length ?? 0}`}
          </span>
        </div>

        {loadingContribs && (
          <div className="space-y-3 px-5 py-5">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}

        {!loadingContribs && contributions?.length === 0 && (
          <div className="px-5 py-5">
            <EmptyState
              title="Soyez le premier à contribuer"
              description="La liste des participations apparaîtra ici dès qu’un premier montant sera enregistré."
              icon={<Heart className="size-5" />}
            />
          </div>
        )}

        {contributions && contributions.length > 0 && (
          <ul className="divide-y divide-border">
            {contributions.map((c, i) => {
              const isMe = c.member_id === user?.id && !c.is_anonymous
              return (
                <li key={c.id} className={cn(
                  'flex items-center gap-4 px-5 py-3.5',
                  isMe && 'bg-primary/5',
                )}>
                  {/* Position */}
                  <span className="text-[11px] text-muted-foreground w-5 text-right shrink-0">{i + 1}</span>

                  {/* Avatar */}
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold',
                    c.is_anonymous
                      ? 'bg-muted text-muted-foreground'
                      : avatarColor(c.member_name),
                  )}>
                    {c.is_anonymous ? '?' : c.member_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {c.member_name}
                      {isMe && <span className="ml-1.5 text-[11px] text-primary font-normal">(vous)</span>}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{fmtTime(c.contributed_at)}</p>
                  </div>

                  {/* Amount */}
                  <span className="text-sm font-semibold text-foreground shrink-0">
                    {fmtAmount(c.amount)}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
