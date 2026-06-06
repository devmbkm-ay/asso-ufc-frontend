'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { members, cotisations } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Clock } from 'lucide-react'

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  active:    { label: 'Actif',      className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  inactive:  { label: 'Inactif',    className: 'bg-gray-100 text-gray-500 border-gray-200' },
  suspended: { label: 'Suspendu',   className: 'bg-red-50 text-red-600 border-red-200' },
  honorary:  { label: 'Honoraire',  className: 'bg-purple-50 text-purple-600 border-purple-200' },
}

const PAYMENT_STATUS: Record<string, { label: string; className: string }> = {
  confirmed: { label: 'Confirmé',   className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  pending:   { label: 'En attente', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  cancelled: { label: 'Annulé',    className: 'bg-red-50 text-red-600 border-red-200' },
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
        className="flex items-center gap-1.5 text-sm text-[#6B6560] hover:text-[#1a1a1a] transition-colors w-fit"
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
            <h1 className="text-2xl font-semibold text-[#1a1a1a]">
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
        <div className="bg-white rounded-xl border border-[rgba(200,169,110,0.18)] shadow-sm p-5 space-y-4">
          <h2 className="text-[10px] font-semibold tracking-wider text-[#9B928B] uppercase">Informations</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail size={14} className="text-[#C8A96E] shrink-0" />
              <span className="text-[#1a1a1a]">{member.email}</span>
            </div>
            {member.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone size={14} className="text-[#C8A96E] shrink-0" />
                <span className="text-[#1a1a1a]">{member.phone}</span>
              </div>
            )}
            {member.address && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin size={14} className="text-[#C8A96E] shrink-0" />
                <span className="text-[#1a1a1a]">{member.address}</span>
              </div>
            )}
            {member.birth_date && (
              <div className="flex items-center gap-3 text-sm">
                <Calendar size={14} className="text-[#C8A96E] shrink-0" />
                <span className="text-[#1a1a1a]">{fmtDate(member.birth_date)}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Clock size={14} className="text-[#C8A96E] shrink-0" />
              <span className="text-[#6B6560]">
                Membre depuis le <span className="text-[#1a1a1a]">{fmtDate(member.joined_at)}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[rgba(200,169,110,0.18)] shadow-sm p-5 space-y-4">
          <h2 className="text-[10px] font-semibold tracking-wider text-[#9B928B] uppercase">Cotisations</h2>
          {payments ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6B6560]">Total versé</span>
                <span className="text-sm font-semibold text-[#C8A96E]">{fmtEur(totalPaid)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6B6560]">Paiements enregistrés</span>
                <span className="text-sm text-[#1a1a1a]">{payments.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6B6560]">En attente</span>
                <span className="text-sm text-amber-600">
                  {payments.filter(p => p.status === 'pending').length}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#9B928B]">Chargement…</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[rgba(200,169,110,0.18)] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[rgba(0,0,0,0.06)]">
          <h2 className="text-sm font-semibold text-[#1a1a1a]">Historique des paiements</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgba(0,0,0,0.06)]">
              <th className="text-left px-5 py-3 text-[10px] font-semibold tracking-wider text-[#9B928B] uppercase">Date</th>
              <th className="text-left px-5 py-3 text-[10px] font-semibold tracking-wider text-[#9B928B] uppercase">Plan</th>
              <th className="text-left px-5 py-3 text-[10px] font-semibold tracking-wider text-[#9B928B] uppercase hidden sm:table-cell">Méthode</th>
              <th className="text-right px-5 py-3 text-[10px] font-semibold tracking-wider text-[#9B928B] uppercase">Montant</th>
              <th className="text-left px-5 py-3 text-[10px] font-semibold tracking-wider text-[#9B928B] uppercase">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(0,0,0,0.04)]">
            {!payments && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-[#9B928B]">Chargement…</td></tr>
            )}
            {payments?.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-[#9B928B]">Aucun paiement enregistré</td></tr>
            )}
            {payments?.map(p => {
              const ps = PAYMENT_STATUS[p.status] ?? { label: p.status, className: 'bg-gray-100 text-gray-500 border-gray-200' }
              return (
                <tr key={p.id} className="hover:bg-[rgba(0,0,0,0.02)]">
                  <td className="px-5 py-3 text-[#6B6560]">{fmtDate(p.payment_date)}</td>
                  <td className="px-5 py-3 text-[#1a1a1a]">{p.plan_label}</td>
                  <td className="px-5 py-3 text-[#6B6560] capitalize hidden sm:table-cell">{p.method}</td>
                  <td className="px-5 py-3 text-right font-medium text-[#1a1a1a]">{fmtEur(p.amount)}</td>
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
