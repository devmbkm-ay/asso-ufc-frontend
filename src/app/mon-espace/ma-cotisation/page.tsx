'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cotisations } from '@/lib/api'
import { useAuth } from '@/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, CreditCard, CheckCircle2, Clock, UserCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

const CURRENT_YEAR = new Date().getFullYear()

const MONTHS_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
const MONTHS_FULL  = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

const METHOD_LABELS: Record<string, string> = {
  cash:          'Espèces',
  bank_transfer: 'Virement',
  lydia:         'Lydia',
  sumeria:       'Sumeria',
  other:         'Autre',
}

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  confirmed: { label: 'Validé',           color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  declared:  { label: 'En vérification',  color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200'   },
  pending:   { label: 'En attente',       color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200'  },
  cancelled: { label: 'Annulé',           color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200'    },
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtAmount(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

function periodLabel(p: { period_month?: number | null; period_year: number }) {
  return p.period_month
    ? `${MONTHS_FULL[p.period_month - 1]} ${p.period_year}`
    : String(p.period_year)
}

export default function MaCotisationPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [year, setYear] = useState(CURRENT_YEAR)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const { data: allData } = useQuery({
    queryKey: ['my-payments-all', user?.id],
    queryFn:  () => cotisations.payments({ member_id: user?.id, size: 500 }),
    enabled:  !!user,
  })

  const { data: yearData, isLoading } = useQuery({
    queryKey: ['my-payments-year', user?.id, year],
    queryFn:  () => cotisations.payments({ member_id: user?.id, year, size: 100 }),
    enabled:  !!user,
  })

  const { mutate: confirmPayment } = useMutation({
    mutationFn: (id: string) => cotisations.memberConfirm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-payments-year', user?.id, year] })
      queryClient.invalidateQueries({ queryKey: ['my-payments-all', user?.id] })
      setConfirmingId(null)
    },
    onError: () => setConfirmingId(null),
  })

  const allPayments  = allData?.items  ?? []
  const yearPayments = yearData?.items ?? []

  const pendingYear    = yearPayments.filter(p => p.status === 'pending')
  const declaredYear   = yearPayments.filter(p => p.status === 'declared')
  const confirmedYear  = yearPayments.filter(p => p.status === 'confirmed')
  const cancelledYear  = yearPayments.filter(p => p.status === 'cancelled')
  const displayedYear  = [...confirmedYear, ...cancelledYear] // pending + declared shown separately

  // Monthly view: only payments with period_month set
  const monthlyConfirmed = confirmedYear.filter(p => p.period_month !== null)
  const confirmedMonths  = new Set(monthlyConfirmed.map(p => p.period_month))
  const isMonthlyPlan    = yearPayments.some(p => p.period_month !== null)

  const totalPaidThisYear = confirmedYear.reduce((s, p) => s + Number(p.amount), 0)
  const totalAllTime      = allPayments.filter(p => p.status === 'confirmed')
    .reduce((s, p) => s + Number(p.amount), 0)

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">

      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Ma cotisation</h1>
        <p className="text-sm text-slate-400 mt-1">Historique de vos paiements</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: isMonthlyPlan ? `Mois payés ${year}` : `Cotisations ${year}`,
            value: isMonthlyPlan
              ? `${confirmedMonths.size}/12`
              : `${confirmedYear.length}`,
          },
          { label: `Total ${year}`,  value: fmtAmount(totalPaidThisYear) },
          { label: 'Total cumulé',   value: fmtAmount(totalAllTime) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-[rgba(99,102,241,0.15)] shadow-sm p-4 text-center">
            <p className="text-lg font-bold text-slate-800">{value}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Cotisations en attente */}
      {pendingYear.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-amber-600" />
            <h2 className="text-sm font-semibold text-amber-800">
              {pendingYear.length} cotisation{pendingYear.length > 1 ? 's' : ''} en attente
            </h2>
          </div>
          <p className="text-xs text-amber-700">
            Cliquez sur "J'ai réglé" pour confirmer votre paiement une fois effectué.
          </p>
          <div className="space-y-2">
            {pendingYear.map(p => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 bg-white border border-amber-200 rounded-lg px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{p.plan_label}</p>
                  <p className="text-xs text-slate-400">{periodLabel(p)} · {fmtAmount(Number(p.amount))}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => { setConfirmingId(p.id); confirmPayment(p.id) }}
                  disabled={confirmingId === p.id}
                  className="bg-[#6366F1] hover:bg-[#4F46E5] text-white gap-1.5 shrink-0"
                >
                  <CheckCircle2 size={13} />
                  {confirmingId === p.id ? 'En cours…' : "J'ai réglé"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cotisations en cours de vérification */}
      {declaredYear.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <UserCheck size={15} className="text-blue-600" />
            <h2 className="text-sm font-semibold text-blue-800">
              {declaredYear.length} cotisation{declaredYear.length > 1 ? 's' : ''} en cours de vérification
            </h2>
          </div>
          <p className="text-xs text-blue-700">
            Votre déclaration a été transmise. Le trésorier vérifiera et validera votre paiement prochainement.
          </p>
          <div className="space-y-2">
            {declaredYear.map(p => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 bg-white border border-blue-200 rounded-lg px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{p.plan_label}</p>
                  <p className="text-xs text-slate-400">{periodLabel(p)} · {fmtAmount(Number(p.amount))}</p>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border text-blue-700 bg-blue-50 border-blue-200 shrink-0">
                  En vérification
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Couverture mensuelle (seulement pour plans mensuels) */}
      {isMonthlyPlan && (
        <div className="bg-white rounded-xl border border-[rgba(99,102,241,0.15)] shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Couverture {year}</h2>
            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-lg px-2 py-1">
              <button onClick={() => setYear(y => y - 1)} className="text-slate-400 hover:text-slate-800 transition-colors">
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-medium text-slate-800 w-10 text-center select-none">{year}</span>
              <button
                onClick={() => setYear(y => y + 1)}
                disabled={year >= CURRENT_YEAR}
                className="text-slate-400 hover:text-slate-800 transition-colors disabled:opacity-30"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-1">
            {MONTHS_SHORT.map((m, i) => {
              const month  = i + 1
              const paid   = confirmedMonths.has(month)
              const future = year === CURRENT_YEAR && month > new Date().getMonth() + 1
              return (
                <div key={month} className="flex flex-col items-center gap-1">
                  <div className={cn(
                    'w-full aspect-square rounded flex items-center justify-center text-[9px] font-semibold transition-colors',
                    paid    ? 'bg-emerald-500 text-white'
                    : future ? 'bg-slate-100 text-slate-300'
                    :          'bg-red-100 text-red-300',
                  )}>
                    {paid ? '✓' : future ? '' : '✗'}
                  </div>
                  <span className="text-[8px] text-slate-400 hidden sm:block">{m}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Historique (confirmés + annulés) */}
      <div className="bg-white rounded-xl border border-[rgba(99,102,241,0.15)] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800">Paiements {year}</h2>
        </div>

        {isLoading && (
          <div className="px-5 py-10 text-center text-sm text-slate-400">Chargement…</div>
        )}

        {!isLoading && displayedYear.length === 0 && pendingYear.length === 0 && declaredYear.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <CreditCard size={24} className="text-slate-300" />
            <p className="text-sm text-slate-400">Aucun paiement enregistré pour {year}</p>
          </div>
        )}

        {!isLoading && displayedYear.length === 0 && (pendingYear.length > 0 || declaredYear.length > 0) && (
          <div className="px-5 py-6 text-center text-sm text-slate-400">
            Aucun paiement confirmé pour {year}
          </div>
        )}

        {displayedYear.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Période', 'Plan', 'Méthode', 'Date', 'Montant', 'Statut'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedYear.map(p => {
                  const meta = STATUS_META[p.status] ?? STATUS_META.pending
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-800 font-medium whitespace-nowrap">
                        {periodLabel(p)}
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{p.plan_label}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {METHOD_LABELS[p.method] ?? p.method}
                      </td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{fmtDate(p.payment_date)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{fmtAmount(Number(p.amount))}</td>
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
