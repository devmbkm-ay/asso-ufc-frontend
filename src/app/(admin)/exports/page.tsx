'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet, Users, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cotisations, members, ApiError } from '@/lib/api'

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i)

type Status = 'idle' | 'loading' | 'success' | 'error'

function ExportCard({
  icon: Icon,
  title,
  description,
  onExport,
  status,
  errorMsg,
  children,
}: {
  icon: React.ElementType
  title: string
  description: string
  onExport: () => void
  status: Status
  errorMsg: string
  children?: React.ReactNode
}) {
  return (
    <div className="mboka-card bg-[#1e1e1e] border rounded-xl p-6 space-y-4">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-[#C8A96E]/10 flex items-center justify-center shrink-0">
          <Icon size={18} className="text-[#C8A96E]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="text-xs text-[#888] mt-0.5">{description}</p>
        </div>
      </div>

      {children}

      {status === 'error' && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/30 border border-red-800/40 rounded-lg px-3 py-2">
          <AlertCircle size={13} />
          {errorMsg}
        </div>
      )}
      {status === 'success' && (
        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 rounded-lg px-3 py-2">
          <CheckCircle2 size={13} />
          Fichier téléchargé avec succès.
        </div>
      )}

      <Button
        onClick={onExport}
        disabled={status === 'loading'}
        size="sm"
        className="bg-[#C8A96E] hover:bg-[#b8955a] text-[#141414] font-semibold gap-2"
      >
        <Download size={14} />
        {status === 'loading' ? 'Export en cours…' : 'Télécharger CSV'}
      </Button>
    </div>
  )
}

export default function ExportsPage() {
  const [cotisYear, setCotisYear] = useState(CURRENT_YEAR)
  const [cotisStatus, setCotisStatus] = useState<Status>('idle')
  const [cotisError, setCotisError] = useState('')

  const [membresStatus, setMembresStatus] = useState<Status>('idle')
  const [membresError, setMembresError] = useState('')

  async function exportCotisations() {
    setCotisStatus('loading')
    setCotisError('')
    try {
      await cotisations.exportCSV(cotisYear)
      setCotisStatus('success')
      setTimeout(() => setCotisStatus('idle'), 3000)
    } catch (err) {
      setCotisStatus('error')
      setCotisError(err instanceof ApiError ? err.message : 'Erreur lors de l\'export.')
    }
  }

  async function exportMembres() {
    setMembresStatus('loading')
    setMembresError('')
    try {
      const data = await members.list({ size: 1000 })
      const rows = data.items
      const header = ['Prénom', 'Nom', 'Email', 'Téléphone', 'Statut', 'Date d\'inscription']
      const lines = rows.map(m => [
        m.first_name,
        m.last_name,
        m.email,
        m.phone ?? '',
        m.status ?? '',
        m.created_at ? new Date(m.created_at).toLocaleDateString('fr-FR') : '',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      const csv = [header.join(','), ...lines].join('\n')
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `membres-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setMembresStatus('success')
      setTimeout(() => setMembresStatus('idle'), 3000)
    } catch (err) {
      setMembresStatus('error')
      setMembresError(err instanceof ApiError ? err.message : 'Erreur lors de l\'export.')
    }
  }

  return (
    <div className="p-8 max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Exports</h1>
        <p className="text-sm text-[#888] mt-1">Téléchargez vos données en format CSV, prêtes pour Excel ou Google Sheets.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ExportCard
          icon={FileSpreadsheet}
          title="Cotisations"
          description="Grille des paiements pour une année donnée, mois par mois et membre par membre."
          onExport={exportCotisations}
          status={cotisStatus}
          errorMsg={cotisError}
        >
          <div className="flex items-center gap-2">
            <label className="text-xs text-[#888] shrink-0">Année</label>
            <select
              value={cotisYear}
              onChange={e => setCotisYear(Number(e.target.value))}
              className="text-xs bg-[#252525] border border-[rgba(255,255,255,0.08)] text-white rounded-md px-2 py-1 focus:outline-none focus:border-[#C8A96E]"
            >
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </ExportCard>

        <ExportCard
          icon={Users}
          title="Liste des membres"
          description="Tous les membres avec leur contact, statut et date d'inscription."
          onExport={exportMembres}
          status={membresStatus}
          errorMsg={membresError}
        />
      </div>

      <p className="text-xs text-[#555] border-t border-[rgba(255,255,255,0.06)] pt-4">
        Les fichiers sont encodés en UTF-8 avec BOM pour une compatibilité optimale avec Excel.
      </p>
    </div>
  )
}
