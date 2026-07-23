'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { collectes, ApiError } from '@/lib/api'
import { useAuth } from '@/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft, Heart, Users, EyeOff, Eye, AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
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

  const [showForm, setShowForm]       = useState(false)
  const [amount, setAmount]           = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [formError, setFormError]     = useState<string | null>(null)
  const [success, setSuccess]         = useState(false)

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
      <div className="p-8 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!collecte) return null

  const canContribute = collecte.status === 'active'
  const myContribs    = contributions?.filter(c => c.member_id === user?.id) ?? []
  const myTotal       = myContribs.reduce((s, c) => s + c.amount, 0)

  const minAmount = collecte.min_amount

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">

      {/* Back */}
      <Link
        href="/mon-espace/collectes"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft size={13} /> Collectes
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-[rgba(99,102,241,0.15)] shadow-sm overflow-hidden">
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
              <h1 className="text-xl font-semibold text-slate-800">{collecte.title}</h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {collecte.beneficiary_name}
                {collecte.category && (
                  <span className="ml-2 text-xs bg-indigo-50 text-[#6366F1] px-2 py-0.5 rounded-full">
                    {categoryLabel(collecte.category)}
                  </span>
                )}
              </p>
            </div>
            <span className={cn(
              'text-[10px] font-semibold px-2.5 py-1 rounded-full border shrink-0',
              collecte.status === 'active'   && 'bg-emerald-50 text-emerald-700 border-emerald-200',
              collecte.status === 'upcoming' && 'bg-blue-50 text-blue-600 border-blue-200',
              collecte.status === 'expired'  && 'bg-amber-50 text-amber-600 border-amber-200',
              collecte.status === 'closed'   && 'bg-gray-100 text-gray-500 border-gray-200',
            )}>
              {collecte.status === 'active' ? 'En cours'
                : collecte.status === 'upcoming' ? 'À venir'
                : collecte.status === 'expired' ? 'Expirée'
                : 'Clôturée'}
            </span>
          </div>

          {collecte.description && (
            <p className="text-sm text-slate-500 leading-relaxed">{collecte.description}</p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-6 pt-1">
            <div>
              <p className="text-xl font-bold text-slate-800">{fmtAmount(collecte.total_collected)}</p>
              <p className="text-xs text-slate-400">collectés</p>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <p className="text-xl font-bold text-slate-800">{collecte.contributors_count}</p>
              <p className="text-xs text-slate-400">contributeur{collecte.contributors_count > 1 ? 's' : ''}</p>
            </div>
            {myTotal > 0 && (
              <>
                <div className="w-px h-8 bg-slate-200" />
                <div>
                  <p className="text-xl font-bold text-emerald-600">{fmtAmount(myTotal)}</p>
                  <p className="text-xs text-slate-400">ma contribution</p>
                </div>
              </>
            )}
          </div>

          {/* Progress bar */}
          {!!collecte.goal_amount && (
            <div className="space-y-1.5">
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#6366F1] transition-all"
                  style={{ width: `${Math.min((collecte.total_collected / collecte.goal_amount) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-400">Objectif {fmtAmount(collecte.goal_amount)}</p>
            </div>
          )}

          {/* Dates */}
          <p className="text-xs text-slate-400">
            {fmtDate(collecte.start_date)} → {fmtDate(collecte.end_date)}
          </p>
        </div>
      </div>

      {/* Contribute section */}
      {canContribute && (
        <div className="bg-white rounded-xl border border-[rgba(99,102,241,0.15)] shadow-sm p-5 space-y-4">
          {success && (
            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
              <Heart size={14} className="fill-emerald-500 text-emerald-500" />
              Merci pour votre contribution !
            </div>
          )}

          {!showForm ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">Contribuer à cette collecte</p>
                <p className="text-xs text-slate-400 mt-0.5">Minimum {fmtAmount(minAmount)}</p>
              </div>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-[#6366F1] hover:bg-[#4F46E5] text-white gap-2"
              >
                <Heart size={14} />
                Je contribue
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-slate-800">Votre contribution</p>

              {/* Amount input */}
              <div>
                <label className="text-xs text-slate-500 mb-1.5 block">
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
                    className="w-full pr-8 pl-3 py-2 text-sm rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]/20"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">€</span>
                </div>
              </div>

              {/* Anonymous toggle */}
              <button
                type="button"
                onClick={() => setIsAnonymous(a => !a)}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
              >
                <div className={cn(
                  'w-4 h-4 rounded border flex items-center justify-center transition-colors',
                  isAnonymous
                    ? 'bg-[#6366F1] border-[#6366F1] text-white'
                    : 'border-slate-300 bg-white',
                )}>
                  {isAnonymous && <span className="text-[8px] font-bold">✓</span>}
                </div>
                {isAnonymous
                  ? <><EyeOff size={13} className="text-slate-400" /> Contribution anonyme</>
                  : <><Eye size={13} className="text-slate-400" /> Afficher mon nom</>
                }
              </button>

              {isAnonymous && (
                <p className="text-[11px] text-slate-400 bg-slate-50 rounded-lg px-3 py-2">
                  Votre nom n'apparaîtra pas dans la liste des contributions.
                </p>
              )}

              {formError && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertCircle size={12} />
                  {formError}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => contribute()}
                  disabled={!amount || parseFloat(amount) < minAmount || isPending}
                  className="bg-[#6366F1] hover:bg-[#4F46E5] text-white"
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
      <div className="bg-white rounded-xl border border-[rgba(99,102,241,0.15)] shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
          <Users size={14} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-800">Contributeurs</h2>
          <span className="ml-auto text-xs text-slate-400">
            {loadingContribs ? '—' : `${contributions?.length ?? 0}`}
          </span>
        </div>

        {loadingContribs && (
          <div className="px-5 py-8 text-center text-sm text-slate-400">Chargement…</div>
        )}

        {!loadingContribs && contributions?.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Heart size={24} className="text-slate-300" />
            <p className="text-sm text-slate-400">Soyez le premier à contribuer</p>
          </div>
        )}

        {contributions && contributions.length > 0 && (
          <ul className="divide-y divide-slate-100">
            {contributions.map((c, i) => {
              const isMe = c.member_id === user?.id && !c.is_anonymous
              return (
                <li key={c.id} className={cn(
                  'flex items-center gap-4 px-5 py-3.5',
                  isMe && 'bg-indigo-50/50',
                )}>
                  {/* Position */}
                  <span className="text-[11px] text-slate-400 w-5 text-right shrink-0">{i + 1}</span>

                  {/* Avatar */}
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold',
                    c.is_anonymous
                      ? 'bg-slate-100 text-slate-400'
                      : avatarColor(c.member_name),
                  )}>
                    {c.is_anonymous ? '?' : c.member_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {c.member_name}
                      {isMe && <span className="ml-1.5 text-[11px] text-[#6366F1] font-normal">(vous)</span>}
                    </p>
                    <p className="text-[10px] text-slate-400">{fmtTime(c.contributed_at)}</p>
                  </div>

                  {/* Amount */}
                  <span className="text-sm font-semibold text-slate-800 shrink-0">
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
