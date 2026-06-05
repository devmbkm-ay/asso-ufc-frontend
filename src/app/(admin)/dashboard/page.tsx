'use client'

import { useQuery } from '@tanstack/react-query'
import { dashboard, members, events } from '@/lib/api'
import { useAuth } from '@/providers/AuthProvider'
import { KpiCard } from '@/components/admin/KpiCard'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CalendarDays, Users } from 'lucide-react'
import { MEMBER_STATUS_LABEL, MONTH_FR, fmtDate, fmtEur } from '@/lib/utils'

export default function DashboardPage() {
  const { user } = useAuth()
  const today = new Date()

  const { data: kpis, isError: kpisError }             = useQuery({ queryKey: ['dashboard'], queryFn: dashboard.treasurer })
  const { data: membersData, isError: membersError }   = useQuery({
    queryKey: ['members', 'recent'],
    queryFn: () => members.list({ page: 1, size: 5 }),
  })
  const { data: upcomingEvents, isError: eventsError } = useQuery({
    queryKey: ['events', 'upcoming'],
    queryFn: () => events.list({ upcoming_only: true, status: 'published' }),
  })

  const greeting = today.getHours() < 12 ? 'Bonjour' : today.getHours() < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">
          {greeting}, {user?.first_name} 👋
        </h1>
        <p className="text-sm text-[#888] mt-0.5">
          {today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {(kpisError || membersError || eventsError) && (
        <div className="text-sm text-red-400 bg-red-950/40 border border-red-800/50 rounded-xl px-4 py-3">
          Certaines données n'ont pas pu être chargées. Vérifiez votre connexion.
        </div>
      )}

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
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#1e1e1e] rounded-xl border border-[rgba(255,255,255,0.06)] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={15} className="text-[#C8A96E]" />
              <h2 className="text-sm font-semibold text-white">Derniers membres</h2>
            </div>
            <a href="/membres" className="text-xs text-[#C8A96E] hover:underline">Voir tous</a>
          </div>
          <ul className="space-y-3">
            {membersData?.items.map(m => {
              const st = MEMBER_STATUS_LABEL[m.status]
              return (
                <li key={m.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#2D5016] flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-white">
                      {m.first_name?.[0] ?? '?'}{m.last_name?.[0] ?? '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {m.first_name} {m.last_name}
                    </p>
                    <p className="text-xs text-[#555]">Inscrit le {fmtDate(m.joined_at)}</p>
                  </div>
                  <Badge className={`text-[10px] border ${st.className}`}>{st.label}</Badge>
                </li>
              )
            })}
            {!membersData && (
              <li className="text-sm text-[#555] text-center py-4">Chargement…</li>
            )}
          </ul>
        </div>

        <div className="space-y-4">
          {kpis && kpis.unpaid_this_month > 0 && (
            <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-4 space-y-1">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-400" />
                <p className="text-xs font-semibold text-amber-400">Alertes</p>
              </div>
              <p className="text-xs text-[#888]">
                {kpis.unpaid_this_month} membre{kpis.unpaid_this_month > 1 ? 's' : ''} sans cotisation ce mois
              </p>
            </div>
          )}

          <div className="bg-[#1e1e1e] rounded-xl border border-[rgba(255,255,255,0.06)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays size={15} className="text-[#C8A96E]" />
              <h2 className="text-sm font-semibold text-white">Événements à venir</h2>
            </div>
            <ul className="space-y-3">
              {upcomingEvents?.slice(0, 3).map(ev => {
                const d = new Date(ev.event_date)
                return (
                  <li key={ev.id} className="flex gap-3">
                    <div className="text-center w-10 shrink-0">
                      <p className="text-lg font-bold text-[#C8A96E] leading-none">{d.getDate()}</p>
                      <p className="text-[10px] text-[#555] uppercase">{MONTH_FR[d.getMonth()]}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{ev.title}</p>
                      <p className="text-xs text-[#555]">{ev.registrations_count} inscrits</p>
                    </div>
                  </li>
                )
              })}
              {upcomingEvents?.length === 0 && (
                <li className="text-xs text-[#555]">Aucun événement à venir</li>
              )}
              {!upcomingEvents && (
                <li className="text-xs text-[#555]">Chargement…</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
