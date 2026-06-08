'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { members, invites, ApiError } from '@/lib/api'
import { useAuth } from '@/providers/AuthProvider'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Search, ChevronLeft, ChevronRight, Plus, Mail, Copy, Check, Trash2, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

const ADMIN_ROLES = ['admin', 'treasurer', 'president', 'secretary', 'vice_president']

const STATUS_TABS = [
  { value: '',          label: 'Tous' },
  { value: 'active',    label: 'Actifs' },
  { value: 'inactive',  label: 'Inactifs' },
  { value: 'suspended', label: 'Suspendus' },
  { value: 'honorary',  label: 'Honoraires' },
]

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  active:    { label: 'Actif',      className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  inactive:  { label: 'Inactif',    className: 'bg-gray-100 text-gray-500 border-gray-200' },
  suspended: { label: 'Suspendu',   className: 'bg-red-50 text-red-600 border-red-200' },
  honorary:  { label: 'Honoraire',  className: 'bg-purple-50 text-purple-600 border-purple-200' },
}

const ROLE_LABEL: Record<string, string> = {
  admin:          'Administrateur',
  treasurer:      'Trésorier(ère)',
  president:      'Président(e)',
  secretary:      'Secrétaire',
  vice_president: 'Vice-président(e)',
  board:          'Bureau',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function memberRole(roles: string[]): string {
  for (const r of roles) {
    if (ROLE_LABEL[r]) return ROLE_LABEL[r]
  }
  return '—'
}

const EMPTY_FORM = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  phone: '',
  address: '',
  birth_date: '',
}

const FIELD_CLASS = 'bg-white border-[rgba(0,0,0,0.12)] text-[#1a1a1a] placeholder:text-[#B0A9A2] focus:border-[#C8A96E]'

