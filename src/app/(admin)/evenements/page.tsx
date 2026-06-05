'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { events } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { MapPin, Users, Ticket } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_TABS = [
  { value: '',          label: 'Tous' },
  { value: 'published', label: 'Publiés' },
  { value: 'draft',     label: 'Brouillons' },
  { value: 'completed', label: 'Terminés' },
  { value: 'cancelled', label: 'Annulés' },
]

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  draft:     { label: 'Brouillon', className: 'bg-zinc-800 text-zinc-400 border-zinc-700' },
  published: { label: 'Publié',    className: 'bg-emerald-900/40 text-emerald-400 border-emerald-800/50' },
  cancelled: { label: 'Annulé',   className: 'bg-red-900/40 text-red-400 border-red-800/50' },
  completed: { label: 'Terminé',  className: 'bg-purple-900/40 text-purple-400 border-purple-800/50' },
}

const MONTH_FR = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc']

function fmtEur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

export default function EvenementsPage() {
  const [status, setStatus] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['events', status],
    queryFn: () => events.list({ status: status || undefined }),
  })

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Événements</h1>
        <p className="text-sm text-[#888] mt-0.5">
          {data ? `${data.length} événement${data.length > 1 ? 's' : ''}` : '—'}
        </p>
      </div>

      <div className="flex gap-1 bg-[#1e1e1e] border border-[rgba(255,255,255,0.08)] rounded-lg p-1 w-fit">
        {STATUS_TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setStatus(t.value)}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              status === t.value
                ? 'bg-[#C8A96E]/15 text-[#C8A96E]'
                : 'text-[#666] hover:text-[#aaa]',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {isLoading && (
          <div className="py-12 text-center text-[#555] text-sm">Chargement…</div>
        )}
        {!isLoading && data?.length === 0 && (
          <div className="py-12 text-center text-[#555] text-sm">Aucun événement</div>
        )}
        {data?.map(ev => {
          const d = new Date(ev.event_date)
          const st = STATUS_LABEL[ev.status] ?? { label: ev.status, className: 'bg-zinc-800 text-zinc-400 border-zinc-700' }
          const capacityFull = ev.capacity != null && ev.registrations_count >= ev.capacity
          return (
            <div
              key={ev.id}
              className="bg-[#1e1e1e] rounded-xl border border-[rgba(255,255,255,0.06)] p-5 flex gap-5 hover:border-[rgba(255,255,255,0.1)] transition-colors"
            >
              <div className="text-center w-12 shrink-0 pt-0.5">
                <p className="text-2xl font-bold text-[#C8A96E] leading-none">{d.getDate()}</p>
                <p className="text-[10px] text-[#555] uppercase mt-0.5">{MONTH_FR[d.getMonth()]}</p>
                <p className="text-[10px] text-[#444] mt-0.5">{d.getFullYear()}</p>
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <h3 className="text-sm font-semibold text-white">{ev.title}</h3>
                  <Badge className={`text-[10px] border shrink-0 ${st.className}`}>{st.label}</Badge>
                </div>
                {ev.description && (
                  <p className="text-xs text-[#666] line-clamp-2">{ev.description}</p>
                )}
                <div className="flex flex-wrap gap-4 text-xs text-[#555]">
                  {ev.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin size={11} className="text-[#C8A96E]" />
                      {ev.location}
                    </div>
                  )}
                  <div className={cn('flex items-center gap-1.5', capacityFull && 'text-amber-500')}>
                    <Users size={11} className={capacityFull ? 'text-amber-500' : 'text-[#C8A96E]'} />
                    {ev.registrations_count} inscrit{ev.registrations_count > 1 ? 's' : ''}
                    {ev.capacity && ` / ${ev.capacity}`}
                    {capacityFull && ' · Complet'}
                  </div>
                  {ev.ticket_price > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Ticket size={11} className="text-[#C8A96E]" />
                      {fmtEur(ev.ticket_price)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
