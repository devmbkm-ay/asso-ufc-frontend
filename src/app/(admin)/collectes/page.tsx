'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { collectes, ApiError } from '@/lib/api'
import { useAuth } from '@/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Heart, Users, Calendar } from 'lucide-react'

function fmtEur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function daysLeft(endDate: string) {
  const diff = new Date(endDate).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

const EMPTY_FORM = {
  title: '',
  beneficiary_name: '',
  photo_url: '',
  description: '',
  min_amount: '20',
  start_date: new Date().toISOString().split('T')[0],
}

const FIELD = 'bg-white border-[rgba(0,0,0,0.12)] text-[#1a1a1a] placeholder:text-[#B0A9A2] focus:border-[#C8A96E]'

export default function CollectesPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)

  const canCreate = user?.roles.some(r => ['super_admin', 'secretary'].includes(r))

  const { data, isLoading } = useQuery({
    queryKey: ['collectes'],
    queryFn: () => collectes.list(),
  })

  const { mutate: create, isPending } = useMutation({
    mutationFn: collectes.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectes'] })
      closeModal()
    },
    onError: (err: unknown) => {
      setFormError(err instanceof ApiError ? err.message : 'Erreur inattendue')
    },
  })

  function closeModal() {
    setOpen(false)
    setForm(EMPTY_FORM)
    setFormError(null)
  }

  function field(key: keyof typeof EMPTY_FORM) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    create({
      title:            form.title,
      beneficiary_name: form.beneficiary_name,
      photo_url:        form.photo_url   || undefined,
      description:      form.description || undefined,
      min_amount:       Number(form.min_amount) || 20,
      start_date:       form.start_date,
    })
  }

  const active = data?.filter(c => c.is_active) ?? []
  const past   = data?.filter(c => !c.is_active) ?? []

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1a1a1a]">Collectes de solidarité</h1>
          <p className="text-sm text-[#6B6560] mt-0.5">
            {data ? `${data.length} collecte${data.length > 1 ? 's' : ''}` : '—'}
          </p>
        </div>

        {canCreate && (
          <Dialog open={open} onOpenChange={next => { if (!next) closeModal(); else setOpen(true) }}>
            <Button
              onClick={() => setOpen(true)}
              className="bg-[#C8A96E] hover:bg-[#b8994e] text-white gap-1.5 shrink-0"
            >
              <Plus size={14} />
              Nouvelle collecte
            </Button>

            <DialogContent className="bg-white border-[rgba(0,0,0,0.08)] sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-[#1a1a1a]">Nouvelle collecte</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 mt-1">
                <div className="space-y-1.5">
                  <label className="text-xs text-[#6B6560]">Titre de la collecte *</label>
                  <Input
                    value={form.title}
                    onChange={field('title')}
                    required
                    placeholder="Collecte de solidarité — famille Dupont"
                    className={FIELD}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-[#6B6560]">Nom du défunt *</label>
                  <Input
                    value={form.beneficiary_name}
                    onChange={field('beneficiary_name')}
                    required
                    placeholder="M. Jean Dupont"
                    className={FIELD}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-[#6B6560]">
                    URL de la photo <span className="text-[#B0A9A2]">(optionnel)</span>
                  </label>
                  <Input
                    type="url"
                    value={form.photo_url}
                    onChange={field('photo_url')}
                    placeholder="https://…"
                    className={FIELD}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-[#6B6560]">
                    Message <span className="text-[#B0A9A2]">(optionnel)</span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={field('description')}
                    rows={3}
                    placeholder="Un mot d'accompagnement pour la famille…"
                    className="w-full rounded-md border border-[rgba(0,0,0,0.12)] bg-white px-3 py-2 text-sm text-[#1a1a1a] placeholder:text-[#B0A9A2] focus:outline-none focus:border-[#C8A96E] resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-[#6B6560]">Montant minimum (€)</label>
                    <Input
                      type="number"
                      min={1}
                      value={form.min_amount}
                      onChange={field('min_amount')}
                      className={FIELD}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-[#6B6560]">Date de début</label>
                    <Input
                      type="date"
                      value={form.start_date}
                      onChange={field('start_date')}
                      required
                      className={FIELD}
                    />
                  </div>
                </div>

                <p className="text-xs text-[#9B928B]">
                  La collecte durera 14 jours à partir de la date de début.
                </p>

                {formError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {formError}
                  </p>
                )}

                <DialogFooter className="gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeModal}
                    className="border-[rgba(0,0,0,0.12)] text-[#6B6560] bg-transparent"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="bg-[#C8A96E] hover:bg-[#b8994e] text-white"
                  >
                    {isPending ? 'Création…' : 'Lancer la collecte'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading && (
        <div className="py-16 text-center text-[#9B928B] text-sm">Chargement…</div>
      )}

      {/* Collectes actives */}
      {active.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold tracking-widest text-[#6B6560] uppercase">En cours</h2>
          <div className="space-y-3">
            {active.map(c => (
              <CollecteCard key={c.id} collecte={c} />
            ))}
          </div>
        </section>
      )}

      {/* Collectes passées */}
      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold tracking-widest text-[#6B6560] uppercase">Terminées</h2>
          <div className="space-y-3">
            {past.map(c => (
              <CollecteCard key={c.id} collecte={c} />
            ))}
          </div>
        </section>
      )}

      {!isLoading && data?.length === 0 && (
        <div className="py-16 text-center space-y-2">
          <Heart size={32} className="mx-auto text-[#D8C9A8]" />
          <p className="text-sm text-[#9B928B]">Aucune collecte pour le moment</p>
        </div>
      )}
    </div>
  )
}

function CollecteCard({ collecte: c }: { collecte: import('@/lib/types').CollecteRead }) {
  const remaining = daysLeft(c.end_date)

  return (
    <Link
      href={`/collectes/${c.id}`}
      className="block bg-white rounded-xl border border-[rgba(200,169,110,0.18)] shadow-sm p-5 hover:border-[rgba(200,169,110,0.4)] transition-colors"
    >
      <div className="flex gap-4">
        {/* Photo ou placeholder */}
        <div className="w-14 h-14 rounded-full shrink-0 overflow-hidden bg-[#F0EBE2] flex items-center justify-center">
          {c.photo_url
            ? <img src={c.photo_url} alt={c.beneficiary_name} className="w-full h-full object-cover" />
            : <Heart size={22} className="text-[#C8A96E]" />
          }
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-sm font-semibold text-[#1a1a1a]">{c.title}</h3>
              <p className="text-xs text-[#9B928B] mt-0.5">En mémoire de {c.beneficiary_name}</p>
            </div>
            <Badge className={
              c.is_active
                ? 'text-[10px] border bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'text-[10px] border bg-gray-100 text-gray-500 border-gray-200'
            }>
              {c.is_closed ? 'Clôturée' : c.is_active ? 'En cours' : 'Expirée'}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-5 mt-3 text-sm">
            <div>
              <p className="text-lg font-bold text-[#C8A96E] leading-none">{fmtEur(c.total_collected)}</p>
              <p className="text-[10px] text-[#9B928B] mt-0.5">collectés</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#9B928B]">
              <Users size={12} className="text-[#C8A96E]" />
              {c.contributors_count} contributeur{c.contributors_count > 1 ? 's' : ''}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[#9B928B]">
              <Calendar size={12} className="text-[#C8A96E]" />
              {c.is_active
                ? `${remaining} jour${remaining > 1 ? 's' : ''} restant${remaining > 1 ? 's' : ''}`
                : `Terminée le ${fmtDate(c.end_date)}`
              }
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
