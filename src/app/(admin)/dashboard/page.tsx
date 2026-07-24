'use client'

import { useQuery } from '@tanstack/react-query'
import { dashboard, members, events } from '@/lib/api'
import { useAuth } from '@/providers/AuthProvider'
import { KpiCard } from '@/components/admin/KpiCard'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CalendarDays, Users, MapPin, ChevronRight } from 'lucide-react'
import { avatarColor, cn } from '@/lib/utils'

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  active:    { label: 'Actif',      className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  inactive:  { label: 'Inactif',    className: 'bg-gray-100 text-gray-500 border-gray-200' },
  suspended: { label: 'Suspendu',   className: 'bg-red-50 text-red-600 border-red-200' },
  honorary:  { label: 'Honoraire',  className: 'bg-purple-50 text-purple-600 border-purple-200' },
}

const MONTH_FR = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc']

function fmtEur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export default function DashboardPage() {
  const { user } = useAuth()
  const today = new Date()

  const { data: kpis }    = useQuery({ queryKey: ['dashboard'], queryFn: dashboard.treasurer })
  const { data: membersData } = useQuery({
    queryKey: ['members', 'recent'],
    queryFn: () => members.list({ page: 1, size: 5 }),
  })
  const { data: publishedEvents } = useQuery({
    queryKey: ['events', 'published'],
    queryFn: () => events.list({ status: 'published' }),
  })

  const upcoming = [...(publishedEvents ?? [])]
    .filter(ev => new Date(ev.event_date) >= startOfToday())
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())

  const featuredEvent = upcoming[0]
  const otherUpcoming = upcoming.slice(1, 4)
  const isToday = featuredEvent && isSameDay(new Date(featuredEvent.event_date), new Date())

  const greeting = today.getHours() < 12 ? 'Bonjour' : today.getHours() < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">
          {greeting}, {user?.first_name} 👋
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          {today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Événement en avant */}
      {!publishedEvents ? (
        <div className="bg-white rounded-xl border border-[rgba(99,102,241,0.15)] shadow-sm p-5">
          <p className="text-sm text-slate-400">Chargement…</p>
        </div>
      ) : featuredEvent ? (
        <div className="bg-white rounded-xl border border-[rgba(99,102,241,0.15)] shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-14 h-14 rounded-xl bg-indigo-50 flex flex-col items-center justify-center shrink-0">
              <span className="text-xl font-bold text-[#6366F1] leading-none">{new Date(featuredEvent.event_date).getDate()}</span>
              <span className="text-[10px] font-medium text-[#6366F1] uppercase mt-0.5">{MONTH_FR[new Date(featuredEvent.event_date).getMonth()]}</span>
            </div>
            <div className="min-w-0">
              <Badge className={cn(
                'text-[10px] border mb-1.5',
                isToday ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-indigo-50 text-[#6366F1] border-indigo-200',
              )}>
                {isToday ? "Aujourd'hui" : 'Prochain événement'}
              </Badge>
              <h2 className="text-sm font-semibold text-slate-800 truncate">{featuredEvent.title}</h2>
              <div className="flex flex-wrap gap-3 text-xs text-slate-400 mt-1">
                {featuredEvent.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={11} className="text-[#6366F1]" />
                    {featuredEvent.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users size={11} className="text-[#6366F1]" />
                  {featuredEvent.registrations_count} inscrit{featuredEvent.registrations_count > 1 ? 's' : ''}
                  {featuredEvent.capacity && ` / ${featuredEvent.capacity}`}
                </span>
              </div>
            </div>
          </div>
          <a
            href="/evenements"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#6366F1] hover:text-[#4F46E5] shrink-0 self-start sm:self-center"
          >
            Gérer <ChevronRight size={13} />
          </a>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[rgba(99,102,241,0.15)] shadow-sm p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
              <CalendarDays size={16} className="text-[#6366F1]" />
            </div>
            <p className="text-sm text-slate-400">Aucun événement publié pour le moment</p>
          </div>
          <a href="/evenements" className="inline-flex items-center gap-1 text-xs font-medium text-[#6366F1] hover:text-[#4F46E5] shrink-0">
            Voir les événements <ChevronRight size={13} />
          </a>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Membres actifs"
          value={kpis?.active_members ?? '—'}
          sub={`${kpis?.total_members ?? '—'} au total`}
        />
        <KpiCard
          label={`Cotisations ${MONTH_FR[today.getMonth()]}`}
          value={kpis ? fmtEur(kpis.revenue_this_month) : '—'}
          sub={`${kpis?.paid_this_month ?? '—'} paiements`}
          accent
        />
        <KpiCard
          label="En retard"
          value={kpis?.unpaid_this_month ?? '—'}
          sub="membres sans paiement"
        />
        <KpiCard
          label="En attente"
          value={kpis?.pending_count ?? '—'}
          sub="paiements à confirmer"
          href="/cotisations"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Derniers membres */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[rgba(99,102,241,0.15)] shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={15} className="text-[#6366F1]" />
              <h2 className="text-sm font-semibold text-slate-800">Derniers membres</h2>
            </div>
            <a href="/membres" className="text-xs text-[#6366F1] hover:underline">Voir tous</a>
          </div>
          <ul className="space-y-3">
            {membersData?.items.map(m => {
              const st = STATUS_LABEL[m.status]
              return (
                <li key={m.id} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${avatarColor(m.first_name + m.last_name)}`}>
                    <span className="text-xs font-semibold">
                      {m.first_name[0]}{m.last_name[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {m.first_name} {m.last_name}
                    </p>
                    <p className="text-xs text-slate-400">Inscrit le {fmtDate(m.joined_at)}</p>
                  </div>
                  <Badge className={`text-[10px] border ${st.className}`}>{st.label}</Badge>
                </li>
              )
            })}
            {!membersData && (
              <li className="text-sm text-slate-400 text-center py-4">Chargement…</li>
            )}
          </ul>
        </div>

        {/* Événements + Alertes */}
        <div className="space-y-4">
          {kpis && kpis.unpaid_this_month > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-600" />
                <p className="text-xs font-semibold text-amber-700">Alertes</p>
              </div>
              <p className="text-xs text-amber-600">
                {kpis.unpaid_this_month} membre{kpis.unpaid_this_month > 1 ? 's' : ''} sans cotisation ce mois
              </p>
            </div>
          )}

          <div className="bg-white rounded-xl border border-[rgba(99,102,241,0.15)] shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays size={15} className="text-[#6366F1]" />
              <h2 className="text-sm font-semibold text-slate-800">Événements à venir</h2>
            </div>
            <ul className="space-y-3">
              {otherUpcoming.map(ev => {
                const d = new Date(ev.event_date)
                return (
                  <li key={ev.id} className="flex gap-3">
                    <div className="text-center w-10 shrink-0">
                      <p className="text-lg font-bold text-[#6366F1] leading-none">{d.getDate()}</p>
                      <p className="text-[10px] text-slate-400 uppercase">{MONTH_FR[d.getMonth()]}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-800 truncate">{ev.title}</p>
                      <p className="text-xs text-slate-400">{ev.registrations_count} inscrits</p>
                    </div>
                  </li>
                )
              })}
              {publishedEvents && otherUpcoming.length === 0 && (
                <li className="text-xs text-slate-400">
                  {featuredEvent ? 'Aucun autre événement à venir' : 'Aucun événement à venir'}
                </li>
              )}
              {!publishedEvents && (
                <li className="text-xs text-slate-400">Chargement…</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
