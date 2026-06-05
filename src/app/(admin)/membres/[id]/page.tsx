'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { members, cotisations } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Clock } from 'lucide-react'

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  active:    { label: 'Actif',      className: 'bg-emerald-900/40 text-emerald-400 border-emerald-800/50' },
  inactive:  { label: 'Inactif',    className: 'bg-zinc-800 text-zinc-400 border-zinc-700' },
  suspended: { label: 'Suspendu',   className: 'bg-red-900/40 text-red-400 border-red-800/50' },
  honorary:  { label: 'Honoraire',  className: 'bg-purple-900/40 text-purple-400 border-purple-800/50' },
}

const PAYMENT_STATUS: Record<string, { label: string; className: string }> = {
  confirmed: { label: 'Confirmé',   className: 'bg-emerald-900/40 text-emerald-400 border-emerald-800/50' },
  pending:   { label: 'En attente', className: 'bg-amber-900/40 text-amber-400 border-amber-800/50' },
  cancelled: { label: 'Annulé',    className: 'bg-red-900/40 text-red-400 border-red-800/50' },
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtEur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

export default function MembrePage() {
  const { id } = useParams<{ id: string }>()

  const { data: member, isLoading } = useQuery({
    queryKey: ['member', id],
    queryFn: () => members.get(id),
  })

  const { data: payments } = useQuery({
    queryKey: ['payments', id],
    queryFn: () => cotisations.payments({ member_id: id }),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-[#C8A96E] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!member) return null

  const st = STATUS_LABEL[member.status]
  const totalPaid = payments?.filter(p => p.status === 'confirmed').reduce((s, p) => s + p.amount, 0) ?? 0

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <Link
        href="/membres"
        className="flex items-center gap-1.5 text-sm text-[#888] hover:text-white transition-colors w-fit"
      >
        <ArrowLeft size={14} />
        Retour aux membres
      </Link>

      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-[#2D5016] flex items-center justify-center shrink-0">
          <span className="text-lg font-bold text-white">
            {member.first_name[0]}{member.last_name[0]}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold text-white">
              {member.first_name} {member.last_name}
            </h1>
            <Badge className={`text-[10px] border ${st.className}`}>{st.label}</Badge>
          </div>
          {member.roles.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {member.roles.map(r => (
                <span key={r} className="text-xs text-[#C8A96E] bg-[#C8A96E]/10 px-2 py-0.5 rounded">
                  {r}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#1e1e1e] rounded-xl border border-[rgba(255,255,255,0.06)] p-5 space-y-4">
          <h2 className="text-[10px] font-semibold tracking-wider text-[#555] uppercase">Informations</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail size={14} className="text-[#C8A96E] shrink-0" />
              <span className="text-white">{member.email}</span>
            </div>
            {member.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone size={14} className="text-[#C8A96E] shrink-0" />
                <span className="text-white">{member.phone}</span>
              </div>
            )}
            {member.address && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin size={14} className="text-[#C8A96E] shrink-0" />
                <span className="text-white">{member.address}</span>
              </div>
            )}
            {member.birth_date && (
              <div className="flex items-center gap-3 text-sm">
                <Calendar size={14} className="text-[#C8A96E] shrink-0" />
                <span className="text-white">{fmtDate(member.birth_date)}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Clock size={14} className="text-[#C8A96E] shrink-0" />
              <span className="text-[#888]">
                Membre depuis le <span className="text-white">{fmtDate(member.joined_at)}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#1e1e1e] rounded-xl border border-[rgba(255,255,255,0.06)] p-5 space-y-4">
          <h2 className="text-[10px] font-semibold tracking-wider text-[#555] uppercase">Cotisations</h2>
          {payments ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#888]">Total versé</span>
                <span className="text-sm font-semibold text-[#C8A96E]">{fmtEur(totalPaid)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#888]">Paiements enregistrés</span>
                <span className="text-sm text-white">{payments.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#888]">En attente</span>
                <span className="text-sm text-amber-400">
                  {payments.filter(p => p.status === 'pending').length}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#555]">Chargement…</p>
          )}
        </div>
      </div>

      <div className="bg-[#1e1e1e] rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
          <h2 className="text-sm font-semibold text-white">Historique des paiements</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.06)]">
              <th className="text-left px-5 py-3 text-[10px] font-semibold tracking-wider text-[#555] uppercase">Date</th>
              <th className="text-left px-5 py-3 text-[10px] font-semibold tracking-wider text-[#555] uppercase">Plan</th>
              <th className="text-left px-5 py-3 text-[10px] font-semibold tracking-wider text-[#555] uppercase hidden sm:table-cell">Méthode</th>
              <th className="text-right px-5 py-3 text-[10px] font-semibold tracking-wider text-[#555] uppercase">Montant</th>
              <th className="text-left px-5 py-3 text-[10px] font-semibold tracking-wider text-[#555] uppercase">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
            {!payments && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-[#555]">Chargement…</td></tr>
            )}
            {payments?.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-[#555]">Aucun paiement enregistré</td></tr>
            )}
            {payments?.map(p => {
              const ps = PAYMENT_STATUS[p.status] ?? { label: p.status, className: 'bg-zinc-800 text-zinc-400 border-zinc-700' }
              return (
                <tr key={p.id} className="hover:bg-[rgba(255,255,255,0.02)]">
                  <td className="px-5 py-3 text-[#888]">{fmtDate(p.payment_date)}</td>
                  <td className="px-5 py-3 text-white">{p.plan_label}</td>
                  <td className="px-5 py-3 text-[#888] capitalize hidden sm:table-cell">{p.method}</td>
                  <td className="px-5 py-3 text-right font-medium text-white">{fmtEur(p.amount)}</td>
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
