'use client'

import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { collectes, upload, ApiError } from '@/lib/api'
import { useAuth } from '@/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Heart, Users, Calendar, ImagePlus, X, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CATEGORY_OPTIONS, categoryFieldLabel, categoryPlaceholder, categoryPrefix } from '@/lib/collecte-categories'

function today() {
  return new Date().toISOString().split('T')[0]
}

function fmtEur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function daysLeft(endDate: string) {
  const diff = new Date(endDate).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  upcoming: { label: 'À venir', className: 'text-[10px] border bg-indigo-50 text-indigo-600 border-indigo-200' },
  active: { label: 'En cours', className: 'text-[10px] border bg-emerald-50 text-emerald-700 border-emerald-200' },
  expired: { label: 'Expirée', className: 'text-[10px] border bg-slate-100 text-slate-500 border-slate-200' },
  closed: { label: 'Clôturée', className: 'text-[10px] border bg-cyan-50 text-cyan-700 border-cyan-200' },
}

const EMPTY_FORM = {
  title: '',
  beneficiary_name: '',
  description: '',
  min_amount: '20',
  goal_amount: '',
  start_date: today(),
  category: '',
}

const FIELD = 'bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-primary'

export default function CollectesPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [scheduleLater, setScheduleLater] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const canCreate = user?.roles.some(r => ['super_admin', 'secretary'].includes(r))

  const { data, isLoading } = useQuery({
    queryKey: ['collectes'],
    queryFn: () => collectes.list(),
  })

  const { mutate: create, isPending } = useMutation({
    mutationFn: collectes.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectes'] })
      closeModal()
    },
    onError: (err: unknown) => {
      setFormError(err instanceof ApiError ? err.message : 'Erreur inattendue')
    },
  })

  function closeModal() {
    setOpen(false)
    setForm(EMPTY_FORM)
    setScheduleLater(false)
    setPhotoFile(null)
    setPhotoPreview(null)
    setFormError(null)
  }

  function field(key: keyof typeof EMPTY_FORM) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  function removePhoto() {
    setPhotoFile(null)
    setPhotoPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)

    let photo_url: string | undefined
    if (photoFile) {
      setUploading(true)
      try {
        const res = await upload.image(photoFile)
        photo_url = res.url
      } catch (err) {
        setFormError(err instanceof ApiError ? err.message : 'Échec de l\'upload photo')
        setUploading(false)
        return
      }
      setUploading(false)
    }

    create({
      title: form.title,
      beneficiary_name: form.beneficiary_name,
      photo_url,
      description: form.description || undefined,
      min_amount: Number(form.min_amount) || 20,
      goal_amount: form.goal_amount ? Number(form.goal_amount) : undefined,
      start_date: scheduleLater ? form.start_date : today(),
      category: form.category || undefined,
    })
  }

  const active = data?.filter(c => c.status === 'active' || c.status === 'upcoming') ?? []
  const past = data?.filter(c => c.status === 'expired' || c.status === 'closed') ?? []

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Collectes de solidarité</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {data ? `${data.length} collecte${data.length > 1 ? 's' : ''}` : '—'}
          </p>
        </div>

        {canCreate && (
          <Dialog open={open} onOpenChange={next => { if (!next) closeModal(); else setOpen(true) }}>
            <Button
              onClick={() => setOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shrink-0"
            >
              <Plus size={14} />
              Nouvelle collecte
            </Button>

            <DialogContent className="bg-white border-primary/15 sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-slate-800">Nouvelle collecte</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 mt-1">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500">Titre de la collecte *</label>
                  <Input
                    value={form.title}
                    onChange={field('title')}
                    required
                    placeholder="Collecte de solidarité — famille Dupont"
                    className={FIELD}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500">Catégorie</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-primary"
                  >
                    {CATEGORY_OPTIONS.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500">{categoryFieldLabel(form.category)} *</label>
                  <Input
                    value={form.beneficiary_name}
                    onChange={field('beneficiary_name')}
                    required
                    placeholder={categoryPlaceholder(form.category)}
                    className={FIELD}
                  />
                </div>

                {/* Photo upload */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500">
                    Photo <span className="text-slate-400">(optionnel · JPEG, PNG, WEBP · max 5 Mo)</span>
                  </label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  {photoPreview ? (
                    <div className="relative w-20 h-20 rounded-full overflow-hidden bg-slate-100 group">
                      <img src={photoPreview} alt="Aperçu" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <X size={16} className="text-white" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-slate-200 text-xs text-slate-500 hover:border-primary hover:text-primary transition-colors"
                    >
                      <ImagePlus size={14} />
                      Choisir une photo
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-500">
                    Message <span className="text-slate-400">(optionnel)</span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={field('description')}
                    rows={3}
                    placeholder="Un mot d'accompagnement pour la famille…"
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-primary resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-500">Montant minimum (€)</label>
                    <Input
                      type="number"
                      min={1}
                      value={form.min_amount}
                      onChange={field('min_amount')}
                      className={FIELD}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-500">
                      Objectif (€) <span className="text-slate-400">(optionnel)</span>
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={form.goal_amount}
                      onChange={field('goal_amount')}
                      placeholder="Ex. 500"
                      className={FIELD}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setScheduleLater(s => !s)}
                  className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <div className={cn(
                    'w-4 h-4 rounded border flex items-center justify-center transition-colors',
                    scheduleLater
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'border-slate-300 bg-white',
                  )}>
                    {scheduleLater && <span className="text-[8px] font-bold">✓</span>}
                  </div>
                  <Clock size={13} className="text-slate-400" />
                  Programmer le début plus tard
                </button>

                {scheduleLater && (
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-500">Date de début</label>
                    <Input
                      type="date"
                      value={form.start_date}
                      onChange={field('start_date')}
                      min={today()}
                      required
                      className={FIELD}
                    />
                  </div>
                )}

                <p className="text-xs text-slate-400">
                  {scheduleLater
                    ? 'La collecte durera 14 jours à partir de la date de début.'
                    : 'La collecte démarre immédiatement et durera 14 jours.'}
                </p>

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
                    className="border-slate-200 text-slate-500 bg-transparent"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending || uploading}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {uploading ? 'Upload…' : isPending ? 'Création…' : 'Lancer la collecte'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isLoading && (
        <div className="py-16 text-center text-slate-400 text-sm">Chargement…</div>
      )}

      {/* Collectes actives */}
      {active.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold tracking-widest text-slate-400 uppercase">En cours</h2>
          <div className="space-y-3">
            {active.map(c => <CollecteCard key={c.id} collecte={c} />)}
          </div>
        </section>
      )}

      {/* Collectes passées */}
      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold tracking-widest text-slate-400 uppercase">Terminées</h2>
          <div className="space-y-3">
            {past.map(c => <CollecteCard key={c.id} collecte={c} />)}
          </div>
        </section>
      )}

      {!isLoading && data?.length === 0 && (
        <div className="py-16 text-center space-y-2">
          <Heart size={32} className="mx-auto text-indigo-200" />
          <p className="text-sm text-slate-400">Aucune collecte pour le moment</p>
        </div>
      )}
    </div>
  )
}

