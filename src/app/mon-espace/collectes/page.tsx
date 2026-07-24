'use client'

import { useQuery } from '@tanstack/react-query'
import { collectes } from '@/lib/api'
import Link from 'next/link'
import { Heart, ChevronRight, Lock, Clock, CheckCheck } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { categoryLabel } from '@/lib/collecte-categories'

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  active: { label: 'En cours', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: Heart },
  upcoming: { label: 'À venir', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: Clock },
  expired: { label: 'Expirée', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: Clock },
  closed: { label: 'Clôturée', color: 'text-gray-500', bg: 'bg-gray-100 border-gray-200', icon: Lock },
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
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Collectes de solidarité</h1>
        <p className="text-sm text-slate-400 mt-1">
          {isLoading ? '—' : `${data?.length ?? 0} collecte${(data?.length ?? 0) > 1 ? 's' : ''}`}
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {!isLoading && sorted.length === 0 && (
        <EmptyState
          title="Aucune collecte pour le moment"
          description="Les collectes de solidarité actives ou à venir apparaîtront ici."
          icon={<Heart className="size-5" />}
        />
      )}

      {sorted.length > 0 && (
        <div className="space-y-3">
          {sorted.map(c => {
            const meta = STATUS_META[c.status] ?? STATUS_META.expired
            const Icon = meta.icon
            const goal = c.goal_amount ?? (c.min_amount > 0 ? c.min_amount * 5 : 0)
            const pct = goal > 0
              ? Math.min((c.total_collected / goal) * 100, 100)
              : 0

            return (
              <Link
                key={c.id}
                href={`/mon-espace/collectes/${c.id}`}
                className="block bg-white rounded-xl border border-primary/15 shadow-sm p-5 hover:border-primary/40 hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-4">
                  {/* Photo or icon */}
                  {c.photo_url ? (
                    <img
                      src={c.photo_url}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-100"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Heart size={18} className="text-primary" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    {/* Title + status */}
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800 group-hover:text-primary transition-colors line-clamp-1">
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
                    <p className="text-xs text-slate-400 mt-0.5">
                      {c.beneficiary_name}
                      {c.category && ` · ${categoryLabel(c.category)}`}
                    </p>

                    {/* Progress */}
                    <div className="mt-3 space-y-1.5">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span className="font-semibold text-slate-800">{fmtAmount(c.total_collected)}</span>
                        <span>{c.contributors_count} contributeur{c.contributors_count > 1 ? 's' : ''}</span>
                      </div>
                      {c.status === 'active' && (
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Dates */}
                    <p className="text-[10px] text-slate-400 mt-2">
                      {c.status === 'active'
                        ? `Jusqu'au ${fmtDate(c.end_date)}`
                        : c.status === 'upcoming'
                          ? `Démarre le ${fmtDate(c.start_date)}`
                          : `${fmtDate(c.start_date)} → ${fmtDate(c.end_date)}`
                      }
                    </p>
                  </div>

                  <ChevronRight size={16} className="text-slate-400 shrink-0 mt-1" />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
