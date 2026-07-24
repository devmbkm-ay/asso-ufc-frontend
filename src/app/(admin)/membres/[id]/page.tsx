'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { members, cotisations, ApiError } from '@/lib/api'
import { useAuth } from '@/providers/AuthProvider'
import { StatusBadge, type StatusBadgeProps } from '@/components/ui/status-badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Mail, Phone, MapPin, Calendar, Clock, ChevronLeft, ChevronRight, Pencil,
  CheckCircle2, XCircle, Circle, Info,
} from 'lucide-react'
import { avatarColor } from '@/lib/utils'

const FIELD = 'bg-white border-slate-200 text-slate-800 placeholder:text-muted-foreground focus:border-primary'

const CURRENT_YEAR = new Date().getFullYear()
const MONTHS_SHORT = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
const MONTHS_FULL = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

const METHOD_LABELS: Record<string, string> = {
  cash: 'Espèces',
  bank_transfer: 'Virement',
  lydia: 'Lydia',
  sumeria: 'Sumeria',
  other: 'Autre',
}

const STATUS_LABEL: Record<string, { label: string; status: StatusBadgeProps['status']; icon: React.ReactNode }> = {
  active: { label: 'Actif', status: 'active', icon: <CheckCircle2 size={11} /> },
  inactive: { label: 'Inactif', status: 'inactive', icon: <Circle size={11} /> },
  suspended: { label: 'Suspendu', status: 'cancelled', icon: <XCircle size={11} /> },
  honorary: { label: 'Honoraire', status: 'info', icon: <Info size={11} /> },
}

