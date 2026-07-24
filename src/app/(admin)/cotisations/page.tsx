'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cotisations, ApiError } from '@/lib/api'
import { useAuth } from '@/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock, Plus, ToggleLeft, Zap, UserCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
const MONTHS_FULL = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

const METHOD_LABELS: Record<string, string> = {
  cash: 'Espèces',
  bank_transfer: 'Virement',
  lydia: 'Lydia',
  sumeria: 'Sumeria',
  other: 'Autre',
}

const CELL_STYLE: Record<string, string> = {
  confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200',
  declared: 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200',
  pending: 'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200',
  cancelled: 'bg-red-100 text-red-600 border-red-300 hover:bg-red-200',
  none: 'bg-muted text-transparent border-border hover:bg-slate-200 hover:border-primary',
}

const CELL_SYMBOL: Record<string, string> = {
  confirmed: '✓',
  declared: '~',
  pending: '·',
  cancelled: '✕',
  none: '+',
}

function fmtEur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

type SelectedCell = {
  memberId: string
  memberName: string
  month: number
  year: number
  cell: import('@/lib/types').MonthCell
}

const EMPTY_FORM = {
  plan_id: '',
  amount: '',
  method: 'cash',
  payment_date: new Date().toISOString().split('T')[0],
  reference: '',
}

const FIELD = 'bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-primary'

const FREQ_LABELS: Record<string, string> = {
  monthly: 'Mensuelle',
  annual: 'Annuelle',
  one_time: 'Ponctuelle',
}

