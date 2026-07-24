'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { members, invites, ApiError } from '@/lib/api'
import { useAuth } from '@/providers/AuthProvider'
import { StatusBadge, type StatusBadgeProps } from '@/components/ui/status-badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { SkeletonTableRow } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Search, ChevronLeft, ChevronRight, Plus, Mail, Copy, Check, Trash2, Clock, CheckCircle2, XCircle, Circle, Info } from 'lucide-react'
import { cn, avatarColor } from '@/lib/utils'

const ADMIN_ROLES = ['super_admin', 'admin', 'treasurer', 'president', 'secretary', 'vice_president']

const STATUS_TABS = [
  { value: '', label: 'Tous' },
  { value: 'active', label: 'Actifs' },
  { value: 'inactive', label: 'Inactifs' },
  { value: 'suspended', label: 'Suspendus' },
  { value: 'honorary', label: 'Honoraires' },
]

const STATUS_LABEL: Record<string, { label: string; status: StatusBadgeProps['status']; icon: React.ReactNode }> = {
  active: { label: 'Actif', status: 'active', icon: <CheckCircle2 size={11} /> },
  inactive: { label: 'Inactif', status: 'inactive', icon: <Circle size={11} /> },
  suspended: { label: 'Suspendu', status: 'cancelled', icon: <XCircle size={11} /> },
  honorary: { label: 'Honoraire', status: 'info', icon: <Info size={11} /> },
}

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Administrateur',
  president: 'Président(e)',
  treasurer: 'Trésorier(ère)',
  secretary: 'Secrétaire',
  member: 'Adhérent(e)',
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

const FIELD_CLASS = 'bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-primary'

