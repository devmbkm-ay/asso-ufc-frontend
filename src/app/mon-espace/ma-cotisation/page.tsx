'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cotisations } from '@/lib/api'
import { useAuth } from '@/providers/AuthProvider'
import { ChevronLeft, ChevronRight, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'

const CURRENT_YEAR = new Date().getFullYear()

const MONTHS_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
const MONTHS_FULL  = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

const METHOD_LABELS: Record<string, string> = {
  cash:         'Espèces',
  bank_transfer:'Virement',
  check:        'Chèque',
  online:       'En ligne',
}

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  confirmed: { label: 'Confirmé',   color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200' },
  pending:   { label: 'En attente', color: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-200' },
  cancelled: { label: 'Annulé',     color: 'text-red-600',     bg: 'bg-red-50',      border: 'border-red-200' },
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtAmount(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

export default function MaCotisationPage() {
  const { user } = useAuth()
  const [year, setYear] = useState(CURRENT_YEAR)

  // All-time payments for stats
  const { data: allData } = useQuery({
    queryKey: ['my-payments-all', user?.id],
    queryFn: () => cotisations.payments({ member_id: user?.id, size: 1000 }),
    enabled: !!user,
  })

  // Year-filtered payments for table
  const { data: yearData, isLoading } = useQuery({
    queryKey: ['my-payments-year', user?.id, year],
    queryFn: () => cotisations.payments({ member_id: user?.id, year, size: 100 }),
    enabled: !!user,
  })

  const allPayments  = allData?.items ?? []
  const yearPayments = yearData?.items ?? []

  const confirmedThisYear = yearPayments.filter(p => p.status === 'confirmed')
  const confirmedSet      = new Set(confirmedThisYear.map(p => p.period_month))
  const totalPaidThisYear = confirmedThisYear.reduce((s, p) => s + p.amount, 0)
  const totalAllTime      = allPayments.filter(p => p.status === 'confirmed').reduce((s, p) => s + p.amount, 0)

  return (
    <div className="p-6 md:p-8 max-w-2xl space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#1a1a1a]">Ma cotisation</h1>
        <p className="text-sm text-[#6B6560] mt-1">Historique de vos paiements</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: `Mois payés ${year}`, value: `${confirmedSet.size}/12` },
          { label: `Total ${year}`,      value: fmtAmount(totalPaidThisYear) },
          { label: 'Total cumulé',       value: fmtAmount(totalAllTime) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-[rgba(200,169,110,0.18)] shadow-sm p-4 text-center">
            <p className="text-lg font-bold text-[#1a1a1a]">{value}</p>
            <p className="text-[10px] text-[#9B928B] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Monthly progress */}
      <div className="bg-white rounded-xl border border-[rgba(200,169,110,0.18)] shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#1a1a1a]">Couverture {year}</h2>
          <div className="flex items-center gap-1.5 bg-[#F0EBE2] border border-[rgba(0,0,0,0.08)] rounded-lg px-2 py-1">
            <button
              onClick={() => setYear(y => y - 1)}
              className="text-[#9B928B] hover:text-[#1a1a1a] transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-medium text-[#1a1a1a] w-10 text-center select-none">{year}</span>
            <button
              onClick={() => setYear(y => y + 1)}
              disabled={year >= CURRENT_YEAR}
              className="text-[#9B928B] hover:text-[#1a1a1a] transition-colors disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-1">
          {MONTHS_SHORT.map((m, i) => {
            const month = i + 1
            const paid  = confirmedSet.has(month)
            const future= year === CURRENT_YEAR && month > new Date().getMonth() + 1
            return (
              <div key={month} className="flex flex-col items-center gap-1">
                <div className={cn(
                  'w-full aspect-square rounded flex items-center justify-center text-[9px] font-semibold transition-colors',
                  paid    ? 'bg-emerald-500 text-white'
                  : future ? 'bg-[#F0EBE2] text-[#D0C9C2]'
                  :          'bg-red-100 text-red-300',
                )}>
                  {paid ? '✓' : future ? '' : '✗'}
                </div>
                <span className="text-[8px] text-[#B0A9A2] hidden sm:block">{m}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Payment table */}
      <div className="bg-white rounded-xl border border-[rgba(200,169,110,0.18)] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[rgba(0,0,0,0.06)]">
          <h2 className="text-sm font-semibold text-[#1a1a1a]">Paiements {year}</h2>
        </div>

        {isLoading && (
          <div className="px-5 py-10 text-center text-sm text-[#9B928B]">Chargement…</div>
        )}

        {!isLoading && yearPayments.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <CreditCard size={24} className="text-[#D8CFC8]" />
            <p className="text-sm text-[#9B928B]">Aucun paiement enregistré pour {year}</p>
          </div>
        )}

        {yearPayments.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(0,0,0,0.06)]">
                  {['Période', 'Plan', 'Méthode', 'Date', 'Montant', 'Statut'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-[#9B928B] uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(0,0,0,0.04)]">
                {yearPayments.map(p => {
                  const meta = STATUS_META[p.status] ?? STATUS_META.pending
                  return (
                    <tr key={p.id} className="hover:bg-[rgba(0,0,0,0.015)]">
                      <td className="px-4 py-3 text-[#1a1a1a] font-medium whitespace-nowrap">
                        {p.period_month ? `${MONTHS_FULL[p.period_month - 1]} ${p.period_year}` : String(p.period_year)}
                      </td>
                      <td className="px-4 py-3 text-[#6B6560] whitespace-nowrap">{p.plan_label}</td>
                      <td className="px-4 py-3 text-[#6B6560] whitespace-nowrap">
                        {METHOD_LABELS[p.method] ?? p.method}
                      </td>
                      <td className="px-4 py-3 text-[#9B928B] whitespace-nowrap">{fmtDate(p.payment_date)}</td>
                      <td className="px-4 py-3 font-semibold text-[#1a1a1a] whitespace-nowrap">{fmtAmount(p.amount)}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'text-[10px] font-medium px-2 py-0.5 rounded-full border',
                          meta.bg, meta.color, meta.border,
                        )}>
                          {meta.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
