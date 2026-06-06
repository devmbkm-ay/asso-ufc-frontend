'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { collectes, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { ArrowLeft, Heart, Users, Clock, HandCoins } from 'lucide-react'

function fmtEur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function daysLeft(endDate: string) {
  const diff = new Date(endDate).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export default function CollecteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [openContrib, setOpenContrib] = useState(false)
  const [amount, setAmount] = useState('')
  const [contribError, setContribError] = useState<string | null>(null)

  // Rafraîchissement automatique toutes les 30s pour le total en "temps réel"
  const { data: collecte, isLoading } = useQuery({
    queryKey: ['collecte', id],
    queryFn: () => collectes.get(id),
    refetchInterval: 30_000,
  })

  const { data: contributions } = useQuery({
    queryKey: ['collecte-contributions', id],
    queryFn: () => collectes.contributions(id),
    refetchInterval: 30_000,
    enabled: !!id,
  })

  const { mutate: contribute, isPending } = useMutation({
    mutationFn: (amt: number) => collectes.contribute(id, amt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collecte', id] })
      queryClient.invalidateQueries({ queryKey: ['collecte-contributions', id] })
      setOpenContrib(false)
      setAmount('')
      setContribError(null)
    },
    onError: (err: unknown) => {
      setContribError(err instanceof ApiError ? err.message : 'Erreur inattendue')
    },
  })

  function handleContrib(e: React.FormEvent) {
    e.preventDefault()
    setContribError(null)
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) {
      setContribError('Montant invalide')
      return
    }
    contribute(amt)
  }

  function closeContribModal() {
    setOpenContrib(false)
    setAmount('')
    setContribError(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-[#C8A96E] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!collecte) return null

  const remaining = daysLeft(collecte.end_date)

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">

      <Link
        href="/collectes"
        className="flex items-center gap-1.5 text-sm text-[#9B928B] hover:text-[#1a1a1a] transition-colors w-fit"
      >
        <ArrowLeft size={14} />
        Retour aux collectes
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-[rgba(200,169,110,0.18)] shadow-sm p-6">
        <div className="flex gap-5">
          {/* Photo */}
          <div className="w-20 h-20 rounded-full shrink-0 overflow-hidden bg-[#F0EBE2] flex items-center justify-center">
            {collecte.photo_url
              ? <img src={collecte.photo_url} alt={collecte.beneficiary_name} className="w-full h-full object-cover" />
              : <Heart size={30} className="text-[#C8A96E]" />
            }
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-xl font-semibold text-[#1a1a1a]">{collecte.title}</h1>
                <p className="text-sm text-[#9B928B] mt-0.5">En mémoire de {collecte.beneficiary_name}</p>
              </div>
              <Badge className={
                collecte.is_active
                  ? 'text-[10px] border bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'text-[10px] border bg-gray-100 text-gray-500 border-gray-200'
              }>
                {collecte.is_closed ? 'Clôturée' : collecte.is_active ? 'En cours' : 'Expirée'}
              </Badge>
            </div>

            {collecte.description && (
              <p className="text-sm text-[#6B6560] mt-3 leading-relaxed">{collecte.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[rgba(200,169,110,0.18)] shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-[#C8A96E]">{fmtEur(collecte.total_collected)}</p>
          <p className="text-xs text-[#9B928B] mt-1">Total collecté</p>
        </div>
        <div className="bg-white rounded-xl border border-[rgba(200,169,110,0.18)] shadow-sm p-4 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <Users size={14} className="text-[#C8A96E]" />
            <p className="text-2xl font-bold text-[#1a1a1a]">{collecte.contributors_count}</p>
          </div>
          <p className="text-xs text-[#9B928B] mt-1">Contributeur{collecte.contributors_count > 1 ? 's' : ''}</p>
        </div>
        <div className="bg-white rounded-xl border border-[rgba(200,169,110,0.18)] shadow-sm p-4 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <Clock size={14} className="text-[#C8A96E]" />
            <p className="text-2xl font-bold text-[#1a1a1a]">
              {collecte.is_active ? remaining : '—'}
            </p>
          </div>
          <p className="text-xs text-[#9B928B] mt-1">
            {collecte.is_active
              ? `jour${remaining > 1 ? 's' : ''} restant${remaining > 1 ? 's' : ''}`
              : `Fin le ${fmtDate(collecte.end_date)}`
            }
          </p>
        </div>
      </div>

      {/* Bouton contribuer */}
      {collecte.is_active && (
        <Dialog open={openContrib} onOpenChange={next => { if (!next) closeContribModal(); else setOpenContrib(true) }}>
          <Button
            onClick={() => setOpenContrib(true)}
            className="w-full bg-[#C8A96E] hover:bg-[#b8994e] text-white gap-2 py-5 text-base"
          >
            <HandCoins size={18} />
            Contribuer — minimum {fmtEur(collecte.min_amount)}
          </Button>

          <DialogContent className="bg-white border-[rgba(0,0,0,0.08)] sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-[#1a1a1a]">Ma contribution</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleContrib} className="space-y-4 mt-1">
              <div className="space-y-1.5">
                <label className="text-xs text-[#6B6560]">
                  Montant <span className="text-[#B0A9A2]">(minimum {fmtEur(collecte.min_amount)})</span>
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    min={collecte.min_amount}
                    step="0.01"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    required
                    placeholder={String(collecte.min_amount)}
                    className="bg-white border-[rgba(0,0,0,0.12)] text-[#1a1a1a] pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#9B928B]">€</span>
                </div>
              </div>

              {contribError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {contribError}
                </p>
              )}

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeContribModal}
                  className="border-[rgba(0,0,0,0.12)] text-[#6B6560] bg-transparent"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-[#C8A96E] hover:bg-[#b8994e] text-white"
                >
                  {isPending ? 'Envoi…' : 'Confirmer'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Liste contributions */}
      <div className="bg-white rounded-xl border border-[rgba(200,169,110,0.18)] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[rgba(200,169,110,0.12)]">
          <h2 className="text-sm font-semibold text-[#1a1a1a]">Contributions</h2>
        </div>

        {!contributions && (
          <div className="px-5 py-8 text-center text-[#9B928B] text-sm">Chargement…</div>
        )}
        {contributions?.length === 0 && (
          <div className="px-5 py-10 text-center text-[#9B928B] text-sm">
            Soyez le premier à contribuer
          </div>
        )}
        {contributions && contributions.length > 0 && (
          <ul className="divide-y divide-[rgba(200,169,110,0.08)]">
            {contributions.map(c => (
              <li key={c.id} className="px-5 py-3.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#F0EBE2] flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-[#8B6B30]">
                    {c.member_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1a1a1a]">{c.member_name}</p>
                  <p className="text-xs text-[#9B928B]">{fmtDateTime(c.contributed_at)}</p>
                </div>
                <p className="text-sm font-semibold text-[#C8A96E]">{fmtEur(c.amount)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
