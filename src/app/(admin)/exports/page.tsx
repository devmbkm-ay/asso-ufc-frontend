'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet, Users, Heart, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cotisations, members, collectes, events, ApiError } from '@/lib/api'

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
    <div className="bg-white border border-primary/15 rounded-xl p-6 space-y-4 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon size={18} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        </div>
      </div>

      {children}

      {status === 'error' && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle size={13} />
          {errorMsg}
        </div>
      )}
      {status === 'success' && (
        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          <CheckCircle2 size={13} />
          Fichier téléchargé avec succès.
        </div>
      )}

      <Button
        onClick={onExport}
        disabled={status === 'loading'}
        size="sm"
        className="bg-primary hover:bg-primary/80 text-white font-semibold gap-2"
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

  const [collectesStatus, setCollectesStatus] = useState<Status>('idle')
  const [collectesError, setCollectesError] = useState('')

  const [eventsStatus, setEventsStatus] = useState<Status>('idle')
  const [eventsError, setEventsError] = useState('')

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

  function downloadCSV(rows: string[][], header: string[], filename: string) {
    const lines = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    const csv = [header.join(','), ...lines].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  async function exportMembres() {
    setMembresStatus('loading')
    setMembresError('')
    try {
      const data = await members.list({ size: 1000 })
      downloadCSV(
        data.items.map(m => [
          m.first_name, m.last_name, m.email, m.phone ?? '', m.status ?? '',
          m.created_at ? new Date(m.created_at).toLocaleDateString('fr-FR') : '',
        ]),
        ['Prénom', 'Nom', 'Email', 'Téléphone', 'Statut', "Date d'inscription"],
        `membres-${new Date().toISOString().slice(0, 10)}.csv`,
      )
      setMembresStatus('success')
      setTimeout(() => setMembresStatus('idle'), 3000)
    } catch (err) {
      setMembresStatus('error')
      setMembresError(err instanceof ApiError ? err.message : "Erreur lors de l'export.")
    }
  }

  async function exportCollectes() {
    setCollectesStatus('loading')
    setCollectesError('')
    try {
      const data = await collectes.list({ include_archived: true })
      const fmt = (iso?: string) => iso ? new Date(iso).toLocaleDateString('fr-FR') : ''
      downloadCSV(
        data.map(c => [
          c.title, c.beneficiary_name, c.category ?? '', c.status,
          fmt(c.start_date), fmt(c.end_date),
          String(c.total_collected), String(c.contributors_count),
          c.is_archived ? 'Oui' : 'Non', fmt(c.archived_at),
        ]),
        [
          'Titre', 'Bénéficiaire', 'Catégorie', 'Statut',
          'Début', 'Fin', 'Total collecté (€)', 'Contributeurs',
          'Archivée', 'Archivée le',
        ],
        `collectes-${new Date().toISOString().slice(0, 10)}.csv`,
      )
      setCollectesStatus('success')
      setTimeout(() => setCollectesStatus('idle'), 3000)
    } catch (err) {
      setCollectesStatus('error')
      setCollectesError(err instanceof ApiError ? err.message : "Erreur lors de l'export.")
    }
  }

  async function exportEvenements() {
    setEventsStatus('loading')
    setEventsError('')
    try {
      const data = await events.list()
      const fmt = (iso: string) => new Date(iso).toLocaleDateString('fr-FR')
      downloadCSV(
        data.map(e => [
          e.title, fmt(e.event_date), e.location ?? '', e.status,
          String(e.registrations_count), String(e.capacity ?? ''),
          String(e.ticket_price),
        ]),
        ['Titre', 'Date', 'Lieu', 'Statut', 'Inscrits', 'Capacité', 'Prix billet (€)'],
        `evenements-${new Date().toISOString().slice(0, 10)}.csv`,
      )
      setEventsStatus('success')
      setTimeout(() => setEventsStatus('idle'), 3000)
    } catch (err) {
      setEventsStatus('error')
      setEventsError(err instanceof ApiError ? err.message : "Erreur lors de l'export.")
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Exports</h1>
        <p className="text-sm text-slate-400 mt-1">Téléchargez vos données en format CSV, prêtes pour Excel ou Google Sheets.</p>
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
            <label className="text-xs text-slate-500 shrink-0">Année</label>
            <select
              value={cotisYear}
              onChange={e => setCotisYear(Number(e.target.value))}
              className="text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-md px-2 py-1 focus:outline-none focus:border-primary"
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

        <ExportCard
          icon={Heart}
          title="Collectes de solidarité"
          description="Toutes les collectes (actives et archivées) avec totaux et nombre de contributeurs."
          onExport={exportCollectes}
          status={collectesStatus}
          errorMsg={collectesError}
        />

        <ExportCard
          icon={Calendar}
          title="Événements"
          description="Tous les événements avec date, lieu, statut et nombre d'inscrits."
          onExport={exportEvenements}
          status={eventsStatus}
          errorMsg={eventsError}
        />
      </div>

      <p className="text-xs text-slate-400 border-t border-slate-100 pt-4">
        Les fichiers sont encodés en UTF-8 avec BOM pour une compatibilité optimale avec Excel.
      </p>
    </div>
  )
}