const PAYMENT_STATUS: Record<string, { label: string; status: StatusBadgeProps['status']; icon: React.ReactNode }> = {
  confirmed: { label: 'Confirmé', status: 'completed', icon: <CheckCircle2 size={11} /> },
  pending: { label: 'En attente', status: 'pending', icon: <Clock size={11} /> },
  cancelled: { label: 'Annulé', status: 'cancelled', icon: <XCircle size={11} /> },
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtEur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

export default function MembrePage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [tableYear, setTableYear] = useState(CURRENT_YEAR)

  const canEdit = user?.roles.some(r => ['super_admin', 'secretary'].includes(r))

  const [openEdit, setOpenEdit] = useState(false)
  const [editForm, setEditForm] = useState({ first_name: '', last_name: '', phone: '', address: '', birth_date: '' })
  const [editError, setEditError] = useState<string | null>(null)

  const { data: member, isLoading } = useQuery({
    queryKey: ['member', id],
    queryFn: () => members.get(id),
  })

  const { mutate: updateMember, isPending: editPending } = useMutation({
    mutationFn: (data: Parameters<typeof members.update>[1]) => members.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member', id] })
      setOpenEdit(false)
    },
    onError: (err: unknown) => {
      setEditError(err instanceof ApiError ? err.message : 'Erreur inattendue')
    },
  })

  function openEditModal() {
    if (!member) return
    setEditForm({
      first_name: member.first_name,
      last_name: member.last_name,
      phone: member.phone ?? '',
      address: member.address ?? '',
      birth_date: member.birth_date ?? '',
    })
    setEditError(null)
    setOpenEdit(true)
  }

  function editField(key: keyof typeof editForm) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setEditForm(f => ({ ...f, [key]: e.target.value }))
  }

  function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEditError(null)
    updateMember({
      first_name: editForm.first_name,
      last_name: editForm.last_name,
      phone: editForm.phone || undefined,
      address: editForm.address || undefined,
      birth_date: editForm.birth_date || undefined,
    })
  }

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
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!member) return null

  const st = STATUS_LABEL[member.status]
  const allItems = allPayments?.items ?? []
  const yearItems = yearPayments?.items ?? []

  const totalPaid = allItems.filter(p => p.status === 'confirmed').reduce((s, p) => s + p.amount, 0)
  const pendingCount = allItems.filter(p => p.status === 'pending').length

  // Current-year confirmed months
  const paidMonthsThisYear = new Set(
    allItems
      .filter(p => p.period_year === CURRENT_YEAR && p.status === 'confirmed' && p.period_month)
      .map(p => p.period_month),
  )

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <Breadcrumb
        items={[
          { label: 'Tableau de bord', href: '/dashboard' },
          { label: 'Membres', href: '/membres' },
          { label: `${member.first_name} ${member.last_name}` },
        ]}
      />

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
            <StatusBadge status={st.status} label={st.label} icon={st.icon} />
            {canEdit && (
              <button
                onClick={openEditModal}
                className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                title="Modifier le profil"
              >
                <Pencil size={13} />
              </button>
            )}
          </div>
          {member.roles.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {member.roles.map(r => (
                <span key={r} className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {r}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {canEdit && (
        <Dialog open={openEdit} onOpenChange={setOpenEdit}>
          <DialogContent className="bg-white border-primary/15 sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Modifier le profil</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleEditSubmit} className="space-y-4 mt-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500">Prénom</label>
                  <Input value={editForm.first_name} onChange={editField('first_name')} required className={FIELD} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500">Nom</label>
                  <Input value={editForm.last_name} onChange={editField('last_name')} required className={FIELD} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-500">Téléphone</label>
                <Input value={editForm.phone} onChange={editField('phone')} placeholder="06 00 00 00 00" className={FIELD} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-500">Adresse</label>
                <Input value={editForm.address} onChange={editField('address')} className={FIELD} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-500">Date de naissance</label>
                <Input type="date" value={editForm.birth_date} onChange={editField('birth_date')} className={FIELD} />
              </div>

              <p className="text-xs text-muted-foreground">
                L&apos;email ({member.email}) ne peut pas être modifié pour l&apos;instant.
              </p>

              {editError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {editError}
                </p>
              )}

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenEdit(false)}
                  className="border-slate-200 text-muted-foreground bg-transparent"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={editPending}
                  className="bg-primary hover:bg-primary/80 text-white"
                >
                  {editPending ? 'Enregistrement…' : 'Enregistrer'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Info + Cotisations cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="bg-white rounded-xl border border-primary/15 shadow-sm p-5 space-y-4">
          <h2 className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Informations</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail size={14} className="text-primary shrink-0" />
              <span className="text-slate-800">{member.email}</span>
            </div>
            {member.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone size={14} className="text-primary shrink-0" />
                <span className="text-slate-800">{member.phone}</span>
              </div>
            )}
            {member.address && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin size={14} className="text-primary shrink-0" />
                <span className="text-slate-800">{member.address}</span>
              </div>
            )}
            {member.birth_date && (
              <div className="flex items-center gap-3 text-sm">
                <Calendar size={14} className="text-primary shrink-0" />
                <span className="text-slate-800">{fmtDate(member.birth_date)}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Clock size={14} className="text-primary shrink-0" />
              <span className="text-slate-500">
                Membre depuis le <span className="text-slate-800">{fmtDate(member.joined_at)}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-primary/15 shadow-sm p-5 space-y-4">
          <h2 className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Cotisations</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Total versé</span>
              <span className="text-sm font-semibold text-primary">{fmtEur(totalPaid)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500">Paiements enregistrés</span>
              <span className="text-sm text-slate-800">{allItems.length}</span>
            </div>
            {pendingCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">En attente</span>
                <span className="text-sm text-amber-700 font-medium">{pendingCount}</span>
              </div>
            )}
          </div>

          {/* Month progress for current year */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-[10px] text-muted-foreground mb-2">
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
                    className={`flex-1 h-5 rounded-sm flex items-center justify-center text-[9px] font-semibold transition-colors ${paid
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-muted-foreground'
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
      <div className="bg-white rounded-xl border border-primary/15 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-slate-800">Historique des paiements</h2>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <button
              onClick={() => setTableYear(y => y - 1)}
              aria-label="Année précédente"
              className="text-muted-foreground hover:text-slate-800 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-semibold text-slate-800 w-8 text-center select-none">{tableYear}</span>
            <button
              onClick={() => setTableYear(y => y + 1)}
              disabled={tableYear >= CURRENT_YEAR}
              aria-label="Année suivante"
              className="text-muted-foreground hover:text-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-5 py-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Période</th>
              <th className="text-left px-5 py-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase hidden sm:table-cell">Plan</th>
              <th className="text-left px-5 py-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase hidden md:table-cell">Méthode</th>
              <th className="text-left px-5 py-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase hidden md:table-cell">Date</th>
              <th className="text-right px-5 py-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Montant</th>
              <th className="text-left px-5 py-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoadingYear && (
              <tr>
                <td colSpan={6} className="px-5 py-5">
                  <Skeleton className="h-10 w-full" />
                </td>
              </tr>
            )}
            {!isLoadingYear && yearItems.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-5">
                  <EmptyState
                    title={`Aucun paiement enregistré en ${tableYear}`}
                    description="Les paiements de ce membre apparaîtront ici une fois enregistrés."
                  />
                </td>
              </tr>
            )}
            {yearItems.map(p => {
              const ps = PAYMENT_STATUS[p.status] ?? { label: p.status, status: 'inactive' as const, icon: <Circle size={11} /> }
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
                    <StatusBadge status={ps.status} label={ps.label} icon={ps.icon} />
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
