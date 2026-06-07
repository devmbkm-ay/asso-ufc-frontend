'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { events, ApiError } from '@/lib/api'
import { useAuth } from '@/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import {
  Calendar, MapPin, Users, Ticket, CheckCircle2, AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function fmtAmount(n: number) {
  if (n === 0) return 'Gratuit'
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

export default function EvenementsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [registeringId, setRegisteringId] = useState<string | null>(null)
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
    mutationFn: ({ eventId }: { eventId: string }) =>
      events.register(eventId, user!.id),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] })
      queryClient.invalidateQueries({ queryKey: ['events-published'] })
      setRegisteringId(null)
      setErrors(prev => { const n = { ...prev }; delete n[eventId]; return n })
    },
    onError: (err: unknown, { eventId }) => {
      setErrors(prev => ({
        ...prev,
        [eventId]: err instanceof ApiError ? err.message : 'Erreur inattendue',
      }))
    },
  })

  const { mutate: unregister } = useMutation({
    mutationFn: ({ eventId, regId }: { eventId: string; regId: string }) =>
      events.unregister(eventId, regId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] })
      queryClient.invalidateQueries({ queryKey: ['events-published'] })
    },
    onError: (err: unknown, { eventId }) => {
      setErrors(prev => ({
        ...prev,
        [eventId]: err instanceof ApiError ? err.message : 'Erreur inattendue',
      }))
    },
  })

  const now   = new Date()
  const past  = eventsList?.filter(e => new Date(e.event_date) < now) ?? []
  const upcoming = eventsList?.filter(e => new Date(e.event_date) >= now) ?? []

  const renderEvent = (e: import('@/lib/types').EventRead) => {
    const reg     = regsByEvent.get(e.id)
    const isPast  = new Date(e.event_date) < now
    const isFull  = e.capacity !== null && e.capacity !== undefined && e.registrations_count >= e.capacity

    return (
      <div
        key={e.id}
        className={cn(
          'bg-white rounded-xl border shadow-sm p-5 space-y-4',
          isPast
            ? 'border-[rgba(0,0,0,0.08)] opacity-75'
            : 'border-[rgba(200,169,110,0.18)]',
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Calendar size={16} className="text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1a1a1a]">{e.title}</p>
              <p className="text-xs text-[#9B928B] mt-0.5 capitalize">{fmtDate(e.event_date)}</p>
            </div>
          </div>

          {reg && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 shrink-0">
              <CheckCircle2 size={9} /> Inscrit
            </span>
          )}
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-4 text-xs text-[#6B6560]">
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
          <p className="text-sm text-[#6B6560] leading-relaxed line-clamp-2">{e.description}</p>
        )}

        {/* Error */}
        {errors[e.id] && (
          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle size={12} />
            {errors[e.id]}
          </div>
        )}

        {/* Actions */}
        {!isPast && (
          <div className="pt-1">
            {reg ? (
              <button
                onClick={() => unregister({ eventId: e.id, regId: reg.id })}
                className="text-xs text-[#9B928B] hover:text-red-500 transition-colors underline underline-offset-2"
              >
                Se désinscrire
              </button>
            ) : isFull ? (
              <span className="text-xs text-[#B0A9A2]">Complet</span>
            ) : (
              <Button
                size="sm"
                onClick={() => {
                  setRegisteringId(e.id)
                  register({ eventId: e.id })
                }}
                disabled={registeringId === e.id || loadingRegs}
                className="bg-[#2D5016] hover:bg-[#3a6b1e] text-white gap-1.5"
              >
                <CheckCircle2 size={13} />
                {registeringId === e.id ? 'Inscription…' : "S'inscrire"}
              </Button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#1a1a1a]">Événements</h1>
        <p className="text-sm text-[#6B6560] mt-1">
          {isLoading ? '—' : `${eventsList?.length ?? 0} événement${(eventsList?.length ?? 0) > 1 ? 's' : ''}`}
        </p>
      </div>

      {isLoading && (
        <div className="py-12 text-center text-sm text-[#9B928B]">Chargement…</div>
      )}

      {!isLoading && eventsList?.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-[#F0EBE2] flex items-center justify-center">
            <Calendar size={20} className="text-[#B0A9A2]" />
          </div>
          <p className="text-sm text-[#9B928B]">Aucun événement à venir pour le moment</p>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-3">
          {upcoming.map(renderEvent)}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-[#B0A9A2] tracking-wider uppercase">Passés</p>
          {past.map(renderEvent)}
        </div>
      )}
    </div>
  )
}
