'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { events, ApiError } from '@/lib/api'
import { useAuth } from '@/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Toast } from '@/components/ui/toast'
import {
  Calendar, MapPin, Users, Ticket, CheckCircle2, AlertCircle, ChevronDown, ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EventRead } from '@/lib/types'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function fmtAmount(n: number) {
  if (n === 0) return 'Gratuit'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

function RegistrantsList({ eventId }: { eventId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['event-registrations', eventId],
    queryFn: () => events.registrations(eventId),
  })

  if (isLoading) {
    return <Skeleton className="h-8 w-full" />
  }
  if (!data || data.length === 0) {
    return <EmptyState title="Aucun inscrit pour le moment" description="Les inscriptions apparaîtront ici dès qu’elles seront enregistrées." className="px-3 py-4" />
  }

  return (
    <ul className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
      {data.map(r => (
        <li key={r.id} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
          <span className="text-slate-700 truncate">{r.member_name}</span>
          <span className="text-slate-500 font-medium shrink-0">{fmtAmount(r.amount_paid)}</span>
        </li>
      ))}
    </ul>
  )
}

export default function EvenementsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [registeringId, setRegisteringId] = useState<string | null>(null)
  const [amountDraftId, setAmountDraftId] = useState<string | null>(null)
  const [amountDrafts, setAmountDrafts] = useState<Record<string, string>>({})
  const [expandedRegistrants, setExpandedRegistrants] = useState<Record<string, boolean>>({})
  const [showPast, setShowPast] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data: eventsList, isLoading } = useQuery({
    queryKey: ['events-published'],
    queryFn: () => events.list({ status: 'published' }),
  })

  const { data: myRegs, isLoading: loadingRegs } = useQuery({
    queryKey: ['my-registrations'],
    queryFn: () => events.myRegistrations(),
  })

  const regsByEvent = new Map(myRegs?.map(r => [r.event_id, r]) ?? [])

  const { mutate: register } = useMutation({
    mutationFn: ({ eventId, amount }: { eventId: string; amount: number }) =>
      events.register(eventId, user!.id, amount),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] })
      queryClient.invalidateQueries({ queryKey: ['events-published'] })
      queryClient.invalidateQueries({ queryKey: ['event-registrations', eventId] })
      setRegisteringId(null)
      setAmountDraftId(null)
      setErrors(prev => { const n = { ...prev }; delete n[eventId]; return n })
    },
    onError: (err: unknown, { eventId }) => {
      setRegisteringId(null)
      setErrors(prev => ({
        ...prev,
        [eventId]: err instanceof ApiError ? err.message : 'Erreur inattendue',
      }))
    },
  })

  const { mutate: unregister } = useMutation({
    mutationFn: ({ eventId, regId }: { eventId: string; regId: string }) =>
      events.unregister(eventId, regId),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] })
      queryClient.invalidateQueries({ queryKey: ['events-published'] })
      queryClient.invalidateQueries({ queryKey: ['event-registrations', eventId] })
    },
    onError: (err: unknown, { eventId }) => {
      setErrors(prev => ({
        ...prev,
        [eventId]: err instanceof ApiError ? err.message : 'Erreur inattendue',
      }))
    },
  })

  function startRegister(e: EventRead) {
    setAmountDraftId(e.id)
    setAmountDrafts(d => ({ ...d, [e.id]: String(e.ticket_price) }))
  }

  function confirmRegister(eventId: string) {
    setRegisteringId(eventId)
    const amount = Number(amountDrafts[eventId]) || 0
    register({ eventId, amount })
  }

  const now = new Date()
  const past = eventsList?.filter(e => new Date(e.event_date) < now) ?? []
  const upcoming = eventsList?.filter(e => new Date(e.event_date) >= now) ?? []

  const renderEvent = (e: EventRead) => {
    const reg = regsByEvent.get(e.id)
    const isPast = new Date(e.event_date) < now
    const isFull = e.capacity !== null && e.capacity !== undefined && e.registrations_count >= e.capacity
    const registrantsOpen = !!expandedRegistrants[e.id]

    return (
      <div
        key={e.id}
        className={cn(
          'bg-white rounded-xl border shadow-sm p-5 space-y-4',
          isPast
            ? 'border-slate-200 opacity-75'
            : 'border-[rgba(99,102,241,0.15)]',
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Calendar size={16} className="text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{e.title}</p>
              <p className="text-xs text-slate-400 mt-0.5 capitalize">{fmtDate(e.event_date)}</p>
            </div>
          </div>

          {reg && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 shrink-0">
              <CheckCircle2 size={9} /> Inscrit
            </span>
          )}
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
          {e.location && (
            <span className="flex items-center gap-1.5">
              <MapPin size={12} /> {e.location}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Users size={12} />
            {e.registrations_count} inscrit{e.registrations_count > 1 ? 's' : ''}
            {e.capacity && ` / ${e.capacity}`}
          </span>
          <span className="flex items-center gap-1.5">
            <Ticket size={12} /> {fmtAmount(e.ticket_price)}
          </span>
        </div>

        {e.description && (
          <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">{e.description}</p>
        )}

        {/* Error */}
        {errors[e.id] && (
          <Toast
            variant="error"
            title="Action impossible"
            description={errors[e.id]}
            closeable
            onClose={() => setErrors(prev => ({ ...prev, [e.id]: '' }))}
          />
        )}

        {/* Registrants toggle */}
        {e.registrations_count > 0 && (
          <div>
            <button
              onClick={() => setExpandedRegistrants(m => ({ ...m, [e.id]: !m[e.id] }))}
              className="flex items-center gap-1 text-xs text-[#6366F1] hover:underline"
            >
              {registrantsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {registrantsOpen ? 'Masquer les inscrits' : 'Voir les inscrits'}
            </button>
            {registrantsOpen && (
              <div className="mt-2">
                <RegistrantsList eventId={e.id} />
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {!isPast && (
          <div className="pt-1">
            {reg ? (
              <button
                onClick={() => unregister({ eventId: e.id, regId: reg.id })}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors underline underline-offset-2"
              >
                Se désinscrire
              </button>
            ) : isFull ? (
              <span className="text-xs text-slate-400">Complet</span>
            ) : amountDraftId === e.id ? (
              <div className="flex items-center gap-2">
                <div className="relative w-28">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={amountDrafts[e.id] ?? '0'}
                    onChange={ev => setAmountDrafts(d => ({ ...d, [e.id]: ev.target.value }))}
                    className="bg-white border-slate-200 text-slate-800 h-9 pr-6 text-sm"
                    autoFocus
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">€</span>
                </div>
                <Button
                  size="sm"
                  onClick={() => confirmRegister(e.id)}
                  disabled={registeringId === e.id || loadingRegs}
                  className="bg-[#6366F1] hover:bg-[#4F46E5] text-white gap-1.5"
                >
                  {registeringId === e.id ? 'Inscription…' : 'Confirmer'}
                </Button>
                <button
                  onClick={() => setAmountDraftId(null)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Annuler
                </button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => startRegister(e)}
                disabled={loadingRegs}
                className="bg-[#6366F1] hover:bg-[#4F46E5] text-white gap-1.5"
              >
                <CheckCircle2 size={13} />
                S&apos;inscrire
              </Button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Événements</h1>
        <p className="text-sm text-slate-400 mt-1">
          {isLoading ? '—' : `${eventsList?.length ?? 0} événement${(eventsList?.length ?? 0) > 1 ? 's' : ''}`}
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}

      {!isLoading && eventsList?.length === 0 && (
        <EmptyState
          title="Aucun événement à venir pour le moment"
          description="Les événements publiés apparaîtront ici dès leur ouverture."
          icon={<Calendar className="size-5" />}
        />
      )}

      {upcoming.length > 0 && (
        <div className="space-y-3">
          {upcoming.map(renderEvent)}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setShowPast(s => !s)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 tracking-wider uppercase hover:text-slate-600"
          >
            {showPast ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Passés ({past.length})
          </button>
          {showPast && (
            <div className="space-y-3">
              {past.map(renderEvent)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
