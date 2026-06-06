'use client'

import { Bell, BellRing, UserPlus, CreditCard, Calendar, Info } from 'lucide-react'

const MOCK_NOTIFS = [
  {
    id: 1,
    icon: UserPlus,
    color: 'text-emerald-400',
    bg: 'bg-emerald-900/20',
    title: 'Nouveau membre inscrit',
    body: 'Koffi Mensah a rejoint l\'association.',
    time: 'Il y a 2 heures',
    read: false,
  },
  {
    id: 2,
    icon: CreditCard,
    color: 'text-[#C8A96E]',
    bg: 'bg-[#C8A96E]/10',
    title: 'Cotisation reçue',
    body: 'Paiement de 20 € enregistré pour juin 2026.',
    time: 'Il y a 5 heures',
    read: false,
  },
  {
    id: 3,
    icon: Calendar,
    color: 'text-blue-400',
    bg: 'bg-blue-900/20',
    title: 'Événement à venir',
    body: 'Assemblée générale le 14 juin — Paris 15e.',
    time: 'Hier',
    read: true,
  },
  {
    id: 4,
    icon: CreditCard,
    color: 'text-red-400',
    bg: 'bg-red-900/20',
    title: 'Cotisation manquée',
    body: 'Marie Dupont n\'a pas réglé sa cotisation de mai.',
    time: 'Il y a 3 jours',
    read: true,
  },
]

export default function NotificationsPage() {
  const unread = MOCK_NOTIFS.filter(n => !n.read).length

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Notifications</h1>
          <p className="text-sm text-[#888] mt-1">
            {unread > 0 ? `${unread} non lue${unread > 1 ? 's' : ''}` : 'Tout est à jour'}
          </p>
        </div>
        {unread > 0 && (
          <div className="w-5 h-5 rounded-full bg-[#C8A96E] flex items-center justify-center">
            <span className="text-[10px] font-bold text-[#141414]">{unread}</span>
          </div>
        )}
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-[#1e1e1e] mboka-card border rounded-xl px-4 py-3">
        <Info size={14} className="text-[#C8A96E] mt-0.5 shrink-0" />
        <p className="text-xs text-[#888]">
          Les notifications en temps réel sont en cours de développement. Les éléments ci-dessous sont des aperçus du format à venir.
        </p>
      </div>

      {/* Notification list */}
      <div className="space-y-2">
        {MOCK_NOTIFS.map(n => {
          const Icon = n.icon
          return (
            <div
              key={n.id}
              className={`flex items-start gap-4 bg-[#1e1e1e] mboka-card border rounded-xl px-4 py-4 transition-opacity ${n.read ? 'opacity-60' : ''}`}
            >
              <div className={`w-9 h-9 rounded-lg ${n.bg} flex items-center justify-center shrink-0`}>
                <Icon size={16} className={n.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-medium ${n.read ? 'text-[#888]' : 'text-white'}`}>{n.title}</p>
                  {!n.read && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C8A96E] shrink-0" />
                  )}
                </div>
                <p className="text-xs text-[#666] mt-0.5">{n.body}</p>
                <p className="text-[11px] text-[#444] mt-1">{n.time}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty state hint */}
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="w-12 h-12 rounded-full bg-[#1e1e1e] border border-[rgba(255,255,255,0.06)] flex items-center justify-center">
          <BellRing size={20} className="text-[#555]" />
        </div>
        <div>
          <p className="text-sm text-[#555]">Bientôt : notifications push et emails automatiques</p>
          <p className="text-xs text-[#444] mt-0.5">Cotisations impayées · Nouveaux membres · Rappels d'événements</p>
        </div>
      </div>
    </div>
  )
}
