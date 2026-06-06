'use client'

import { Shield, Crown, BookOpen, Eye, Lock } from 'lucide-react'
import { useAuth } from '@/providers/AuthProvider'

const ROLE_META: Record<string, {
  label: string
  icon: React.ElementType
  color: string
  bg: string
  description: string
  permissions: string[]
}> = {
  super_admin: {
    label: 'Super Administrateur',
    icon: Crown,
    color: 'text-[#C8A96E]',
    bg: 'bg-[#C8A96E]/10',
    description: 'Accès complet à toutes les fonctionnalités de la plateforme.',
    permissions: [
      'Gérer tous les membres',
      'Gérer les cotisations et paiements',
      'Exporter les données',
      'Gérer les rôles et accès',
      'Configurer les paramètres',
      'Accès aux événements',
      'Accès au tableau de bord trésorier',
    ],
  },
  admin: {
    label: 'Administrateur',
    icon: Shield,
    color: 'text-blue-400',
    bg: 'bg-blue-900/20',
    description: 'Accès étendu à la gestion des membres et des cotisations.',
    permissions: [
      'Gérer tous les membres',
      'Gérer les cotisations et paiements',
      'Exporter les données',
      'Accès aux événements',
      'Accès au tableau de bord trésorier',
    ],
  },
  secretary: {
    label: 'Secrétaire',
    icon: BookOpen,
    color: 'text-emerald-400',
    bg: 'bg-emerald-900/20',
    description: 'Gestion des membres et de leurs informations.',
    permissions: [
      'Ajouter et modifier les membres',
      'Consulter les cotisations',
      'Accès aux événements',
    ],
  },
  treasurer: {
    label: 'Trésorier',
    icon: Shield,
    color: 'text-purple-400',
    bg: 'bg-purple-900/20',
    description: 'Accès aux finances et aux rapports de cotisations.',
    permissions: [
      'Gérer les cotisations et paiements',
      'Exporter les données financières',
      'Accès au tableau de bord trésorier',
    ],
  },
  member: {
    label: 'Membre',
    icon: Eye,
    color: 'text-[#888]',
    bg: 'bg-[#252525]',
    description: 'Accès en lecture aux informations de l\'association.',
    permissions: [
      'Consulter les événements',
      'Accéder à son profil',
    ],
  },
}

const ALL_ROLES = ['super_admin', 'admin', 'secretary', 'treasurer', 'member']

export default function RolesPage() {
  const { user } = useAuth()
  const userRoles: string[] = (user?.roles ?? []) as string[]

  return (
    <div className="p-8 max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Rôles & accès</h1>
        <p className="text-sm text-[#888] mt-1">Permissions associées à chaque rôle dans la plateforme.</p>
      </div>

      {/* Current user's roles */}
      {userRoles.length > 0 && (
        <div className="mboka-card bg-[#1e1e1e] border rounded-xl p-5 space-y-3">
          <p className="text-xs font-semibold tracking-widest text-[#555] uppercase">Vos rôles actuels</p>
          <div className="flex flex-wrap gap-2">
            {userRoles.map(role => {
              const meta = ROLE_META[role]
              if (!meta) return null
              const Icon = meta.icon
              return (
                <span
                  key={role}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${meta.bg} ${meta.color}`}
                >
                  <Icon size={12} />
                  {meta.label}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Role matrix */}
      <div className="space-y-3">
        {ALL_ROLES.map(role => {
          const meta = ROLE_META[role]
          if (!meta) return null
          const Icon = meta.icon
          const isOwned = userRoles.includes(role)

          return (
            <div
              key={role}
              className={`mboka-card bg-[#1e1e1e] border rounded-xl p-5 space-y-3 transition-all ${isOwned ? 'ring-1 ring-[#C8A96E]/20' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg ${meta.bg} flex items-center justify-center`}>
                    <Icon size={16} className={meta.color} />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${isOwned ? 'text-white' : 'text-[#c8c4bc]'}`}>
                      {meta.label}
                    </p>
                    <p className="text-xs text-[#555]">{meta.description}</p>
                  </div>
                </div>
                {isOwned && (
                  <span className="text-[10px] font-semibold tracking-wider text-[#C8A96E] bg-[#C8A96E]/10 px-2 py-1 rounded-full uppercase">
                    Votre rôle
                  </span>
                )}
              </div>

              <ul className="space-y-1 pl-12">
                {meta.permissions.map(perm => (
                  <li key={perm} className="flex items-center gap-2 text-xs text-[#777]">
                    <span className={`w-1 h-1 rounded-full shrink-0 ${meta.color}`} />
                    {perm}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-2 text-xs text-[#555] border-t border-[rgba(255,255,255,0.06)] pt-4">
        <Lock size={12} />
        La gestion des rôles (attribution, révocation) sera disponible dans une prochaine version.
      </div>
    </div>
  )
}
