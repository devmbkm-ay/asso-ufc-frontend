'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { events, collectes, ApiError } from '@/lib/api'
import { useAuth } from '@/providers/AuthProvider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { MapPin, Users, Ticket, Heart, HandCoins, Plus, Pencil, X, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EventRead } from '@/lib/types'

// Les événements terminés/annulés vivent dans /historique — cette page ne
// montre que ce qui reste à gérer, pour éviter la double liste.
const STATUS_TABS = [
  { value: '',          label: 'Tous' },
  { value: 'published', label: 'Publiés' },
  { value: 'draft',     label: 'Brouillons' },
]

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  draft:     { label: 'Brouillon', className: 'bg-gray-100 text-gray-500 border-gray-200' },
  published: { label: 'Publié',    className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Annulé',   className: 'bg-red-50 text-red-600 border-red-200' },
  completed: { label: 'Terminé',  className: 'bg-purple-50 text-purple-600 border-purple-200' },
}

const COLLECTE_STATUS_BADGE: Record<string, string> = {
  upcoming: 'text-[10px] border bg-blue-50 text-blue-600 border-blue-200',
  active:   'text-[10px] border bg-emerald-50 text-emerald-700 border-emerald-200',
}

const MONTH_FR = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc']

const FIELD = 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-[#6366F1]'

function fmtEur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function daysLeft(endDate: string) {
  const diff = new Date(endDate).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

const EMPTY_CREATE = {
  title:        '',
  event_date:   new Date(Date.now() + 86400000).toISOString().split('T')[0],
  location:     '',
  description:  '',
  capacity:     '',
  ticket_price: '0',
}

type EditForm = typeof EMPTY_CREATE & { status: string }

export default function EvenementsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [statusFilter, setStatusFilter] = useState('')

  const [createOpen, setCreateOpen]   = useState(false)
  const [createForm, setCreateForm]   = useState(EMPTY_CREATE)
  const [createError, setCreateError] = useState<string | null>(null)

  const [editTarget, setEditTarget] = useState<EventRead | null>(null)
  const [editForm, setEditForm]     = useState<EditForm>({ ...EMPTY_CREATE, status: 'draft' })
  const [editError, setEditError]   = useState<string | null>(null)

  const [cancelTarget, setCancelTarget] = useState<EventRead | null>(null)

  const canWrite = user?.roles.some(r => ['super_admin', 'secretary'].includes(r))
  const canAdmin = user?.roles.some(r => ['super_admin'].includes(r))

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['events', statusFilter],
    queryFn: () => events.list({ status: statusFilter || undefined }),
  })

  // Onglet "Tous" : n'affiche que ce qui reste actionnable (terminés/annulés → /historique)
  const visibleEvents = statusFilter
    ? data
    : data?.filter(ev => ev.status !== 'completed' && ev.status !== 'cancelled')

  const { data: allCollectes } = useQuery({
    queryKey: ['collectes'],
    queryFn: () => collectes.list(),
  })
  const activeCollectes = allCollectes?.filter(c => c.status === 'active' || c.status === 'upcoming')

  // ── Mutations ────────────────────────────────────────────────────────────
  const { mutate: create, isPending: creating } = useMutation({
    mutationFn: events.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      setCreateOpen(false)
      setCreateForm(EMPTY_CREATE)
      setCreateError(null)
    },
    onError: (err: unknown) => setCreateError(err instanceof ApiError ? err.message : 'Erreur inattendue'),
  })

  const { mutate: update, isPending: updating } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof events.update>[1] }) =>
      events.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      setEditTarget(null)
      setEditError(null)
    },
    onError: (err: unknown) => setEditError(err instanceof ApiError ? err.message : 'Erreur inattendue'),
  })

  const { mutate: cancelEvent, isPending: cancelling } = useMutation({
    mutationFn: (id: string) => events.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      setCancelTarget(null)
    },
  })

  // ── Handlers ─────────────────────────────────────────────────────────────
  function openEdit(ev: EventRead) {
    setEditTarget(ev)
    setEditForm({
      title:        ev.title,
      event_date:   ev.event_date,
      location:     ev.location ?? '',
      description:  ev.description ?? '',
      capacity:     ev.capacity ? String(ev.capacity) : '',
      ticket_price: String(ev.ticket_price),
      status:       ev.status,
    })
    setEditError(null)
  }

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setCreateError(null)
    create({
      title:        createForm.title,
      event_date:   createForm.event_date,
      location:     createForm.location || undefined,
      description:  createForm.description || undefined,
      capacity:     createForm.capacity ? Number(createForm.capacity) : undefined,
      ticket_price: Number(createForm.ticket_price) || 0,
    })
  }

  function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editTarget) return
    setEditError(null)
    update({
      id: editTarget.id,
      data: {
        title:        editForm.title || undefined,
        event_date:   editForm.event_date || undefined,
        location:     editForm.location || undefined,
        description:  editForm.description || undefined,
        capacity:     editForm.capacity ? Number(editForm.capacity) : undefined,
        ticket_price: Number(editForm.ticket_price),
        status:       editForm.status || undefined,
      },
    })
  }

  function cf(key: keyof typeof EMPTY_CREATE) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setCreateForm(f => ({ ...f, [key]: e.target.value }))
  }

  function ef(key: keyof EditForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setEditForm(f => ({ ...f, [key]: e.target.value }))
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Événements</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {visibleEvents ? `${visibleEvents.length} événement${visibleEvents.length > 1 ? 's' : ''}` : '—'}
          </p>
        </div>
        {canWrite && (
          <Button
            onClick={() => { setCreateOpen(true); setCreateError(null) }}
            className="bg-[#6366F1] hover:bg-[#4F46E5] text-white gap-1.5 shrink-0"
          >
            <Plus size={14} />
            Nouvel événement
          </Button>
        )}
      </div>

      {/* Widget collectes actives */}
      {activeCollectes && activeCollectes.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Heart size={13} className="text-[#6366F1]" />
            <h2 className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
              Annonces en cours
            </h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {activeCollectes.map(c => {
              const remaining = daysLeft(c.end_date)
              return (
                <Link
                  key={c.id}
                  href={`/collectes/${c.id}`}
                  className="shrink-0 w-56 bg-white rounded-xl border border-[rgba(99,102,241,0.15)] shadow-sm p-4 hover:border-[rgba(99,102,241,0.35)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full shrink-0 overflow-hidden bg-indigo-50 flex items-center justify-center">
                      {c.photo_url
                        ? <img src={c.photo_url} alt={c.beneficiary_name} className="w-full h-full object-cover" />
                        : <Heart size={16} className="text-[#6366F1]" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{c.title}</p>
                      <p className="text-[10px] text-slate-400 truncate">{c.beneficiary_name}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-[#6366F1] font-semibold">
                      <HandCoins size={11} />
                      {fmtEur(c.total_collected)}
                    </div>
                    {c.status === 'active' ? (
                      <span className="text-[10px] text-slate-400">
                        {remaining}j restant{remaining > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${COLLECTE_STATUS_BADGE[c.status] ?? ''}`}>
                        À venir
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Filtres */}
      <div className="flex gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1 w-fit">
        {STATUS_TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setStatusFilter(t.value)}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              statusFilter === t.value
                ? 'bg-indigo-100 text-[#6366F1]'
                : 'text-slate-500 hover:text-slate-800',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Liste événements */}
      <div className="space-y-3">
        {isLoading && (
          <div className="py-12 text-center text-slate-400 text-sm">Chargement…</div>
        )}
        {!isLoading && visibleEvents?.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-sm">Aucun événement</div>
        )}
        {visibleEvents?.map(ev => {
          const d = new Date(ev.event_date)
          const st = STATUS_LABEL[ev.status] ?? { label: ev.status, className: 'bg-gray-100 text-gray-500 border-gray-200' }
          const capacityFull = ev.capacity != null && ev.registrations_count >= ev.capacity
          return (
            <div
              key={ev.id}
              className="bg-white rounded-xl border border-[rgba(99,102,241,0.15)] shadow-sm p-5 flex gap-5 hover:border-[rgba(99,102,241,0.30)] transition-colors"
            >
              <div className="text-center w-12 shrink-0 pt-0.5">
                <p className="text-2xl font-bold text-[#6366F1] leading-none">{d.getDate()}</p>
                <p className="text-[10px] text-slate-400 uppercase mt-0.5">{MONTH_FR[d.getMonth()]}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{d.getFullYear()}</p>
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <h3 className="text-sm font-semibold text-slate-800">{ev.title}</h3>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge className={`text-[10px] border ${st.className}`}>{st.label}</Badge>
                    {canWrite && ev.status !== 'cancelled' && (
                      <button
                        onClick={() => openEdit(ev)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-[#6366F1] hover:bg-indigo-50 transition-colors"
                        title="Modifier"
                      >
                        <Pencil size={12} />
                      </button>
                    )}
                    {canAdmin && ev.status !== 'cancelled' && (
                      <button
                        onClick={() => setCancelTarget(ev)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Annuler l'événement"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>
                {ev.description && (
                  <p className="text-xs text-slate-500 line-clamp-2">{ev.description}</p>
                )}
                <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                  {ev.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin size={11} className="text-[#6366F1]" />
                      {ev.location}
                    </div>
                  )}
                  <div className={cn('flex items-center gap-1.5', capacityFull && 'text-amber-600')}>
                    <Users size={11} className={capacityFull ? 'text-amber-500' : 'text-[#6366F1]'} />
                    {ev.registrations_count} inscrit{ev.registrations_count > 1 ? 's' : ''}
                    {ev.capacity && ` / ${ev.capacity}`}
                    {capacityFull && ' · Complet'}
                  </div>
                  {ev.ticket_price > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Ticket size={11} className="text-[#6366F1]" />
                      {fmtEur(ev.ticket_price)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Modale création ─────────────────────────────────────────────────── */}
      <Dialog open={createOpen} onOpenChange={open => { if (!open) { setCreateOpen(false); setCreateForm(EMPTY_CREATE); setCreateError(null) } }}>
        <DialogContent className="bg-white border-[rgba(99,102,241,0.15)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-800">Nouvel événement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-1">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500">Titre *</label>
              <Input value={createForm.title} onChange={cf('title')} required placeholder="Tournoi de judo — juin 2026" className={FIELD} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500">Date *</label>
              <Input type="date" value={createForm.event_date} onChange={cf('event_date')} required className={FIELD} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500">Lieu <span className="text-slate-400">(optionnel)</span></label>
              <Input value={createForm.location} onChange={cf('location')} placeholder="Salle Mboka, Bordeaux" className={FIELD} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500">Description <span className="text-slate-400">(optionnel)</span></label>
              <textarea
                value={createForm.description}
                onChange={cf('description')}
                rows={3}
                placeholder="Décrivez l'événement…"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#6366F1] resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-500">Capacité max</label>
                <Input type="number" min={1} value={createForm.capacity} onChange={cf('capacity')} placeholder="—" className={FIELD} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-500">Prix billet (€)</label>
                <Input type="number" min={0} step="0.01" value={createForm.ticket_price} onChange={cf('ticket_price')} className={FIELD} />
              </div>
            </div>
            <p className="text-xs text-slate-400">L'événement sera créé en brouillon. Publiez-le depuis la liste pour ouvrir les inscriptions.</p>
            {createError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{createError}</p>
            )}
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} className="border-slate-200 text-slate-500 bg-transparent">Annuler</Button>
              <Button type="submit" disabled={creating} className="bg-[#6366F1] hover:bg-[#4F46E5] text-white">
                {creating ? 'Création…' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Modale édition ──────────────────────────────────────────────────── */}
      <Dialog open={!!editTarget} onOpenChange={open => { if (!open) setEditTarget(null) }}>
        <DialogContent className="bg-white border-[rgba(99,102,241,0.15)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-800">Modifier l'événement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 mt-1">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500">Titre *</label>
              <Input value={editForm.title} onChange={ef('title')} required className={FIELD} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500">Date *</label>
              <Input type="date" value={editForm.event_date} onChange={ef('event_date')} required className={FIELD} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500">Lieu</label>
              <Input value={editForm.location} onChange={ef('location')} className={FIELD} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500">Description</label>
              <textarea
                value={editForm.description}
                onChange={ef('description')}
                rows={3}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#6366F1] resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-500">Capacité max</label>
                <Input type="number" min={1} value={editForm.capacity} onChange={ef('capacity')} placeholder="—" className={FIELD} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-500">Prix billet (€)</label>
                <Input type="number" min={0} step="0.01" value={editForm.ticket_price} onChange={ef('ticket_price')} className={FIELD} />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500">Statut</label>
              <select
                value={editForm.status}
                onChange={ef('status')}
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-[#6366F1]"
              >
                <option value="draft">Brouillon</option>
                <option value="published">Publié</option>
                <option value="completed">Terminé</option>
              </select>
            </div>
            {editError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{editError}</p>
            )}
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setEditTarget(null)} className="border-slate-200 text-slate-500 bg-transparent">Annuler</Button>
              <Button type="submit" disabled={updating} className="bg-[#6366F1] hover:bg-[#4F46E5] text-white">
                {updating ? 'Sauvegarde…' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Confirmation annulation ─────────────────────────────────────────── */}
      <Dialog open={!!cancelTarget} onOpenChange={open => { if (!open) setCancelTarget(null) }}>
        <DialogContent className="bg-white border-[rgba(99,102,241,0.15)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-slate-800 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              Annuler l'événement
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500 mt-1">
            L'événement <span className="font-semibold text-slate-800">"{cancelTarget?.title}"</span> sera marqué comme annulé. Cette action est irréversible.
          </p>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setCancelTarget(null)} className="border-slate-200 text-slate-500 bg-transparent">Retour</Button>
            <Button
              disabled={cancelling}
              onClick={() => cancelTarget && cancelEvent(cancelTarget.id)}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {cancelling ? 'Annulation…' : "Confirmer l'annulation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
