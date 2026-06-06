'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cotisations } from '@/lib/api'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

const CELL_STYLE: Record<string, string> = {
  confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  pending:   'bg-amber-100 text-amber-700 border-amber-300',
  cancelled: 'bg-red-100 text-red-600 border-red-300',
  none:      'bg-[#F0EBE2] text-transparent border-[rgba(0,0,0,0.06)]',
}

const CELL_SYMBOL: Record<string, string> = {
  confirmed: '✓',
  pending:   '·',
  cancelled: '✕',
  none:      '',
}

function fmtEur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

export default function CotisationsPage() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)

  const { data: grid, isLoading } = useQuery({
    queryKey: ['cotisations-grid', year],
    queryFn: () => cotisations.grid(year),
  })

  const totalRevenue = grid?.reduce((sum, row) =>
    sum + row.months.reduce((s, m) => s + (m.status === 'confirmed' ? (m.amount ?? 0) : 0), 0), 0) ?? 0

  const confirmedCount = grid?.reduce((sum, row) =>
    sum + row.months.filter(m => m.status === 'confirmed').length, 0) ?? 0

  const pendingCount = grid?.reduce((sum, row) =>
    sum + row.months.filter(m => m.status === 'pending').length, 0) ?? 0

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-[#1a1a1a]">Cotisations</h1>
          <p className="text-sm text-[#6B6560] mt-0.5">
            {isLoading
              ? '—'
              : `${confirmedCount} confirmés · ${pendingCount} en attente · ${fmtEur(totalRevenue)} encaissés`}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-[rgba(0,0,0,0.10)] shadow-sm rounded-lg px-3 py-2">
          <button
            onClick={() => setYear(y => y - 1)}
            className="text-[#9B928B] hover:text-[#1a1a1a] transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-[#1a1a1a] w-10 text-center select-none">{year}</span>
          <button
            onClick={() => setYear(y => y + 1)}
            disabled={year >= currentYear}
            className="text-[#9B928B] hover:text-[#1a1a1a] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[rgba(200,169,110,0.18)] shadow-sm overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[rgba(0,0,0,0.06)]">
              <th className="text-left px-4 py-3.5 text-[10px] font-semibold tracking-wider text-[#9B928B] uppercase sticky left-0 bg-white min-w-[180px] z-10">
                Membre
              </th>
              {MONTHS.map(m => (
                <th key={m} className="px-1.5 py-3.5 text-[10px] font-semibold tracking-wider text-[#9B928B] uppercase text-center min-w-[48px]">
                  {m}
                </th>
              ))}
              <th className="px-4 py-3.5 text-[10px] font-semibold tracking-wider text-[#9B928B] uppercase text-right whitespace-nowrap">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(0,0,0,0.04)]">
            {isLoading && (
              <tr>
                <td colSpan={14} className="px-4 py-12 text-center text-[#9B928B]">Chargement…</td>
              </tr>
            )}
            {!isLoading && grid?.length === 0 && (
              <tr>
                <td colSpan={14} className="px-4 py-12 text-center text-[#9B928B]">Aucune donnée pour {year}</td>
              </tr>
            )}
            {grid?.map(row => {
              const rowTotal = row.months.reduce((s, m) =>
                s + (m.status === 'confirmed' ? (m.amount ?? 0) : 0), 0)
              return (
                <tr key={row.member_id} className="hover:bg-[rgba(0,0,0,0.015)]">
                  <td className="px-4 py-2.5 sticky left-0 bg-white font-medium text-[#1a1a1a] whitespace-nowrap z-10">
                    {row.member_name}
                  </td>
                  {row.months.map(cell => (
                    <td key={cell.month} className="px-1.5 py-2.5 text-center">
                      <div
                        className={cn(
                          'mx-auto w-8 h-7 rounded border flex items-center justify-center text-[11px] font-semibold',
                          CELL_STYLE[cell.status],
                        )}
                        title={
                          cell.status !== 'none'
                            ? `${cell.status}${cell.amount ? ` · ${fmtEur(cell.amount)}` : ''}`
                            : undefined
                        }
                      >
                        {CELL_SYMBOL[cell.status]}
                      </div>
                    </td>
                  ))}
                  <td className="px-4 py-2.5 text-right font-semibold whitespace-nowrap">
                    <span className={rowTotal > 0 ? 'text-[#C8A96E]' : 'text-[#B0A9A2]'}>
                      {rowTotal > 0 ? fmtEur(rowTotal) : '—'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-5 text-xs text-[#9B928B]">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-4 rounded border bg-emerald-100 border-emerald-300 flex items-center justify-center text-emerald-700 text-[10px]">✓</div>
          Confirmé
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-4 rounded border bg-amber-100 border-amber-300 flex items-center justify-center text-amber-700 text-[10px]">·</div>
          En attente
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-4 rounded border bg-red-100 border-red-300 flex items-center justify-center text-red-600 text-[10px]">✕</div>
          Annulé
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-4 rounded border bg-[#F0EBE2] border-[rgba(0,0,0,0.06)]" />
          Non payé
        </div>
      </div>
    </div>
  )
}
