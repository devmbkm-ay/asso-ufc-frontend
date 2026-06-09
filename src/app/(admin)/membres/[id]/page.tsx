'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { members, cotisations } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react'
import { avatarColor } from '@/lib/utils'

const CURRENT_YEAR = new Date().getFullYear()
const MONTHS_SHORT = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
const MONTHS_FULL  = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

const METHOD_LABELS: Record<string, string> = {
  cash:          'Espèces',
  bank_transfer: 'Virement',
  lydia:         'Lydia',
  sumeria:       'Sumeria',
  other:         'Autre',
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  active:    { label: 'Actif',     className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  inactive:  { label: 'Inactif',   className: 'bg-gray-100 text-gray-500 border-gray-200' },
  suspended: { label: 'Suspendu',  className: 'bg-red-50 text-red-600 border-red-200' },
  honorary:  { label: 'Honoraire', className: 'bg-purple-50 text-purple-600 border-purple-200' },
}

const PAYMENT_STATUS: Record<string, { label: string; className: string }> = {
  confirmed: { label: 'Confirmé',   className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  pending:   { label: 'En attente', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  cancelled: { label: 'Annulé',     className: 'bg-red-50 text-red-600 border-red-200' },
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtEur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

export default function MembrePage() {
  const { id } = useParams<{ id: string }>()
  const [tableYear, setTableYear] = useState(CURRENT_YEAR)

  const { data: member, isLoading } = useQuery({
    queryKey: ['member', id],
    queryFn: () => members.get(id),
  })

  // All payments — for summary stats
  const { data: allPayments } = useQuery({
    queryKey: ['payments', id, 'all'],
    queryFn: () => cotisations.payments({ member_id: id, size: 1000 }),
    enabled: !!id,
  })

  // Filtered by year — for the table
  const { data: yearPayments, isLoading: isLoadingYear } = useQuery({
    queryKey: ['payments', id, tableYear],
    queryFn: () => cotisations.payments({ member_id: id, year: tableYear, size: 100 }),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!member) return null

  const st       = STATUS_LABEL[member.status]
  const allItems = allPayments?.items ?? []
  const yearItems = yearPayments?.items ?? []

  const totalPaid    = allItems.filter(p => p.status === 'confirmed').reduce((s, p) => s + p.amount, 0)
  const pendingCount = allItems.filter(p => p.status === 'pending').length

  // Current-year confirmed months
  const paidMonthsThisYear = new Set(
    allItems
      .filter(p => p.period_year === CURRENT_YEAR && p.status === 'confirmed' && p.period_month)
      .map(p => p.period_month),
  )

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <Link
        href="/membres"
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-800 transition-colors w-fit"
      >
        <ArrowLeft size={14} />
        Retour aux membres
      </Link>

      {/* Identity */}
      <div className="flex items-start gap-4">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${avatarColor(member.first_name + member.last_name)}`}>
          <span className="text-lg font-bold">
            {member.first_name[0]}{member.last_name[0]}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold text-slate-800">
              {member.first_name} {member.last_name}
            </h1>
            <Badge className={`text-[10px] border ${st.className}`}>{st.label}</Badge>
          </div>
          {member.roles.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {member.roles.map(r => (
                <span key={r} className="text-xs text-[#6366F1] bg-indigo-50 px-2 py-0.5 rounded">
                  {r}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info + Cotisations cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="bg-white rounded-xl border border-[rgba(99,102,241,0.15)] shadow-sm p-5 space-y-4">
          <h2 className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Informations</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail size={14} className="text-[#6366F1] shrink-0" />
              <span className="text-slate-800">{member.email}</span>
            </div>
            {member.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone size={14} className="text-[#6366F1] shrink-0" />
                <span className="text-slate-800">{member.phone}</span>
              </div>
            )}
            {member.address && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin size={14} className="text-[#6366F1] shrink-0" />
                <span className="text-slate-800">{member.address}</span>
              </div>
            )}
            {member.birth_date && (
              <div className="flex items-center gap-3 text-sm">
                <Calendar size={14} className="text-[#6366F1] shrink-0" />
                <span className="text-slate-800">{fmtDate(member.birth_date)}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Clock size={14} className="text-[#6366F1] shrink-0" />
              <span className="text-slate-500">
                Membre depuis le <span className="text-slate-800">{fmtDate(member.joined_at)}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[rgba(99,102,241,0.15)] shadow-sm p-5 space-y-4">
          <h2 className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Cotisations</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Total versé</span>
              <span className="text-sm font-semibold text-[#6366F1]">{fmtEur(totalPaid)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Paiements enregistrés</span>
              <span className="text-sm text-slate-800">{allItems.length}</span>
            </div>
            {pendingCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">En attente</span>
                <span className="text-sm text-amber-600 font-medium">{pendingCount}</span>
              </div>
            )}
          </div>

          {/* Month progress for current year */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 mb-2">
              {CURRENT_YEAR} — {paidMonthsThisYear.size} mois confirmé{paidMonthsThisYear.size !== 1 ? 's' : ''}
            </p>
            <div className="flex gap-1">
              {MONTHS_SHORT.map((m, i) => {
                const monthNum = i + 1
                const paid = paidMonthsThisYear.has(monthNum)
                return (
                  <div
                    key={monthNum}
                    title={`${MONTHS_FULL[i]} ${CURRENT_YEAR}`}
                    className={`flex-1 h-5 rounded-sm flex items-center justify-center text-[9px] font-semibold transition-colors ${
                      paid
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {m}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Payment history */}
      <div className="bg-white rounded-xl border border-[rgba(99,102,241,0.15)] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-slate-800">Historique des paiements</h2>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <button
              onClick={() => setTableYear(y => y - 1)}
              className="text-slate-400 hover:text-slate-800 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-semibold text-slate-800 w-8 text-center select-none">{tableYear}</span>
            <button
              onClick={() => setTableYear(y => y + 1)}
              disabled={tableYear >= CURRENT_YEAR}
              className="text-slate-400 hover:text-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-5 py-3 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Période</th>
              <th className="text-left px-5 py-3 text-[10px] font-semibold tracking-wider text-slate-400 uppercase hidden sm:table-cell">Plan</th>
              <th className="text-left px-5 py-3 text-[10px] font-semibold tracking-wider text-slate-400 uppercase hidden md:table-cell">Méthode</th>
              <th className="text-left px-5 py-3 text-[10px] font-semibold tracking-wider text-slate-400 uppercase hidden md:table-cell">Date</th>
              <th className="text-right px-5 py-3 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Montant</th>
              <th className="text-left px-5 py-3 text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoadingYear && (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">Chargement…</td></tr>
            )}
            {!isLoadingYear && yearItems.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                  Aucun paiement enregistré en {tableYear}
                </td>
              </tr>
            )}
            {yearItems.map(p => {
              const ps = PAYMENT_STATUS[p.status] ?? { label: p.status, className: 'bg-gray-100 text-gray-500 border-gray-200' }
              const period = p.period_month
                ? `${MONTHS_FULL[p.period_month - 1]} ${p.period_year}`
                : String(p.period_year)
              return (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-800">{period}</td>
                  <td className="px-5 py-3 text-slate-500 hidden sm:table-cell">{p.plan_label}</td>
                  <td className="px-5 py-3 text-slate-500 hidden md:table-cell">
                    {METHOD_LABELS[p.method] ?? p.method}
                  </td>
                  <td className="px-5 py-3 text-slate-500 hidden md:table-cell">{fmtDate(p.payment_date)}</td>
                  <td className="px-5 py-3 text-right font-medium text-slate-800">{fmtEur(p.amount)}</td>
                  <td className="px-5 py-3">
                    <Badge className={`text-[10px] border ${ps.className}`}>{ps.label}</Badge>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
