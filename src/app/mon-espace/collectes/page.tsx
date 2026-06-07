'use client'

import { useQuery } from '@tanstack/react-query'
import { collectes } from '@/lib/api'
import Link from 'next/link'
import { Heart, ChevronRight, Lock, Clock, CheckCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

const CATEGORY_LABELS: Record<string, string> = {
  deces:     'Décès',
  mariage:   'Mariage',
  naissance: 'Naissance',
  maladie:   'Maladie',
  autre:     'Autre',
}

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  active:   { label: 'En cours',  color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200',  icon: Heart },
  upcoming: { label: 'À venir',   color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200',        icon: Clock },
  expired:  { label: 'Expirée',   color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200',      icon: Clock },
  closed:   { label: 'Clôturée',  color: 'text-gray-500',    bg: 'bg-gray-100 border-gray-200',       icon: Lock },
}

function fmtAmount(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function CollectesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['collectes-all-member'],
    queryFn: () => collectes.list(),
  })

  const sorted = [...(data ?? [])].sort((a, b) => {
    const order = { active: 0, upcoming: 1, expired: 2, closed: 3 }
    return (order[a.status] ?? 99) - (order[b.status] ?? 99)
  })

  return (
    <div className="p-6 md:p-8 max-w-3xl space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#1a1a1a]">Collectes de solidarité</h1>
        <p className="text-sm text-[#6B6560] mt-1">
          {isLoading ? '—' : `${data?.length ?? 0} collecte${(data?.length ?? 0) > 1 ? 's' : ''}`}
        </p>
      </div>

      {isLoading && (
        <div className="py-12 text-center text-sm text-[#9B928B]">Chargement…</div>
      )}

      {!isLoading && sorted.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-[#F0EBE2] flex items-center justify-center">
            <Heart size={20} className="text-[#B0A9A2]" />
          </div>
          <p className="text-sm text-[#9B928B]">Aucune collecte pour le moment</p>
        </div>
      )}

      {sorted.length > 0 && (
        <div className="space-y-3">
          {sorted.map(c => {
            const meta    = STATUS_META[c.status] ?? STATUS_META.expired
            const Icon    = meta.icon
            const pct     = c.min_amount > 0
              ? Math.min((c.total_collected / (c.min_amount * 5)) * 100, 100)
              : 0

            return (
              <Link
                key={c.id}
                href={`/mon-espace/collectes/${c.id}`}
                className="block bg-white rounded-xl border border-[rgba(200,169,110,0.18)] shadow-sm p-5 hover:border-[#C8A96E]/50 hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-4">
                  {/* Photo or icon */}
                  {c.photo_url ? (
                    <img
                      src={c.photo_url}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-[rgba(0,0,0,0.06)]"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-[#C8A96E]/10 flex items-center justify-center shrink-0">
                      <Heart size={18} className="text-[#C8A96E]" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    {/* Title + status */}
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-[#1a1a1a] group-hover:text-[#C8A96E] transition-colors line-clamp-1">
                        {c.title}
                      </p>
                      <span className={cn(
                        'inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0',
                        meta.bg, meta.color,
                      )}>
                        <Icon size={9} />
                        {meta.label}
                      </span>
                    </div>

                    {/* Beneficiary + category */}
                    <p className="text-xs text-[#9B928B] mt-0.5">
                      {c.beneficiary_name}
                      {c.category && ` · ${CATEGORY_LABELS[c.category] ?? c.category}`}
                    </p>

                    {/* Progress */}
                    <div className="mt-3 space-y-1.5">
                      <div className="flex justify-between text-xs text-[#6B6560]">
                        <span className="font-semibold text-[#1a1a1a]">{fmtAmount(c.total_collected)}</span>
                        <span>{c.contributors_count} contributeur{c.contributors_count > 1 ? 's' : ''}</span>
                      </div>
                      {c.status === 'active' && (
                        <div className="h-1.5 rounded-full bg-[#F0EBE2] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#C8A96E] transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Dates */}
                    <p className="text-[10px] text-[#B0A9A2] mt-2">
                      {c.status === 'active'
                        ? `Jusqu'au ${fmtDate(c.end_date)}`
                        : c.status === 'upcoming'
                          ? `Démarre le ${fmtDate(c.start_date)}`
                          : `${fmtDate(c.start_date)} → ${fmtDate(c.end_date)}`
                      }
                    </p>
                  </div>

                  <ChevronRight size={16} className="text-[#B0A9A2] shrink-0 mt-1" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
