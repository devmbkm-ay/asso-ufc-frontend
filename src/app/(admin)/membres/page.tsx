'use client'

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { members, ApiError } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Search, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_TABS = [
  { value: '',          label: 'Tous' },
  { value: 'active',    label: 'Actifs' },
  { value: 'inactive',  label: 'Inactifs' },
  { value: 'suspended', label: 'Suspendus' },
  { value: 'honorary',  label: 'Honoraires' },
]

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  active:    { label: 'Actif',      className: 'bg-emerald-900/40 text-emerald-400 border-emerald-800/50' },
  inactive:  { label: 'Inactif',    className: 'bg-zinc-800 text-zinc-400 border-zinc-700' },
  suspended: { label: 'Suspendu',   className: 'bg-red-900/40 text-red-400 border-red-800/50' },
  honorary:  { label: 'Honoraire',  className: 'bg-purple-900/40 text-purple-400 border-purple-800/50' },
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
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

const FIELD_CLASS = 'bg-[#252525] border-[rgba(255,255,255,0.1)] text-white placeholder:text-[#555]'

export default function MembresPage() {
  const [search, setSearch]               = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus]               = useState('')
  const [page, setPage]                   = useState(1)
  const [open, setOpen]                   = useState(false)
  const [form, setForm]                   = useState(EMPTY_FORM)
  const [formError, setFormError]         = useState<string | null>(null)

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

  function closeModal() {
    setOpen(false)
    setForm(EMPTY_FORM)
    setFormError(null)
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

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Membres</h1>
          <p className="text-sm text-[#888] mt-0.5">
            {data ? `${data.total} membre${data.total > 1 ? 's' : ''}` : '—'}
          </p>
        </div>

        <Dialog open={open} onOpenChange={handleOpenChange}>
          <Button
            onClick={() => setOpen(true)}
            className="bg-[#C8A96E] hover:bg-[#b8994e] text-black text-sm font-medium gap-1.5 shrink-0"
          >
            <Plus size={14} />
            Nouveau membre
          </Button>

          <DialogContent className="bg-[#1a1a1a] border-[rgba(255,255,255,0.08)] sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white">Nouveau membre</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-[#888]">Prénom *</label>
                  <Input value={form.first_name} onChange={field('first_name')} required className={FIELD_CLASS} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-[#888]">Nom *</label>
                  <Input value={form.last_name} onChange={field('last_name')} required className={FIELD_CLASS} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-[#888]">Email *</label>
                <Input type="email" value={form.email} onChange={field('email')} required className={FIELD_CLASS} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-[#888]">
                  Mot de passe *{' '}
                  <span className="text-[#555]">8 car. min, 1 chiffre requis</span>
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
                <label className="text-xs text-[#888]">Téléphone</label>
                <Input value={form.phone} onChange={field('phone')} className={FIELD_CLASS} placeholder="06 00 00 00 00" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-[#888]">Adresse</label>
                <Input value={form.address} onChange={field('address')} className={FIELD_CLASS} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-[#888]">Date de naissance</label>
                <Input type="date" value={form.birth_date} onChange={field('birth_date')} className={FIELD_CLASS} />
              </div>

              {formError && (
                <p className="text-xs text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  className="border-[rgba(255,255,255,0.1)] text-[#888] hover:text-white bg-transparent"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-[#C8A96E] hover:bg-[#b8994e] text-black"
                >
                  {isPending ? 'Création…' : 'Créer le membre'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
          <Input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Rechercher un membre…"
            className="pl-9 bg-[#1e1e1e] border-[rgba(255,255,255,0.1)] text-white placeholder:text-[#555]"
          />
        </div>
        <div className="flex gap-1 bg-[#1e1e1e] border border-[rgba(255,255,255,0.08)] rounded-lg p-1">
          {STATUS_TABS.map(t => (
            <button
              key={t.value}
              onClick={() => handleStatus(t.value)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                status === t.value
                  ? 'bg-[#C8A96E]/15 text-[#C8A96E]'
                  : 'text-[#666] hover:text-[#aaa]',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-[#1e1e1e] rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.06)]">
              <th className="text-left px-5 py-3.5 text-[10px] font-semibold tracking-wider text-[#555] uppercase">Membre</th>
              <th className="text-left px-5 py-3.5 text-[10px] font-semibold tracking-wider text-[#555] uppercase hidden md:table-cell">Email</th>
              <th className="text-left px-5 py-3.5 text-[10px] font-semibold tracking-wider text-[#555] uppercase hidden lg:table-cell">Téléphone</th>
              <th className="text-left px-5 py-3.5 text-[10px] font-semibold tracking-wider text-[#555] uppercase hidden sm:table-cell">Inscrit le</th>
              <th className="text-left px-5 py-3.5 text-[10px] font-semibold tracking-wider text-[#555] uppercase">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-[#555]">Chargement…</td>
              </tr>
            )}
            {!isLoading && data?.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-[#555]">Aucun membre trouvé</td>
              </tr>
            )}
            {data?.items.map(m => {
              const st = STATUS_LABEL[m.status]
              return (
                <tr key={m.id} className="hover:bg-[rgba(255,255,255,0.02)] transition-colors group">
                  <td className="px-5 py-3.5">
                    <Link href={`/membres/${m.id}`} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#2D5016] flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-white">
                          {m.first_name[0]}{m.last_name[0]}
                        </span>
                      </div>
                      <span className="font-medium text-white group-hover:text-[#C8A96E] transition-colors">
                        {m.first_name} {m.last_name}
                      </span>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-[#888] hidden md:table-cell">
                    <Link href={`/membres/${m.id}`} className="block">{m.email}</Link>
                  </td>
                  <td className="px-5 py-3.5 text-[#888] hidden lg:table-cell">
                    <Link href={`/membres/${m.id}`} className="block">{m.phone ?? '—'}</Link>
                  </td>
                  <td className="px-5 py-3.5 text-[#888] hidden sm:table-cell">
                    <Link href={`/membres/${m.id}`} className="block">{fmtDate(m.joined_at)}</Link>
                  </td>
                  <td className="px-5 py-3.5">
                    <Link href={`/membres/${m.id}`} className="block">
                      <Badge className={`text-[10px] border ${st.className}`}>{st.label}</Badge>
                    </Link>
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
          <p className="text-[#555]">
            Page {data.page} sur {data.pages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="bg-[#1e1e1e] border-[rgba(255,255,255,0.1)] text-[#888] hover:text-white hover:bg-[#252525]"
            >
              <ChevronLeft size={14} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === data.pages}
              onClick={() => setPage(p => p + 1)}
              className="bg-[#1e1e1e] border-[rgba(255,255,255,0.1)] text-[#888] hover:text-white hover:bg-[#252525]"
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