export default function MembresPage() {
  const { user } = useAuth()
  const isAdmin = user?.roles?.some(r => ADMIN_ROLES.includes(r)) ?? false
  const isSuperAdmin = user?.roles?.includes('super_admin') ?? false
  const isPresident = user?.roles?.includes('president') ?? false
  const canInvite = isSuperAdmin || isPresident

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)

  // Invite modal state
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteMode, setInviteMode] = useState<'single' | 'bulk'>('single')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [bulkEmails, setBulkEmails] = useState('')
  const [bulkResult, setBulkResult] = useState<import('@/lib/types').BulkInviteResult | null>(null)

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
    queryFn: invites.list,
    enabled: canInvite,
    select: data => data.filter(i => i.is_valid),
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

  const { mutate: sendBulkInvites, isPending: bulkPending } = useMutation({
    mutationFn: (emails: string[]) => invites.bulkCreate(emails),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invites'] })
      setBulkResult(data)
      setInviteError(null)
    },
    onError: (err: unknown) => {
      setInviteError(err instanceof ApiError ? err.message : 'Erreur inattendue')
    },
  })

  function closeModal() {
    setOpen(false)
    setForm(EMPTY_FORM)
    setFormError(null)
  }

  function closeInviteModal() {
    setInviteOpen(false)
    setInviteMode('single')
    setInviteEmail('')
    setInviteError(null)
    setInviteLink(null)
    setCopied(false)
    setBulkEmails('')
    setBulkResult(null)
  }

  function handleInviteSubmit(e: React.FormEvent) {
    e.preventDefault()
    setInviteError(null)
    sendInvite(inviteEmail)
  }

  function parseBulkEmails(raw: string): string[] {
    const parts = raw.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean)
    return Array.from(new Set(parts))
  }

  function handleBulkSubmit(e: React.FormEvent) {
    e.preventDefault()
    setInviteError(null)
    const emails = parseBulkEmails(bulkEmails)
    if (emails.length === 0) return
    sendBulkInvites(emails)
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
      last_name: form.last_name,
      email: form.email,
      password: form.password,
      phone: form.phone || undefined,
      address: form.address || undefined,
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
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Membres</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data ? `${data.total} adhérent${data.total > 1 ? 's' : ''}` : '—'}
          </p>
        </div>

        {isAdmin && (
          <div className="flex gap-2 shrink-0">
            {/* Invite modal — super_admin & president */}
            {canInvite && <Dialog open={inviteOpen} onOpenChange={v => { if (!v) closeInviteModal(); else setInviteOpen(true) }}>
              <Button
                onClick={() => setInviteOpen(true)}
                variant="outline"
                className="border-primary/40 text-primary hover:bg-primary/10 gap-1.5"
              >
                <Mail size={14} />
                Inviter
              </Button>

              <DialogContent className="bg-card border-primary/15 sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle>
                    {inviteLink ? 'Invitation envoyée' : bulkResult ? 'Invitations envoyées' : 'Inviter des membres'}
                  </DialogTitle>
                </DialogHeader>

                {!inviteLink && !bulkResult && (
                  <div className="flex gap-1 bg-muted border border-border rounded-lg p-1 mt-1">
                    <button
                      type="button"
                      onClick={() => { setInviteMode('single'); setInviteError(null) }}
                      className={cn(
                        'flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors',
                        inviteMode === 'single' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      Un membre
                    </button>
                    <button
                      type="button"
                      onClick={() => { setInviteMode('bulk'); setInviteError(null) }}
                      className={cn(
                        'flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors',
                        inviteMode === 'bulk' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      Plusieurs (liste)
                    </button>
                  </div>
                )}

                {!inviteLink && !bulkResult && inviteMode === 'single' && (
                  <form onSubmit={handleInviteSubmit} className="space-y-4 mt-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Adresse email du futur membre *</label>
                      <Input
                        type="email"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        required
                        placeholder="prenom.nom@example.com"
                        className={FIELD_CLASS}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Un email avec le lien d'inscription sera envoyé automatiquement. Le lien est valable 7 jours.
                    </p>
                    {inviteError && (
                      <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        {inviteError}
                      </p>
                    )}
                    <DialogFooter className="gap-2">
                      <Button type="button" variant="outline" onClick={closeInviteModal}
                        className="border-border text-muted-foreground bg-transparent">
                        Annuler
                      </Button>
                      <Button type="submit" disabled={invitePending}
                        className="bg-primary hover:bg-primary/80 text-primary-foreground">
                        {invitePending ? 'Envoi…' : "Envoyer l'invitation"}
                      </Button>
                    </DialogFooter>
                  </form>
                )}

                {!inviteLink && !bulkResult && inviteMode === 'bulk' && (
                  <form onSubmit={handleBulkSubmit} className="space-y-4 mt-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Emails des futurs membres *</label>
                      <textarea
                        value={bulkEmails}
                        onChange={e => setBulkEmails(e.target.value)}
                        required
                        rows={6}
                        placeholder={'un email par ligne\nex: prenom.nom@example.com'}
                        className={cn(FIELD_CLASS, 'w-full rounded-md border px-3 py-2 text-sm focus:outline-none')}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Un email par ligne (ou séparés par une virgule). Chaque personne reçoit son propre lien d'inscription, valable 7 jours.
                    </p>
                    {inviteError && (
                      <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        {inviteError}
                      </p>
                    )}
                    <DialogFooter className="gap-2">
                      <Button type="button" variant="outline" onClick={closeInviteModal}
                        className="border-border text-muted-foreground bg-transparent">
                        Annuler
                      </Button>
                      <Button type="submit" disabled={bulkPending || parseBulkEmails(bulkEmails).length === 0}
                        className="bg-primary hover:bg-primary/80 text-primary-foreground">
                        {bulkPending ? 'Envoi…' : `Envoyer (${parseBulkEmails(bulkEmails).length})`}
                      </Button>
                    </DialogFooter>
                  </form>
                )}

                {bulkResult && (
                  <div className="space-y-4 mt-1">
                    <p className="text-sm text-foreground">
                      <strong>{bulkResult.created.length}</strong> invitation{bulkResult.created.length > 1 ? 's' : ''} envoyée{bulkResult.created.length > 1 ? 's' : ''}.
                    </p>
                    {bulkResult.skipped.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs text-muted-foreground">{bulkResult.skipped.length} ignorée{bulkResult.skipped.length > 1 ? 's' : ''} :</p>
                        <ul className="max-h-32 overflow-y-auto space-y-1">
                          {bulkResult.skipped.map(s => (
                            <li key={s.email} className="text-xs text-muted-foreground bg-muted border border-border rounded-lg px-3 py-1.5 flex justify-between gap-2">
                              <span className="truncate">{s.email}</span>
                              <span className="text-muted-foreground shrink-0">{s.reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <DialogFooter>
                      <Button onClick={closeInviteModal} className="bg-primary hover:bg-primary/80 text-primary-foreground">
                        Fermer
                      </Button>
                    </DialogFooter>
                  </div>
                )}

                {inviteLink && (
                  <div className="space-y-4 mt-1">
                    <p className="text-sm text-foreground">
                      Invitation envoyée à <strong>{inviteEmail}</strong>.
                    </p>
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">Lien de secours (partage manuel)</p>
                      <div className="flex gap-2">
                        <input
                          readOnly
                          value={inviteLink}
                          className="flex-1 text-xs px-3 py-2 rounded-lg border border-border bg-muted text-muted-foreground truncate"
                        />
                        <Button size="sm" variant="outline" onClick={copyLink}
                          className="border-border text-muted-foreground gap-1.5 shrink-0">
                          {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                          {copied ? 'Copié !' : 'Copier'}
                        </Button>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={closeInviteModal} className="bg-primary hover:bg-primary/80 text-primary-foreground">
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
                className="bg-primary hover:bg-primary/80 text-primary-foreground text-sm font-medium gap-1.5 shrink-0"
              >
                <Plus size={14} />
                Nouveau membre
              </Button>

              <DialogContent className="bg-card border-primary/15 sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Nouveau membre</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-1">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Prénom *</label>
                      <Input value={form.first_name} onChange={field('first_name')} required className={FIELD_CLASS} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Nom *</label>
                      <Input value={form.last_name} onChange={field('last_name')} required className={FIELD_CLASS} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Email *</label>
                    <Input type="email" value={form.email} onChange={field('email')} required className={FIELD_CLASS} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">
                      Mot de passe *{' '}
                      <span className="text-muted-foreground">8 car. min, 1 chiffre requis</span>
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
                    <label className="text-xs text-muted-foreground">Téléphone</label>
                    <Input value={form.phone} onChange={field('phone')} className={FIELD_CLASS} placeholder="06 00 00 00 00" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Adresse</label>
                    <Input value={form.address} onChange={field('address')} className={FIELD_CLASS} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Date de naissance</label>
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
                      className="border-border text-muted-foreground hover:text-foreground bg-transparent"
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={isPending}
                      className="bg-primary hover:bg-primary/80 text-primary-foreground"
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
      {canInvite && pendingInvites && pendingInvites.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-amber-700" />
            <span className="text-sm font-semibold text-amber-800">
              {pendingInvites.length} invitation{pendingInvites.length > 1 ? 's' : ''} en attente
            </span>
          </div>
          <div className="space-y-1.5">
            {pendingInvites.map(inv => (
              <div key={inv.id} className="flex items-center justify-between gap-3 bg-card border border-amber-100 rounded-lg px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{inv.email}</p>
                  <p className="text-[10px] text-muted-foreground">
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
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Rechercher un membre…"
            className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-1 bg-muted border border-border rounded-lg p-1">
          {STATUS_TABS.map(t => (
            <button
              key={t.value}
              onClick={() => handleStatus(t.value)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                status === t.value
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-card rounded-xl border border-primary/15 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Membre</th>
              {isAdmin ? (
                <>
                  <th className="text-left px-5 py-3.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase hidden md:table-cell">Email</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase hidden lg:table-cell">Téléphone</th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase hidden sm:table-cell">Inscrit le</th>
                </>
              ) : (
                <th className="text-left px-5 py-3.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase hidden sm:table-cell">Fonction</th>
              )}
              <th className="text-left px-5 py-3.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={colCount} className="px-5 py-5">
                  <div className="space-y-3">
                    <SkeletonTableRow />
                    <SkeletonTableRow />
                    <SkeletonTableRow />
                  </div>
                </td>
              </tr>
            )}
            {!isLoading && data?.items.length === 0 && (
              <tr>
                <td colSpan={colCount} className="px-5 py-5">
                  <EmptyState
                    title="Aucun membre trouvé"
                    description="Ajustez vos filtres ou ajoutez un nouveau membre pour commencer."
                  />
                </td>
              </tr>
            )}
            {data?.items.map(m => {
              const st = STATUS_LABEL[m.status]
              const avatar = (
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', avatarColor(m.first_name + m.last_name))}>
                  <span className="text-xs font-semibold">
                    {m.first_name[0]}{m.last_name[0]}
                  </span>
                </div>
              )
              return (
                <tr key={m.id} className="hover:bg-muted transition-colors group">
                  <td className="px-5 py-3.5">
                    {isAdmin ? (
                      <Link href={`/membres/${m.id}`} className="flex items-center gap-3">
                        {avatar}
                        <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {m.first_name} {m.last_name}
                        </span>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3">
                        {avatar}
                        <span className="font-medium text-foreground">
                          {m.first_name} {m.last_name}
                        </span>
                      </div>
                    )}
                  </td>
                  {isAdmin ? (
                    <>
                      <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">
                        <Link href={`/membres/${m.id}`} className="block">{m.email}</Link>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground hidden lg:table-cell">
                        <Link href={`/membres/${m.id}`} className="block">{m.phone ?? '—'}</Link>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground hidden sm:table-cell">
                        <Link href={`/membres/${m.id}`} className="block">{fmtDate(m.joined_at)}</Link>
                      </td>
                    </>
                  ) : (
                    <td className="px-5 py-3.5 text-muted-foreground hidden sm:table-cell">
                      {memberRole(m.roles)}
                    </td>
                  )}
                  <td className="px-5 py-3.5">
                    {isAdmin ? (
                      <Link href={`/membres/${m.id}`} className="block">
                        <StatusBadge status={st.status} label={st.label} icon={st.icon} />
                      </Link>
                    ) : (
                      <StatusBadge status={st.status} label={st.label} icon={st.icon} />
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
          <p className="text-muted-foreground">
            Page {data.page} sur {data.pages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              aria-label="Page précédente"
              className="bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <ChevronLeft size={14} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === data.pages}
              onClick={() => setPage(p => p + 1)}
              aria-label="Page suivante"
              className="bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
