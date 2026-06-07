'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/providers/AuthProvider'
import { cotisations, collectes, events, members as membersApi } from '@/lib/api'
import Link from 'next/link'
import { Heart, Calendar, CreditCard, Users, ChevronRight, CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

const CURRENT_YEAR  = new Date().getFullYear()
const CURRENT_MONTH = new Date().getMonth() + 1

const MONTHS_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

const CATEGORY_LABELS: Record<string, string> = {
  deces:    'Décès',
  mariage:  'Mariage',
  naissance:'Naissance',
  maladie:  'Maladie',
  autre:    'Autre',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtAmount(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

export default function MonEspacePage() {
  const { user } = useAuth()

  const { data: paymentsData } = useQuery({
    queryKey: ['my-payments', CURRENT_YEAR],
    queryFn: () => cotisations.payments({ member_id: user?.id, year: CURRENT_YEAR, size: 100 }),
    enabled: !!user,
  })

  const { data: collectesList } = useQuery({
    queryKey: ['collectes-active'],
    queryFn: () => collectes.list({ active_only: true }),
  })

  const { data: eventsList } = useQuery({
    queryKey: ['events-upcoming'],
    queryFn: () => events.list({ upcoming_only: true, status: 'published' }),
  })

  const { data: membersData } = useQuery({
    queryKey: ['members-count'],
    queryFn: () => membersApi.list({ size: 1 }),
  })

  const { data: myRegs } = useQuery({
    queryKey: ['my-registrations'],
    queryFn: () => events.myRegistrations(),
  })

  const payments     = paymentsData?.items ?? []
  const confirmedSet = new Set(
    payments.filter(p => p.status === 'confirmed').map(p => p.period_month),
  )
  const confirmedCount = confirmedSet.size
  const isUpToDate     = confirmedSet.has(CURRENT_MONTH)

  const activeCollectes = collectesList?.filter(c => c.status === 'active') ?? []
  const nextEvent       = eventsList?.[0] ?? null
  const registeredIds   = new Set(myRegs?.map(r => r.event_id) ?? [])

  return (
    <div className="p-6 md:p-8 max-w-3xl space-y-7">

      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-semibold text-[#1a1a1a]">
          Bonjour, {user?.first_name} 👋
        </h1>
        <p className="text-sm text-[#6B6560] mt-0.5">Voici un résumé de votre activité dans l'association.</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Cotisations 2026',
            value: `${confirmedCount}/12`,
            icon: CreditCard,
            color: isUpToDate ? 'text-emerald-600' : 'text-amber-600',
            bg: isUpToDate ? 'bg-emerald-50' : 'bg-amber-50',
          },
          {
            label: 'Collectes actives',
            value: String(activeCollectes.length),
            icon: Heart,
            color: 'text-[#C8A96E]',
            bg: 'bg-[#C8A96E]/10',
          },
          {
            label: 'Événements à venir',
            value: String(eventsList?.length ?? 0),
            icon: Calendar,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            label: 'Membres',
            value: String(membersData?.total ?? '—'),
            icon: Users,
            color: 'text-[#2D5016]',
            bg: 'bg-[#2D5016]/10',
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-[rgba(200,169,110,0.18)] shadow-sm p-4">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-3', bg)}>
              <Icon size={15} className={color} />
            </div>
            <p className="text-xl font-bold text-[#1a1a1a]">{value}</p>
            <p className="text-xs text-[#9B928B] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Cotisation status */}
      <div className="bg-white rounded-xl border border-[rgba(200,169,110,0.18)] shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#1a1a1a]">Cotisation {CURRENT_YEAR}</h2>
          <Link href="/mon-espace/ma-cotisation" className="flex items-center gap-1 text-xs text-[#C8A96E] hover:text-[#b8994e]">
            Détail <ChevronRight size={13} />
          </Link>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {MONTHS_SHORT.map((m, i) => {
            const month = i + 1
            const paid  = confirmedSet.has(month)
            const past  = month <= CURRENT_MONTH
            return (
              <div
                key={month}
                title={m}
                className={cn(
                  'flex flex-col items-center gap-1 w-[calc((100%-66px)/12)] min-w-[32px]',
                )}
              >
                <div className={cn(
                  'w-full h-7 rounded flex items-center justify-center text-[10px] font-medium transition-colors',
                  paid
                    ? 'bg-emerald-500 text-white'
                    : past
                      ? 'bg-red-100 text-red-400'
                      : 'bg-[#F0EBE2] text-[#B0A9A2]',
                )}>
                  {paid ? '✓' : past ? '✗' : '·'}
                </div>
                <span className="text-[9px] text-[#B0A9A2] text-center leading-none hidden sm:block">{m}</span>
              </div>
            )
          })}
        </div>
        <p className={cn(
          'text-xs mt-3 font-medium',
          isUpToDate ? 'text-emerald-600' : 'text-amber-600',
        )}>
          {isUpToDate
            ? `✓ Vous êtes à jour pour ${MONTHS_SHORT[CURRENT_MONTH - 1]} ${CURRENT_YEAR}`
            : `Cotisation de ${MONTHS_SHORT[CURRENT_MONTH - 1]} ${CURRENT_YEAR} non enregistrée`
          }
        </p>
      </div>

      {/* Active collectes */}
      {activeCollectes.length > 0 && (
        <div className="bg-white rounded-xl border border-[rgba(200,169,110,0.18)] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(0,0,0,0.06)]">
            <h2 className="text-sm font-semibold text-[#1a1a1a]">Collectes en cours</h2>
            <Link href="/mon-espace/collectes" className="flex items-center gap-1 text-xs text-[#C8A96E] hover:text-[#b8994e]">
              Voir tout <ChevronRight size={13} />
            </Link>
          </div>
          <ul className="divide-y divide-[rgba(0,0,0,0.04)]">
            {activeCollectes.slice(0, 3).map(c => (
              <li key={c.id}>
                <Link
                  href={`/mon-espace/collectes/${c.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-[rgba(0,0,0,0.015)] transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#C8A96E]/10 flex items-center justify-center shrink-0">
                    <Heart size={14} className="text-[#C8A96E]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1a1a1a] truncate">{c.title}</p>
                    <p className="text-xs text-[#9B928B] mt-0.5">
                      {fmtAmount(c.total_collected)} collectés · {c.contributors_count} contributeurs
                      {c.category && ` · ${CATEGORY_LABELS[c.category] ?? c.category}`}
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-[#B0A9A2] shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next event */}
      {nextEvent && (
        <div className="bg-white rounded-xl border border-[rgba(200,169,110,0.18)] shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#1a1a1a]">Prochain événement</h2>
            <Link href="/mon-espace/evenements" className="flex items-center gap-1 text-xs text-[#C8A96E] hover:text-[#b8994e]">
              Voir tout <ChevronRight size={13} />
            </Link>
          </div>
          <Link href="/mon-espace/evenements" className="flex items-start gap-4 group">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Calendar size={16} className="text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1a1a1a] group-hover:text-[#C8A96E] transition-colors">
                {nextEvent.title}
              </p>
              <p className="text-xs text-[#9B928B] mt-0.5">{fmtDate(nextEvent.event_date)}</p>
              {nextEvent.location && (
                <p className="text-xs text-[#B0A9A2] mt-0.5">{nextEvent.location}</p>
              )}
            </div>
            <div className="shrink-0">
              {registeredIds.has(nextEvent.id) ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                  <CheckCircle2 size={10} /> Inscrit
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] text-[#9B928B] bg-[#F0EBE2] rounded-full px-2 py-0.5">
                  <Circle size={10} /> Non inscrit
                </span>
              )}
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}
