'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cotisations } from '@/lib/api'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn, fmtEur } from '@/lib/utils'

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

const CELL_STYLE: Record<string, string> = {
  confirmed: 'bg-emerald-900/60 text-emerald-400 border-emerald-800/50',
  pending:   'bg-amber-900/50 text-amber-400 border-amber-800/50',
  cancelled: 'bg-red-900/40 text-red-500 border-red-800/50',
  none:      'bg-[#191919] text-transparent border-[rgba(255,255,255,0.05)]',
}

const CELL_SYMBOL: Record<string, string> = {
  confirmed: '✓',
  pending:   '·',
  cancelled: '✕',
  none:      '',
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
          <h1 className="text-2xl font-semibold text-white">Cotisations</h1>
          <p className="text-sm text-[#888] mt-0.5">
            {isLoading
              ? '—'
              : `${confirmedCount} confirmés · ${pendingCount} en attente · ${fmtEur(totalRevenue)} encaissés`}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#1e1e1e] border border-[rgba(255,255,255,0.08)] rounded-lg px-3 py-2">
          <button
            onClick={() => setYear(y => y - 1)}
            className="text-[#555] hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-white w-10 text-center select-none">{year}</span>
          <button
            onClick={() => setYear(y => y + 1)}
            disabled={year >= currentYear}
            className="text-[#555] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="bg-[#1e1e1e] rounded-xl border border-[rgba(255,255,255,0.06)] overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.06)]">
              <th className="text-left px-4 py-3.5 text-[10px] font-semibold tracking-wider text-[#555] uppercase sticky left-0 bg-[#1e1e1e] min-w-[180px] z-10">
                Membre
              </th>
              {MONTHS.map(m => (
                <th key={m} className="px-1.5 py-3.5 text-[10px] font-semibold tracking-wider text-[#555] uppercase text-center min-w-[48px]">
                  {m}
                </th>
              ))}
              <th className="px-4 py-3.5 text-[10px] font-semibold tracking-wider text-[#555] uppercase text-right whitespace-nowrap">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
            {isLoading && (
              <tr>
                <td colSpan={14} className="px-4 py-12 text-center text-[#555]">Chargement…</td>
              </tr>
            )}
            {!isLoading && grid?.length === 0 && (
              <tr>
                <td colSpan={14} className="px-4 py-12 text-center text-[#555]">Aucune donnée pour {year}</td>
              </tr>
            )}
            {grid?.map(row => {
              const rowTotal = row.months.reduce((s, m) =>
                s + (m.status === 'confirmed' ? (m.amount ?? 0) : 0), 0)
              return (
                <tr key={row.member_id} className="hover:bg-[rgba(255,255,255,0.015)]">
                  <td className="px-4 py-2.5 sticky left-0 bg-[#1e1e1e] font-medium text-white whitespace-nowrap z-10">
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
                    <span className={rowTotal > 0 ? 'text-[#C8A96E]' : 'text-[#444]'}>
                      {rowTotal > 0 ? fmtEur(rowTotal) : '—'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-5 text-xs text-[#555]">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-4 rounded border bg-emerald-900/60 border-emerald-800/50 flex items-center justify-center text-emerald-400 text-[10px]">✓</div>
          Confirmé
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-4 rounded border bg-amber-900/50 border-amber-800/50 flex items-center justify-center text-amber-400 text-[10px]">·</div>
          En attente
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-4 rounded border bg-red-900/40 border-red-800/50 flex items-center justify-center text-red-500 text-[10px]">✕</div>
          Annulé
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-4 rounded border bg-[#191919] border-[rgba(255,255,255,0.05)]" />
          Non payé
        </div>
      </div>
    </div>
  )
}
