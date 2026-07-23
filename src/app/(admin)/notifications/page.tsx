'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notifications, ApiError } from '@/lib/api'
import { useAuth } from '@/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  UserPlus, CreditCard, Calendar, BellRing,
  CheckCircle2, XCircle, ChevronLeft, ChevronRight, Send,
} from 'lucide-react'

const CURRENT_YEAR = new Date().getFullYear()
const CURRENT_MONTH = new Date().getMonth() + 1

const MONTHS_FULL = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  welcome: { label: 'Bienvenue', icon: UserPlus, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  cotisation_reminder: { label: 'Rappel cotisation', icon: CreditCard, color: 'text-[#6366F1]', bg: 'bg-indigo-50' },
  event_invitation: { label: 'Invitation événement', icon: Calendar, color: 'text-cyan-600', bg: 'bg-cyan-50' },
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [reminderMonth, setReminderMonth] = useState(CURRENT_MONTH)
  const [reminderYear, setReminderYear] = useState(CURRENT_YEAR)
  const [result, setResult] = useState<import('@/lib/types').ReminderResult | null>(null)
  const [resultError, setResultError] = useState<string | null>(null)

  const canAction = user?.roles.some(r => ['super_admin', 'treasurer'].includes(r))

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notifications.list({ limit: 100 }),
  })

  const { mutate: sendReminder, isPending } = useMutation({
    mutationFn: () => notifications.remindOverdue(reminderMonth, reminderYear),
    onSuccess: (res) => {
      setResult(res)
      setResultError(null)
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (err: unknown) => {
      setResultError(err instanceof ApiError ? err.message : 'Erreur lors de l\'envoi')
      setResult(null)
    },
  })

  const sentCount = data?.filter(n => n.sent).length ?? 0
  const failedCount = data?.filter(n => !n.sent).length ?? 0

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-card-foreground">Notifications</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isLoading ? '—' : `${data?.length ?? 0} envois · ${sentCount} réussis · ${failedCount} échoués`}
        </p>
      </div>

      {/* Action — Rappels cotisation */}
      {canAction && (
        <div className="bg-white rounded-xl border border-[rgba(99,102,241,0.15)] shadow-sm p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
              <Send size={15} className="text-[#6366F1]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Rappels de cotisation</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Envoie un email à tous les membres actifs qui n'ont pas encore cotisé pour le mois sélectionné.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pl-12">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <button
                onClick={() => setReminderMonth(m => m === 1 ? 12 : m - 1)}
                className="text-slate-400 hover:text-slate-700 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-medium text-slate-700 w-16 text-center select-none">
                {MONTHS_FULL[reminderMonth - 1]}
              </span>
              <button
                onClick={() => setReminderMonth(m => m === 12 ? 1 : m + 1)}
                className="text-slate-400 hover:text-slate-700 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <button
                onClick={() => setReminderYear(y => y - 1)}
                className="text-slate-400 hover:text-slate-700 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-medium text-slate-700 w-10 text-center select-none">
                {reminderYear}
              </span>
              <button
                onClick={() => setReminderYear(y => y + 1)}
                disabled={reminderYear >= CURRENT_YEAR}
                className="text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            <Button
              size="sm"
              onClick={() => { setResult(null); setResultError(null); sendReminder() }}
              disabled={isPending}
              className="bg-[#6366F1] hover:bg-[#4F46E5] text-white gap-1.5"
            >
              <Send size={13} />
              {isPending ? 'Envoi…' : 'Envoyer'}
            </Button>
          </div>

          {/* Result */}
          {result && (
            <div className="ml-12 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-xs font-semibold text-emerald-800 mb-1.5">Rappels envoyés</p>
              <div className="flex gap-4 text-xs text-emerald-700">
                <span><strong>{result.sent_count}</strong> envoyés</span>
                {result.failed_count > 0 && (
                  <span className="text-red-600"><strong>{result.failed_count}</strong> échoués</span>
                )}
                <span className="text-emerald-600"><strong>{result.skipped_count}</strong> déjà cotisés</span>
              </div>
            </div>
          )}
          {resultError && (
            <p className="ml-12 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {resultError}
            </p>
          )}
        </div>
      )}

      {/* History */}
      <div className="bg-white rounded-xl border border-[rgba(99,102,241,0.15)] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800">Historique des envois</h2>
        </div>

        {isLoading && (
          <div className="px-5 py-10 text-center text-sm text-slate-400">Chargement…</div>
        )}

        {!isLoading && data?.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <BellRing size={20} className="text-slate-300" />
            </div>
            <p className="text-sm text-slate-400">Aucune notification envoyée pour le moment</p>
          </div>
        )}

        {data && data.length > 0 && (
          <ul className="divide-y divide-slate-100">
            {data.map(n => {
              const meta = TYPE_META[n.type] ?? TYPE_META.welcome
              const Icon = meta.icon
              return (
                <li key={n.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                  <div className={`w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon size={14} className={meta.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-slate-800 truncate">{n.subject}</p>
                      <Badge className={`text-[10px] border shrink-0 ${n.sent
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-red-50 text-red-600 border-red-200'
                        }`}>
                        {n.sent ? 'Envoyé' : 'Échoué'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{fmtDate(n.created_at)}</p>
                  </div>
                  {n.sent
                    ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-1" />
                    : <XCircle size={14} className="text-red-400 shrink-0 mt-1" />
                  }
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