const EMPTY_PLAN = {
  label: '',
  amount: '',
  frequency: 'annual' as 'monthly' | 'annual' | 'one_time',
  valid_from: new Date().toISOString().split('T')[0],
  valid_until: '',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function periodLabel(p: { period_month?: number | null; period_year: number }) {
  return p.period_month
    ? `${MONTHS_FULL[p.period_month - 1]} ${p.period_year}`
    : String(p.period_year)
}

export default function CotisationsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const currentYear = new Date().getFullYear()

  const [year, setYear] = useState(currentYear)
  const [selected, setSelected] = useState<SelectedCell | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)

  // Plan management
  const [planOpen, setPlanOpen] = useState(false)
  const [planForm, setPlanForm] = useState(EMPTY_PLAN)
  const [planError, setPlanError] = useState<string | null>(null)

  const canWrite = user?.roles.some(r => ['super_admin', 'treasurer'].includes(r))
  const canValidate = user?.roles.some(r => ['super_admin', 'treasurer', 'secretary'].includes(r))
  const canAdmin = user?.roles.includes('super_admin')

  const { data: grid, isLoading } = useQuery({
    queryKey: ['cotisations-grid', year],
    queryFn: () => cotisations.grid(year),
  })

  // Tous les paiements déclarés, y compris les plans annuels/ponctuels
  // (period_month = null) — invisibles dans la grille mensuelle ci-dessous.
  const { data: declaredPayments } = useQuery({
    queryKey: ['cotisations-declared'],
    queryFn: () => cotisations.payments({ status: 'declared', size: 200 }),
    enabled: !!canValidate,
  })

  const { data: plans } = useQuery({
    queryKey: ['cotisations-plans'],
    queryFn: () => cotisations.plans(),
    enabled: !!canWrite,
  })

  const { mutate: createPlan, isPending: isCreatingPlan } = useMutation({
    mutationFn: cotisations.createPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotisations-plans'] })
      setPlanOpen(false)
      setPlanForm(EMPTY_PLAN)
      setPlanError(null)
    },
    onError: (err: unknown) =>
      setPlanError(err instanceof ApiError ? err.message : 'Erreur inattendue'),
  })

  const { mutate: deactivatePlan } = useMutation({
    mutationFn: (id: string) => cotisations.updatePlan(id, { is_active: false }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cotisations-plans'] }),
  })

  const [initingPlanId, setInitingPlanId] = useState<string | null>(null)
  const { mutate: initPayments } = useMutation({
    mutationFn: (id: string) => cotisations.initPlanPayments(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['cotisations-grid', year] })
      setInitingPlanId(null)
    },
    onError: () => setInitingPlanId(null),
  })

  function handlePlanSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPlanError(null)
    createPlan({
      label: planForm.label,
      amount: Number(planForm.amount),
      frequency: planForm.frequency,
      valid_from: planForm.valid_from,
      valid_until: planForm.valid_until || undefined,
    })
  }

  const { mutate: record, isPending: isRecording } = useMutation({
    mutationFn: cotisations.record,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotisations-grid', year] })
      close()
    },
    onError: (err: unknown) =>
      setFormError(err instanceof ApiError ? err.message : 'Erreur inattendue'),
  })

  const { mutate: confirm, isPending: isConfirming } = useMutation({
    mutationFn: cotisations.confirm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotisations-grid', year] })
      close()
    },
  })

  const { mutate: cancelPayment, isPending: isCancelling } = useMutation({
    mutationFn: cotisations.cancelPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotisations-grid', year] })
      close()
    },
  })

  const { mutate: validatePayment, isPending: isValidating } = useMutation({
    mutationFn: cotisations.validatePayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotisations-grid', year] })
      queryClient.invalidateQueries({ queryKey: ['cotisations-declared'] })
      close()
    },
  })

  const { mutate: rejectPayment, isPending: isRejecting } = useMutation({
    mutationFn: cotisations.rejectPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cotisations-grid', year] })
      queryClient.invalidateQueries({ queryKey: ['cotisations-declared'] })
      close()
    },
  })

  const [decidingId, setDecidingId] = useState<string | null>(null)

  function decideDeclared(id: string, action: 'validate' | 'reject') {
    setDecidingId(id)
    const mutate = action === 'validate' ? validatePayment : rejectPayment
    mutate(id, { onSettled: () => setDecidingId(null) })
  }

  function close() {
    setSelected(null)
    setForm(EMPTY_FORM)
    setFormError(null)
  }

  function openCell(
    memberId: string,
    memberName: string,
    month: number,
    cell: import('@/lib/types').MonthCell,
  ) {
    if (!canWrite) return
    setFormError(null)
    setSelected({ memberId, memberName, month, year, cell })
    if (cell.status === 'none' && plans?.length) {
      const first = plans[0]
      setForm({ ...EMPTY_FORM, plan_id: first.id, amount: String(first.amount) })
    } else {
      setForm(EMPTY_FORM)
    }
  }

  function handlePlanChange(planId: string) {
    const plan = plans?.find(p => p.id === planId)
    setForm(f => ({ ...f, plan_id: planId, amount: plan ? String(plan.amount) : f.amount }))
  }

  function handleRecord(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setFormError(null)
    record({
      member_id: selected.memberId,
      cotisation_plan_id: form.plan_id,
      amount: Number(form.amount),
      payment_date: form.payment_date,
      period_month: selected.month,
      period_year: selected.year,
      method: form.method,
      reference: form.reference || undefined,
    })
  }

  const totalRevenue = grid?.reduce((sum, row) =>
    sum + row.months.reduce((s, m) => s + (m.status === 'confirmed' ? (m.amount ?? 0) : 0), 0), 0) ?? 0
  const confirmedCount = grid?.reduce((sum, row) =>
    sum + row.months.filter(m => m.status === 'confirmed').length, 0) ?? 0
  const declaredCount = grid?.reduce((sum, row) =>
    sum + row.months.filter(m => m.status === 'declared').length, 0) ?? 0
  const pendingCount = grid?.reduce((sum, row) =>
    sum + row.months.filter(m => m.status === 'pending').length, 0) ?? 0

  const dialogTitle = selected
    ? `${selected.memberName} — ${MONTHS_FULL[selected.month - 1]} ${selected.year}`
    : ''

  return (
    <div className="p-8 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Cotisations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLoading
              ? '—'
              : `${confirmedCount} confirmés · ${declaredCount > 0 ? `${declaredCount} à valider · ` : ''}${pendingCount} en attente · ${fmtEur(totalRevenue)} encaissés`}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-card border border-border shadow-sm rounded-lg px-3 py-2">
          <button
            onClick={() => setYear(y => y - 1)}
            aria-label="Année précédente"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-foreground w-10 text-center select-none">{year}</span>
          <button
            onClick={() => setYear(y => y + 1)}
            disabled={year >= currentYear}
            aria-label="Année suivante"
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Plans de cotisation */}
      {canWrite && (
        <div className="bg-card rounded-xl border border-primary/15 shadow-sm p-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Plans de cotisation</h2>
            <button
              onClick={() => { setPlanOpen(true); setPlanError(null); setPlanForm(EMPTY_PLAN) }}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary transition-colors font-medium"
            >
              <Plus size={13} />
              Nouveau plan
            </button>
          </div>

          {!plans?.length && (
            <p className="text-xs text-muted-foreground italic">
              Aucun plan actif — créez un plan pour pouvoir enregistrer des paiements.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {plans?.map(p => (
              <div
                key={p.id}
                className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-lg px-3 py-2"
              >
                <div>
                  <p className="text-xs font-semibold text-foreground">{p.label}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {fmtEur(Number(p.amount))} · {FREQ_LABELS[p.frequency] ?? p.frequency}
                    {p.valid_until && ` · jusqu'au ${fmtDate(p.valid_until)}`}
                  </p>
                </div>
                {canWrite && (
                  <div className="ml-1 flex items-center gap-1">
                    <button
                      onClick={() => { setInitingPlanId(p.id); initPayments(p.id) }}
                      disabled={initingPlanId === p.id}
                      title="Initialiser les cotisations en attente pour tous les membres"
                      className="text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                    >
                      <Zap size={13} />
                    </button>
                    <button
                      onClick={() => deactivatePlan(p.id)}
                      title="Désactiver ce plan"
                      className="text-muted-foreground hover:text-red-400 transition-colors"
                    >
                      <ToggleLeft size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cotisations à valider — inclut les plans annuels/ponctuels, absents de la grille */}
      {canValidate && !!declaredPayments?.items.length && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
          <h2 className="text-xs font-semibold tracking-wider text-blue-700 uppercase flex items-center gap-1.5">
            <UserCheck size={13} />
            {declaredPayments.items.length} cotisation{declaredPayments.items.length > 1 ? 's' : ''} à valider
          </h2>
          <div className="space-y-2">
            {declaredPayments.items.map(p => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 bg-card border border-blue-100 rounded-lg px-4 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.member_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.plan_label} · {periodLabel(p)} · {fmtEur(p.amount)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => decideDeclared(p.id, 'reject')}
                    disabled={decidingId === p.id}
                    className="border-red-200 text-red-600 bg-transparent hover:bg-red-50 h-8 px-2.5"
                  >
                    <XCircle size={13} />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => decideDeclared(p.id, 'validate')}
                    disabled={decidingId === p.id}
                    className="bg-primary hover:bg-primary/80 text-primary-foreground h-8 px-2.5"
                  >
                    <CheckCircle2 size={13} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="bg-card rounded-xl border border-primary/15 shadow-sm overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase sticky left-0 bg-card min-w-[180px] z-10">
                Membre
              </th>
              {MONTHS.map(m => (
                <th key={m} className="px-1.5 py-3.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase text-center min-w-[48px]">
                  {m}
                </th>
              ))}
              <th className="px-4 py-3.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase text-right whitespace-nowrap">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={14} className="px-4 py-4">
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </td>
              </tr>
            )}
            {!isLoading && grid?.length === 0 && (
              <tr>
                <td colSpan={14} className="px-4 py-4">
                  <EmptyState
                    title={`Aucune donnée pour ${year}`}
                    description="Aucune cotisation n’a encore été enregistrée pour cette année."
                  />
                </td>
              </tr>
            )}
            {grid?.map(row => {
              const rowTotal = row.months.reduce(
                (s, m) => s + (m.status === 'confirmed' ? (m.amount ?? 0) : 0), 0)
              return (
                <tr key={row.member_id} className="hover:bg-muted">
                  <td className="px-4 py-2.5 sticky left-0 bg-card font-medium text-foreground whitespace-nowrap z-10">
                    {row.member_name}
                  </td>
                  {row.months.map(cell => (
                    <td key={cell.month} className="px-1.5 py-2.5 text-center">
                      <button
                        onClick={() => openCell(row.member_id, row.member_name, cell.month, cell)}
                        disabled={!canWrite}
                        title={
                          cell.status !== 'none'
                            ? `${cell.status}${cell.amount ? ` · ${fmtEur(cell.amount)}` : ''}`
                            : canWrite ? 'Enregistrer un paiement' : undefined
                        }
                        className={cn(
                          'mx-auto w-8 h-7 rounded border flex items-center justify-center text-[11px] font-semibold transition-colors',
                          CELL_STYLE[cell.status],
                          canWrite ? 'cursor-pointer' : 'cursor-default',
                          cell.status === 'none' && !canWrite && 'opacity-60',
                        )}
                      >
                        {/* show '+' only for none+canWrite, otherwise symbol */}
                        {cell.status === 'none'
                          ? (canWrite ? <span className="text-primary opacity-0 group-hover:opacity-100">+</span> : '')
                          : CELL_SYMBOL[cell.status]}
                      </button>
                    </td>
                  ))}
                  <td className="px-4 py-2.5 text-right font-semibold whitespace-nowrap">
                    <span className={rowTotal > 0 ? 'text-primary' : 'text-muted-foreground'}>
                      {rowTotal > 0 ? fmtEur(rowTotal) : '—'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-4 rounded border bg-emerald-100 border-emerald-300 flex items-center justify-center text-emerald-700 text-[10px]">✓</div>
          Confirmé
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-4 rounded border bg-blue-100 border-blue-300 flex items-center justify-center text-blue-700 text-[10px]">~</div>
          À valider
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
          <div className="w-5 h-4 rounded border bg-muted border-border" />
          Non payé
        </div>
      </div>

      {/* Cell dialog */}
      <Dialog open={!!selected} onOpenChange={open => { if (!open) close() }}>
        <DialogContent className="bg-card border-primary/15 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">{dialogTitle}</DialogTitle>
          </DialogHeader>

          {/* ── Record (none) ── */}
          {selected?.cell.status === 'none' && (
            <form onSubmit={handleRecord} className="space-y-3 mt-1">
              <div className="space-y-1.5">
                <label htmlFor="payment-plan" className="text-xs text-muted-foreground">Plan de cotisation</label>
                <select
                  id="payment-plan"
                  value={form.plan_id}
                  onChange={e => handlePlanChange(e.target.value)}
                  required
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="">Sélectionner un plan</option>
                  {plans?.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.label} — {fmtEur(Number(p.amount))}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="payment-amount" className="text-xs text-muted-foreground">Montant (€)</label>
                  <Input
                    id="payment-amount"
                    type="number"
                    min={1}
                    step="0.01"
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    required
                    className={FIELD}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="payment-date" className="text-xs text-muted-foreground">Date</label>
                  <Input
                    id="payment-date"
                    type="date"
                    value={form.payment_date}
                    onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))}
                    required
                    className={FIELD}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="payment-method" className="text-xs text-muted-foreground">Méthode</label>
                <select
                  id="payment-method"
                  value={form.method}
                  onChange={e => setForm(f => ({ ...f, method: e.target.value }))}
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                >
                  {Object.entries(METHOD_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="payment-reference" className="text-xs text-muted-foreground">
                  Référence <span className="text-muted-foreground">(optionnel)</span>
                </label>
                <Input
                  id="payment-reference"
                  value={form.reference}
                  onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
                  placeholder="N° de chèque, virement…"
                  className={FIELD}
                />
              </div>

              {formError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}

              <DialogFooter className="gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={close}
                  className="border-border text-muted-foreground bg-transparent"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isRecording || !form.plan_id}
                  className="bg-primary hover:bg-primary/80 text-primary-foreground"
                >
                  {isRecording ? 'Enregistrement…' : 'Enregistrer'}
                </Button>
              </DialogFooter>
            </form>
          )}

          {/* ── Confirm or cancel (pending) ── */}
          {selected?.cell.status === 'pending' && (
            <div className="space-y-4 mt-1">
              <div className="flex items-center gap-3 px-3 py-3 bg-amber-50 rounded-lg border border-amber-200">
                <Clock size={16} className="text-amber-700 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">En attente de confirmation</p>
                  {selected.cell.amount != null && (
                    <p className="text-xs text-amber-700 mt-0.5">{fmtEur(selected.cell.amount)}</p>
                  )}
                </div>
              </div>
              <DialogFooter className="gap-2">
                {canAdmin && (
                  <Button
                    variant="outline"
                    onClick={() => selected.cell.payment_id && cancelPayment(selected.cell.payment_id)}
                    disabled={isCancelling}
                    className="border-red-200 text-red-600 bg-transparent hover:bg-red-50"
                  >
                    {isCancelling ? 'Annulation…' : 'Annuler'}
                  </Button>
                )}
                <Button
                  onClick={() => selected.cell.payment_id && confirm(selected.cell.payment_id)}
                  disabled={isConfirming}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isConfirming ? 'Confirmation…' : 'Confirmer le paiement'}
                </Button>
              </DialogFooter>
            </div>
          )}

          {/* ── Validate or reject (declared) ── */}
          {selected?.cell.status === 'declared' && (
            <div className="space-y-4 mt-1">
              <div className="flex items-center gap-3 px-3 py-3 bg-blue-50 rounded-lg border border-blue-200">
                <UserCheck size={16} className="text-blue-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Déclaré par le membre</p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    {selected.cell.amount != null ? fmtEur(selected.cell.amount) + ' · ' : ''}
                    En attente de validation
                  </p>
                </div>
              </div>
              {canValidate && (
                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => selected.cell.payment_id && rejectPayment(selected.cell.payment_id)}
                    disabled={isRejecting || isValidating}
                    className="border-amber-200 text-amber-700 bg-transparent hover:bg-amber-50"
                  >
                    {isRejecting ? 'Rejet…' : 'Rejeter'}
                  </Button>
                  <Button
                    onClick={() => selected.cell.payment_id && validatePayment(selected.cell.payment_id)}
                    disabled={isValidating || isRejecting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                  >
                    <CheckCircle2 size={14} />
                    {isValidating ? 'Validation…' : 'Valider'}
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}

          {/* ── Details (confirmed) ── */}
          {selected?.cell.status === 'confirmed' && (
            <div className="space-y-4 mt-1">
              <div className="flex items-center gap-3 px-3 py-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-emerald-800">Paiement confirmé</p>
                  {selected.cell.amount != null && (
                    <p className="text-xs text-emerald-600 mt-0.5">{fmtEur(selected.cell.amount)}</p>
                  )}
                </div>
              </div>
              {canAdmin && (
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => selected.cell.payment_id && cancelPayment(selected.cell.payment_id)}
                    disabled={isCancelling}
                    className="border-red-200 text-red-600 bg-transparent hover:bg-red-50"
                  >
                    {isCancelling ? 'Annulation…' : 'Annuler ce paiement'}
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}

          {/* ── Details (cancelled) ── */}
          {selected?.cell.status === 'cancelled' && (
            <div className="flex items-center gap-3 px-3 py-3 bg-red-50 rounded-lg border border-red-200 mt-1">
              <XCircle size={16} className="text-red-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Paiement annulé</p>
                {selected.cell.amount != null && (
                  <p className="text-xs text-red-500 mt-0.5">{fmtEur(selected.cell.amount)}</p>
                )}
              </div>
            </div>
          )}

        </DialogContent>
      </Dialog>

      {/* Plan creation dialog */}
      <Dialog open={planOpen} onOpenChange={open => { if (!open) { setPlanOpen(false); setPlanError(null) } }}>
        <DialogContent className="bg-card border-primary/15 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Nouveau plan de cotisation</DialogTitle>
          </DialogHeader>

          <form onSubmit={handlePlanSubmit} className="space-y-3 mt-1">
            <div className="space-y-1.5">
              <label htmlFor="plan-label" className="text-xs text-muted-foreground">Libellé</label>
              <Input
                id="plan-label"
                value={planForm.label}
                onChange={e => setPlanForm(f => ({ ...f, label: e.target.value }))}
                required
                placeholder="Cotisation annuelle 2026"
                className={FIELD}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="plan-amount" className="text-xs text-muted-foreground">Montant (€)</label>
                <Input
                  id="plan-amount"
                  type="number"
                  min={1}
                  step="0.01"
                  value={planForm.amount}
                  onChange={e => setPlanForm(f => ({ ...f, amount: e.target.value }))}
                  required
                  className={FIELD}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="plan-frequency" className="text-xs text-muted-foreground">Fréquence</label>
                <select
                  id="plan-frequency"
                  value={planForm.frequency}
                  onChange={e => setPlanForm(f => ({ ...f, frequency: e.target.value as typeof f.frequency }))}
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="annual">Annuelle</option>
                  <option value="monthly">Mensuelle</option>
                  <option value="one_time">Ponctuelle</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="plan-valid-from" className="text-xs text-muted-foreground">Valide à partir du</label>
                <Input
                  id="plan-valid-from"
                  type="date"
                  value={planForm.valid_from}
                  onChange={e => setPlanForm(f => ({ ...f, valid_from: e.target.value }))}
                  required
                  className={FIELD}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="plan-valid-until" className="text-xs text-muted-foreground">Expire le <span className="text-muted-foreground">(optionnel)</span></label>
                <Input
                  id="plan-valid-until"
                  type="date"
                  value={planForm.valid_until}
                  onChange={e => setPlanForm(f => ({ ...f, valid_until: e.target.value }))}
                  className={FIELD}
                />
              </div>
            </div>

            {planError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {planError}
              </p>
            )}

            <DialogFooter className="gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setPlanOpen(false); setPlanError(null) }}
                className="border-border text-muted-foreground bg-transparent"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isCreatingPlan}
                className="bg-primary hover:bg-primary/80 text-primary-foreground"
              >
                {isCreatingPlan ? 'Création…' : 'Créer le plan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