function CollecteCard({ collecte: c }: { collecte: import('@/lib/types').CollecteRead }) {
  const remaining = daysLeft(c.end_date)

  return (
    <Link
      href={`/collectes/${c.id}`}
      className="block bg-white rounded-xl border border-primary/15 shadow-sm p-5 hover:border-primary/35 hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--primary)_15%,transparent)] transition-all"
    >
      <div className="flex gap-4">
        <div className="w-14 h-14 rounded-full shrink-0 overflow-hidden bg-indigo-50 flex items-center justify-center">
          {c.photo_url
            ? <img src={c.photo_url} alt={c.beneficiary_name} className="w-full h-full object-cover" />
            : <Heart size={22} className="text-primary" />
          }
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">{c.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{categoryPrefix(c.category)} {c.beneficiary_name}</p>
            </div>
            <Badge className={STATUS_BADGE[c.status]?.className ?? STATUS_BADGE.expired.className}>
              {STATUS_BADGE[c.status]?.label ?? 'Expirée'}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-5 mt-3 text-sm">
            <div>
              <p className="text-lg font-bold text-primary leading-none">{fmtEur(c.total_collected)}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">collectés</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Users size={12} className="text-primary" />
              {c.contributors_count} contributeur{c.contributors_count > 1 ? 's' : ''}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Calendar size={12} className="text-primary" />
              {c.is_active
                ? `${remaining} jour${remaining > 1 ? 's' : ''} restant${remaining > 1 ? 's' : ''}`
                : `Terminée le ${fmtDate(c.end_date)}`
              }
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
