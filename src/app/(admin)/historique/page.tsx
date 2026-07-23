'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { collectes, events } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Heart, Users, MapPin, Ticket, Archive, CalendarCheck, HandCoins } from 'lucide-react'
import { cn } from '@/lib/utils'
import { categoryLabel, categoryPrefix } from '@/lib/collecte-categories'

// ── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: '',          label: 'Toutes catégories' },
  { value: 'deces',     label: 'Décès' },
  { value: 'mariage',   label: 'Mariage' },
  { value: 'naissance', label: 'Naissance' },
  { value: 'maladie',   label: 'Maladie' },
  { value: 'autre',     label: 'Autre' },
]

const EVENT_STATUS_LABEL: Record<string, { label: string; className: string }> = {
  completed: { label: 'Terminé',  className: 'bg-purple-50 text-purple-600 border-purple-200' },
  cancelled: { label: 'Annulé',  className: 'bg-red-50 text-red-600 border-red-200' },
}

const MONTH_FR = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc']

const SELECT_CLS = 'rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#6366F1]'

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtEur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function yearOf(iso: string) {
  return new Date(iso).getFullYear()
}

function uniqueYears(dates: string[]) {
  return [...new Set(dates.map(yearOf))].sort((a, b) => b - a)
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function HistoriquePage() {
  const [tab, setTab] = useState<'collectes' | 'evenements'>('collectes')

  const [collecteYear,     setCollecteYear]     = useState('')
  const [collecteCategory, setCollecteCategory] = useState('')
  const [eventYear,        setEventYear]        = useState('')
  const [eventStatus,      setEventStatus]      = useState('')

  // ── Data ───────────────────────────────────────────────────────────────────
  const { data: allCollectes, isLoading: loadingC } = useQuery({
    queryKey: ['collectes', 'all'],
    queryFn: () => collectes.list({ include_archived: true }),
  })

  const { data: allEvents, isLoading: loadingE } = useQuery({
    queryKey: ['events', 'all'],
    queryFn: () => events.list(),
  })

  const archived = allCollectes?.filter(c => c.is_archived) ?? []
  const finished = allEvents?.filter(e => e.status === 'completed' || e.status === 'cancelled') ?? []

  // ── Filters ────────────────────────────────────────────────────────────────
  const filteredCollectes = archived
    .filter(c => !collecteYear     || yearOf(c.end_date) === Number(collecteYear))
    .filter(c => !collecteCategory || c.category === collecteCategory)

  const filteredEvents = finished
    .filter(e => !eventYear   || yearOf(e.event_date) === Number(eventYear))
    .filter(e => !eventStatus || e.status === eventStatus)

  // ── Year options ───────────────────────────────────────────────────────────
  const collecteYears = uniqueYears(archived.map(c => c.end_date))
  const eventYears    = uniqueYears(finished.map(e => e.event_date))

  // ── Global stats ───────────────────────────────────────────────────────────
  const totalCollecte = archived.reduce((s, c) => s + Number(c.total_collected), 0)

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Historique</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Archives des collectes et événements passés
        </p>
      </div>

      {/* Stats globales */}
      {(archived.length > 0 || finished.length > 0) && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-[rgba(99,102,241,0.15)] shadow-sm p-4 text-center">
            <p className="text-xl font-bold text-[#6366F1]">{fmtEur(totalCollecte)}</p>
            <p className="text-xs text-slate-400 mt-1">Total collecté (toutes collectes)</p>
          </div>
          <div className="bg-white rounded-xl border border-[rgba(99,102,241,0.15)] shadow-sm p-4 text-center">
            <p className="text-xl font-bold text-slate-800">{archived.length}</p>
            <p className="text-xs text-slate-400 mt-1">Collecte{archived.length > 1 ? 's' : ''} archivée{archived.length > 1 ? 's' : ''}</p>
          </div>
          <div className="bg-white rounded-xl border border-[rgba(99,102,241,0.15)] shadow-sm p-4 text-center">
            <p className="text-xl font-bold text-slate-800">{finished.length}</p>
            <p className="text-xs text-slate-400 mt-1">Événement{finished.length > 1 ? 's' : ''} terminé{finished.length > 1 ? 's' : ''}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-50 border border-slate-200 rounded-lg p-1 w-fit">
        {([
          { value: 'collectes',  label: 'Collectes archivées' },
          { value: 'evenements', label: 'Événements terminés' },
        ] as const).map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              'px-4 py-1.5 rounded-md text-xs font-medium transition-colors',
              tab === t.value
                ? 'bg-indigo-100 text-[#6366F1]'
                : 'text-slate-500 hover:text-slate-800',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab Collectes ──────────────────────────────────────────────────── */}
      {tab === 'collectes' && (
        <div className="space-y-4">
          {/* Filters */}
          {archived.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <select value={collecteYear} onChange={e => setCollecteYear(e.target.value)} className={SELECT_CLS}>
                <option value="">Toutes les années</option>
                {collecteYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={collecteCategory} onChange={e => setCollecteCategory(e.target.value)} className={SELECT_CLS}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              {(collecteYear || collecteCategory) && (
                <button
                  onClick={() => { setCollecteYear(''); setCollecteCategory('') }}
                  className="text-xs text-slate-400 hover:text-slate-800 transition-colors px-2"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          )}

          {/* Empty */}
          {loadingC && (
            <div className="py-16 text-center text-slate-400 text-sm">Chargement…</div>
          )}
          {!loadingC && archived.length === 0 && (
            <div className="py-16 text-center space-y-3">
              <Archive size={36} className="mx-auto text-indigo-200" />
              <p className="text-sm text-slate-400">Aucune collecte archivée pour le moment</p>
              <p className="text-xs text-slate-400">Les collectes clôturées et archivées apparaîtront ici</p>
            </div>
          )}
          {!loadingC && archived.length > 0 && filteredCollectes.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-sm">Aucun résultat pour ces filtres</div>
          )}

          {/* List */}
          <div className="space-y-3">
            {filteredCollectes.map(c => (
              <div
                key={c.id}
                className="bg-white rounded-xl border border-[rgba(99,102,241,0.15)] shadow-sm p-5 flex gap-4"
              >
                {/* Photo */}
                <div className="w-12 h-12 rounded-full shrink-0 overflow-hidden bg-indigo-50 flex items-center justify-center">
                  {c.photo_url
                    ? <img src={c.photo_url} alt={c.beneficiary_name} className="w-full h-full object-cover" />
                    : <Heart size={18} className="text-[#6366F1]" />
                  }
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-800">{c.title}</p>
                    {c.category && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-[#6366F1] border border-[rgba(99,102,241,0.2)]">
                        {categoryLabel(c.category)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{categoryPrefix(c.category)} {c.beneficiary_name}</p>
                  <p className="text-[11px] text-slate-400">
                    {fmtDate(c.start_date)} → {fmtDate(c.end_date)}
                    {c.archived_at && (
                      <span className="ml-2 text-violet-400">· Archivé le {fmtDate(c.archived_at)}</span>
                    )}
                  </p>
                </div>

                {/* Stats */}
                <div className="text-right shrink-0 space-y-1.5">
                  <div className="flex items-center gap-1 justify-end text-[#6366F1]">
                    <HandCoins size={13} />
                    <p className="text-base font-bold">{fmtEur(Number(c.total_collected))}</p>
                  </div>
                  <div className="flex items-center gap-1 justify-end text-xs text-slate-400">
                    <Users size={11} className="text-[#6366F1]" />
                    {c.contributors_count} contributeur{c.contributors_count > 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary for filtered results */}
          {filteredCollectes.length > 1 && (
            <div className="text-right text-sm text-slate-500 border-t border-slate-100 pt-3">
              Total affiché :{' '}
              <span className="font-semibold text-[#6366F1]">
                {fmtEur(filteredCollectes.reduce((s, c) => s + Number(c.total_collected), 0))}
              </span>
              {' '}· {filteredCollectes.length} collecte{filteredCollectes.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}

      {/* ── Tab Événements ─────────────────────────────────────────────────── */}
      {tab === 'evenements' && (
        <div className="space-y-4">
          {/* Filters */}
          {finished.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              <select value={eventYear} onChange={e => setEventYear(e.target.value)} className={SELECT_CLS}>
                <option value="">Toutes les années</option>
                {eventYears.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={eventStatus} onChange={e => setEventStatus(e.target.value)} className={SELECT_CLS}>
                <option value="">Tous les statuts</option>
                <option value="completed">Terminés</option>
                <option value="cancelled">Annulés</option>
              </select>
              {(eventYear || eventStatus) && (
                <button
                  onClick={() => { setEventYear(''); setEventStatus('') }}
                  className="text-xs text-slate-400 hover:text-slate-800 transition-colors px-2"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          )}

          {/* Empty */}
          {loadingE && (
            <div className="py-16 text-center text-slate-400 text-sm">Chargement…</div>
          )}
          {!loadingE && finished.length === 0 && (
            <div className="py-16 text-center space-y-3">
              <CalendarCheck size={36} className="mx-auto text-indigo-200" />
              <p className="text-sm text-slate-400">Aucun événement terminé pour le moment</p>
              <p className="text-xs text-slate-400">Les événements marqués "Terminé" ou "Annulé" apparaîtront ici</p>
            </div>
          )}
          {!loadingE && finished.length > 0 && filteredEvents.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-sm">Aucun résultat pour ces filtres</div>
          )}

          {/* List */}
          <div className="space-y-3">
            {filteredEvents.map(ev => {
              const d = new Date(ev.event_date)
              const st = EVENT_STATUS_LABEL[ev.status]
              return (
                <div
                  key={ev.id}
                  className="bg-white rounded-xl border border-[rgba(99,102,241,0.15)] shadow-sm p-5 flex gap-5"
                >
                  {/* Date block */}
                  <div className="text-center w-12 shrink-0 pt-0.5">
                    <p className="text-2xl font-bold text-[#6366F1] leading-none">{d.getDate()}</p>
                    <p className="text-[10px] text-slate-400 uppercase mt-0.5">{MONTH_FR[d.getMonth()]}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{d.getFullYear()}</p>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-800">{ev.title}</p>
                      {st && (
                        <Badge className={`text-[10px] border ${st.className}`}>{st.label}</Badge>
                      )}
                    </div>
                    {ev.description && (
                      <p className="text-xs text-slate-500 line-clamp-1">{ev.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                      {ev.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin size={11} className="text-[#6366F1]" />
                          {ev.location}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Users size={11} className="text-[#6366F1]" />
                        {ev.registrations_count} inscrit{ev.registrations_count > 1 ? 's' : ''}
                      </div>
                      {ev.ticket_price > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Ticket size={11} className="text-[#6366F1]" />
                          {fmtEur(Number(ev.ticket_price))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