export default function MembresPage() {
  const { user } = useAuth()
  const isAdmin      = user?.roles?.some(r => ADMIN_ROLES.includes(r)) ?? false
  const isSuperAdmin = user?.roles?.includes('super_admin') ?? false

  const [search, setSearch]               = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus]               = useState('')
  const [page, setPage]                   = useState(1)
  const [open, setOpen]                   = useState(false)
  const [form, setForm]                   = useState(EMPTY_FORM)
  const [formError, setFormError]         = useState<string | null>(null)

  // Invite modal state
  const [inviteOpen, setInviteOpen]       = useState(false)
  const [inviteEmail, setInviteEmail]     = useState('')
  const [inviteError, setInviteError]     = useState<string | null>(null)
  const [inviteLink, setInviteLink]       = useState<string | null>(null)
  const [copied, setCopied]               = useState(false)

  const queryClient = useQueryClient()

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const { data, isLoading } = useQuery({
    queryKey: ['members', { search: debouncedSearch, status, page }],
    queryFn: () => members.list({
      page,
      size: 20,
      search: debouncedSearch || undefined,
      status: status || undefined,
    }),
  })

  const { data: pendingInvites } = useQuery({
    queryKey: ['invites'],
    queryFn:  invites.list,
    enabled:  isSuperAdmin,
    select:   data => data.filter(i => i.is_valid),
  })

  const { mutate: createMember, isPending } = useMutation({
    mutationFn: members.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      closeModal()
    },
    onError: (err: unknown) => {
      setFormError(err instanceof ApiError ? err.message : 'Erreur inattendue')
    },
  })

  const { mutate: sendInvite, isPending: invitePending } = useMutation({
    mutationFn: (email: string) => invites.create(email),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invites'] })
      const link = `${window.location.origin}/rejoindre/${data.token}`
      setInviteLink(link)
      setInviteError(null)
    },
    onError: (err: unknown) => {
      setInviteError(err instanceof ApiError ? err.message : 'Erreur inattendue')
    },
  })

  const { mutate: revokeInvite } = useMutation({
    mutationFn: (token: string) => invites.revoke(token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invites'] }),
  })

  function closeModal() {
    setOpen(false)
    setForm(EMPTY_FORM)
    setFormError(null)
  }

  function closeInviteModal() {
    setInviteOpen(false)
    setInviteEmail('')
    setInviteError(null)
    setInviteLink(null)
    setCopied(false)
  }

  function handleInviteSubmit(e: React.FormEvent) {
    e.preventDefault()
    setInviteError(null)
    sendInvite(inviteEmail)
  }

  function copyLink() {
    if (!inviteLink) return
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function fmtExpiry(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  function handleOpenChange(next: boolean) {
    if (!next) closeModal()
    else setOpen(true)
  }

  function field(key: keyof typeof EMPTY_FORM) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    createMember({
      first_name: form.first_name,
      last_name:  form.last_name,
      email:      form.email,
      password:   form.password,
      phone:      form.phone      || undefined,
      address:    form.address    || undefined,
      birth_date: form.birth_date || undefined,
    })
  }

  function handleStatus(v: string) {
    setStatus(v)
    setPage(1)
  }

  const colCount = isAdmin ? 5 : 3

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1a1a1a]">Membres</h1>
          <p className="text-sm text-[#6B6560] mt-0.5">
            {data ? `${data.total} adhérent${data.total > 1 ? 's' : ''}` : '—'}
          </p>
        </div>

        {isAdmin && (
          <div className="flex gap-2 shrink-0">
            {/* Invite modal — super_admin only */}
            {isSuperAdmin && <Dialog open={inviteOpen} onOpenChange={v => { if (!v) closeInviteModal(); else setInviteOpen(true) }}>
              <Button
                onClick={() => setInviteOpen(true)}
                variant="outline"
                className="border-[rgba(200,169,110,0.4)] text-[#8B6B30] hover:bg-[#FBF6EE] gap-1.5"
              >
                <Mail size={14} />
                Inviter
              </Button>

              <DialogContent className="bg-white border-[rgba(0,0,0,0.08)] sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle className="text-[#1a1a1a]">
                    {inviteLink ? 'Invitation envoyée' : 'Inviter un membre'}
                  </DialogTitle>
                </DialogHeader>

                {!inviteLink ? (
                  <form onSubmit={handleInviteSubmit} className="space-y-4 mt-1">
                    <div className="space-y-1.5">
                      <label className="text-xs text-[#6B6560]">Adresse email du futur membre *</label>
                      <Input
                        type="email"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        required
                        placeholder="prenom.nom@example.com"
                        className={FIELD_CLASS}
                      />
                    </div>
                    <p className="text-xs text-[#9B928B]">
                      Un email avec le lien d'inscription sera envoyé automatiquement. Le lien est valable 7 jours.
                    </p>
                    {inviteError && (
                      <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        {inviteError}
                      </p>
                    )}
                    <DialogFooter className="gap-2">
                      <Button type="button" variant="outline" onClick={closeInviteModal}
                        className="border-[rgba(0,0,0,0.12)] text-[#6B6560] bg-transparent">
                        Annuler
                      </Button>
                      <Button type="submit" disabled={invitePending}
                        className="bg-[#C8A96E] hover:bg-[#b8994e] text-white">
                        {invitePending ? 'Envoi…' : "Envoyer l'invitation"}
                      </Button>
                    </DialogFooter>
                  </form>
                ) : (
                  <div className="space-y-4 mt-1">
                    <p className="text-sm text-[#1a1a1a]">
                      Invitation envoyée à <strong>{inviteEmail}</strong>.
                    </p>
                    <div className="space-y-1.5">
                      <p className="text-xs text-[#6B6560]">Lien de secours (partage manuel)</p>
                      <div className="flex gap-2">
                        <input
                          readOnly
                          value={inviteLink}
                          className="flex-1 text-xs px-3 py-2 rounded-lg border border-[rgba(0,0,0,0.12)] bg-[#F9F6F1] text-[#6B6560] truncate"
                        />
                        <Button size="sm" variant="outline" onClick={copyLink}
                          className="border-[rgba(0,0,0,0.12)] text-[#6B6560] gap-1.5 shrink-0">
                          {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                          {copied ? 'Copié !' : 'Copier'}
                        </Button>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={closeInviteModal} className="bg-[#2D5016] hover:bg-[#3a6820] text-white">
                        Fermer
                      </Button>
                    </DialogFooter>
                  </div>
                )}
              </DialogContent>
            </Dialog>}

          <Dialog open={open} onOpenChange={handleOpenChange}>
            <Button
              onClick={() => setOpen(true)}
              className="bg-[#C8A96E] hover:bg-[#b8994e] text-white text-sm font-medium gap-1.5 shrink-0"
            >
              <Plus size={14} />
              Nouveau membre
            </Button>

            <DialogContent className="bg-white border-[rgba(0,0,0,0.08)] sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-[#1a1a1a]">Nouveau membre</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 mt-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-[#6B6560]">Prénom *</label>
                    <Input value={form.first_name} onChange={field('first_name')} required className={FIELD_CLASS} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-[#6B6560]">Nom *</label>
                    <Input value={form.last_name} onChange={field('last_name')} required className={FIELD_CLASS} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-[#6B6560]">Email *</label>
                  <Input type="email" value={form.email} onChange={field('email')} required className={FIELD_CLASS} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-[#6B6560]">
                    Mot de passe *{' '}
                    <span className="text-[#B0A9A2]">8 car. min, 1 chiffre requis</span>
                  </label>
                  <Input
                    type="password"
                    value={form.password}
                    onChange={field('password')}
                    required
                    minLength={8}
                    className={FIELD_CLASS}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-[#6B6560]">Téléphone</label>
                  <Input value={form.phone} onChange={field('phone')} className={FIELD_CLASS} placeholder="06 00 00 00 00" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-[#6B6560]">Adresse</label>
                  <Input value={form.address} onChange={field('address')} className={FIELD_CLASS} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-[#6B6560]">Date de naissance</label>
                  <Input type="date" value={form.birth_date} onChange={field('birth_date')} className={FIELD_CLASS} />
                </div>

                {formError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {formError}
                  </p>
                )}

                <DialogFooter className="gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeModal}
                    className="border-[rgba(0,0,0,0.12)] text-[#6B6560] hover:text-[#1a1a1a] bg-transparent"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="bg-[#C8A96E] hover:bg-[#b8994e] text-white"
                  >
                    {isPending ? 'Création…' : 'Créer le membre'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        )}
      </div>

      {/* Invitations en attente */}
      {isSuperAdmin && pendingInvites && pendingInvites.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-amber-600" />
            <span className="text-sm font-semibold text-amber-800">
              {pendingInvites.length} invitation{pendingInvites.length > 1 ? 's' : ''} en attente
            </span>
          </div>
          <div className="space-y-1.5">
            {pendingInvites.map(inv => (
              <div key={inv.id} className="flex items-center justify-between gap-3 bg-white border border-amber-100 rounded-lg px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-[#1a1a1a]">{inv.email}</p>
                  <p className="text-[10px] text-[#9B928B]">
                    Invité par {inv.invited_by_name} · expire le {fmtExpiry(inv.expires_at)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => revokeInvite(inv.token)}
                  className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 gap-1 shrink-0"
                >
                  <Trash2 size={12} />
                  Révoquer
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B928B]" />
          <Input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Rechercher un membre…"
            className="pl-9 bg-white border-[rgba(0,0,0,0.10)] text-[#1a1a1a] placeholder:text-[#B0A9A2]"
          />
        </div>
        <div className="flex gap-1 bg-[#F0EBE2] border border-[rgba(0,0,0,0.08)] rounded-lg p-1">
          {STATUS_TABS.map(t => (
            <button
              key={t.value}
              onClick={() => handleStatus(t.value)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                status === t.value
                  ? 'bg-[#C8A96E]/20 text-[#8B6B30]'
                  : 'text-[#7A726B] hover:text-[#1a1a1a]',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-[rgba(200,169,110,0.18)] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgba(0,0,0,0.06)]">
              <th className="text-left px-5 py-3.5 text-[10px] font-semibold tracking-wider text-[#9B928B] uppercase">Membre</th>
              {isAdmin ? (
                <>
                  <th className="text-left px-5 py-3.5 text-[10px] font-semibold tracking-wider text-[#9B928B] uppercase hidden md:table-cell">Email</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-semibold tracking-wider text-[#9B928B] uppercase hidden lg:table-cell">Téléphone</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-semibold tracking-wider text-[#9B928B] uppercase hidden sm:table-cell">Inscrit le</th>
                </>
              ) : (
                <th className="text-left px-5 py-3.5 text-[10px] font-semibold tracking-wider text-[#9B928B] uppercase hidden sm:table-cell">Fonction</th>
              )}
              <th className="text-left px-5 py-3.5 text-[10px] font-semibold tracking-wider text-[#9B928B] uppercase">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(0,0,0,0.04)]">
            {isLoading && (
              <tr>
                <td colSpan={colCount} className="px-5 py-12 text-center text-[#9B928B]">Chargement…</td>
              </tr>
            )}
            {!isLoading && data?.items.length === 0 && (
              <tr>
                <td colSpan={colCount} className="px-5 py-12 text-center text-[#9B928B]">Aucun membre trouvé</td>
              </tr>
            )}
            {data?.items.map(m => {
              const st = STATUS_LABEL[m.status]
              const avatar = (
                <div className="w-8 h-8 rounded-full bg-[#2D5016] flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-white">
                    {m.first_name[0]}{m.last_name[0]}
                  </span>
                </div>
              )
              return (
                <tr key={m.id} className="hover:bg-[rgba(0,0,0,0.02)] transition-colors group">
                  <td className="px-5 py-3.5">
                    {isAdmin ? (
                      <Link href={`/membres/${m.id}`} className="flex items-center gap-3">
                        {avatar}
                        <span className="font-medium text-[#1a1a1a] group-hover:text-[#C8A96E] transition-colors">
                          {m.first_name} {m.last_name}
                        </span>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3">
                        {avatar}
                        <span className="font-medium text-[#1a1a1a]">
                          {m.first_name} {m.last_name}
                        </span>
                      </div>
                    )}
                  </td>
                  {isAdmin ? (
                    <>
                      <td className="px-5 py-3.5 text-[#6B6560] hidden md:table-cell">
                        <Link href={`/membres/${m.id}`} className="block">{m.email}</Link>
                      </td>
                      <td className="px-5 py-3.5 text-[#6B6560] hidden lg:table-cell">
                        <Link href={`/membres/${m.id}`} className="block">{m.phone ?? '—'}</Link>
                      </td>
                      <td className="px-5 py-3.5 text-[#6B6560] hidden sm:table-cell">
                        <Link href={`/membres/${m.id}`} className="block">{fmtDate(m.joined_at)}</Link>
                      </td>
                    </>
                  ) : (
                    <td className="px-5 py-3.5 text-[#6B6560] hidden sm:table-cell">
                      {memberRole(m.roles)}
                    </td>
                  )}
                  <td className="px-5 py-3.5">
                    {isAdmin ? (
                      <Link href={`/membres/${m.id}`} className="block">
                        <Badge className={`text-[10px] border ${st.className}`}>{st.label}</Badge>
                      </Link>
                    ) : (
                      <Badge className={`text-[10px] border ${st.className}`}>{st.label}</Badge>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-[#9B928B]">
            Page {data.page} sur {data.pages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="bg-white border-[rgba(0,0,0,0.10)] text-[#6B6560] hover:text-[#1a1a1a] hover:bg-[#F0EBE2]"
            >
              <ChevronLeft size={14} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === data.pages}
              onClick={() => setPage(p => p + 1)}
              className="bg-white border-[rgba(0,0,0,0.10)] text-[#6B6560] hover:text-[#1a1a1a] hover:bg-[#F0EBE2]"
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
