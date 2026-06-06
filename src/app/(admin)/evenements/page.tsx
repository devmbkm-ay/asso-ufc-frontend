'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { events, collectes } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { MapPin, Users, Ticket, Heart, HandCoins } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_TABS = [
  { value: '',          label: 'Tous' },
  { value: 'published', label: 'Publiés' },
  { value: 'draft',     label: 'Brouillons' },
  { value: 'completed', label: 'Terminés' },
  { value: 'cancelled', label: 'Annulés' },
]

const COLLECTE_STATUS_BADGE: Record<string, string> = {
  upcoming: 'text-[10px] border bg-blue-50 text-blue-600 border-blue-200',
  active:   'text-[10px] border bg-emerald-50 text-emerald-700 border-emerald-200',
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  draft:     { label: 'Brouillon', className: 'bg-gray-100 text-gray-500 border-gray-200' },
  published: { label: 'Publié',    className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Annulé',   className: 'bg-red-50 text-red-600 border-red-200' },
  completed: { label: 'Terminé',  className: 'bg-purple-50 text-purple-600 border-purple-200' },
}

const MONTH_FR = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc']

function fmtEur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function daysLeft(endDate: string) {
  const diff = new Date(endDate).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export default function EvenementsPage() {
  const [status, setStatus] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['events', status],
    queryFn: () => events.list({ status: status || undefined }),
  })

  const { data: allCollectes } = useQuery({
    queryKey: ['collectes'],
    queryFn: () => collectes.list(),
  })
  // Afficher upcoming + active (les annonces en cours ou à venir)
  const activeCollectes = allCollectes?.filter(c => c.status === 'active' || c.status === 'upcoming')

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#1a1a1a]">Événements</h1>
        <p className="text-sm text-[#6B6560] mt-0.5">
          {data ? `${data.length} événement${data.length > 1 ? 's' : ''}` : '—'}
        </p>
      </div>

      {/* Widget collectes actives */}
      {activeCollectes && activeCollectes.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Heart size={13} className="text-[#C8A96E]" />
            <h2 className="text-xs font-semibold tracking-widest text-[#6B6560] uppercase">
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
                  className="shrink-0 w-56 bg-white rounded-xl border border-[rgba(200,169,110,0.18)] shadow-sm p-4 hover:border-[rgba(200,169,110,0.4)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full shrink-0 overflow-hidden bg-[#F0EBE2] flex items-center justify-center">
                      {c.photo_url
                        ? <img src={c.photo_url} alt={c.beneficiary_name} className="w-full h-full object-cover" />
                        : <Heart size={16} className="text-[#C8A96E]" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#1a1a1a] truncate">{c.title}</p>
                      <p className="text-[10px] text-[#9B928B] truncate">{c.beneficiary_name}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-[#C8A96E] font-semibold">
                      <HandCoins size={11} />
                      {fmtEur(c.total_collected)}
                    </div>
                    {c.status === 'active' ? (
                      <span className="text-[10px] text-[#9B928B]">
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
      <div className="flex gap-1 bg-[#F0EBE2] border border-[rgba(0,0,0,0.08)] rounded-lg p-1 w-fit">
        {STATUS_TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setStatus(t.value)}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
              status === t.value
                ? 'bg-[#C8A96E]/20 text-[#8B6B30]'
                : 'text-[#7A726B] hover:text-[#1a1a1a]',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Liste événements */}
      <div className="space-y-3">
        {isLoading && (
          <div className="py-12 text-center text-[#9B928B] text-sm">Chargement…</div>
        )}
        {!isLoading && data?.length === 0 && (
          <div className="py-12 text-center text-[#9B928B] text-sm">Aucun événement</div>
        )}
        {data?.map(ev => {
          const d = new Date(ev.event_date)
          const st = STATUS_LABEL[ev.status] ?? { label: ev.status, className: 'bg-gray-100 text-gray-500 border-gray-200' }
          const capacityFull = ev.capacity != null && ev.registrations_count >= ev.capacity
          return (
            <div
              key={ev.id}
              className="bg-white rounded-xl border border-[rgba(200,169,110,0.18)] shadow-sm p-5 flex gap-5 hover:border-[rgba(200,169,110,0.35)] transition-colors"
            >
              <div className="text-center w-12 shrink-0 pt-0.5">
                <p className="text-2xl font-bold text-[#C8A96E] leading-none">{d.getDate()}</p>
                <p className="text-[10px] text-[#9B928B] uppercase mt-0.5">{MONTH_FR[d.getMonth()]}</p>
                <p className="text-[10px] text-[#B0A9A2] mt-0.5">{d.getFullYear()}</p>
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <h3 className="text-sm font-semibold text-[#1a1a1a]">{ev.title}</h3>
                  <Badge className={`text-[10px] border shrink-0 ${st.className}`}>{st.label}</Badge>
                </div>
                {ev.description && (
                  <p className="text-xs text-[#7A726B] line-clamp-2">{ev.description}</p>
                )}
                <div className="flex flex-wrap gap-4 text-xs text-[#9B928B]">
                  {ev.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin size={11} className="text-[#C8A96E]" />
                      {ev.location}
                    </div>
                  )}
                  <div className={cn('flex items-center gap-1.5', capacityFull && 'text-amber-600')}>
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
