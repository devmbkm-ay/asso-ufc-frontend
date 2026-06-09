'use client'

import { useRef, useState } from 'react'
import { useParams } from 'next/navigation'
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
import { ArrowLeft, Heart, Users, Clock, HandCoins, Pencil, ImagePlus, X, Archive, Lock, AlertTriangle } from 'lucide-react'

const CATEGORY_LABEL: Record<string, string> = {
  deces: 'Décès',
  mariage: 'Mariage',
  naissance: 'Naissance',
  maladie: 'Maladie',
  autre: 'Autre',
}

function fmtEur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function daysLeft(endDate: string) {
  const diff = new Date(endDate).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  upcoming: { label: 'À venir', className: 'text-[10px] border bg-blue-50 text-blue-600 border-blue-200' },
  active: { label: 'En cours', className: 'text-[10px] border bg-emerald-50 text-emerald-700 border-emerald-200' },
  expired: { label: 'Expirée', className: 'text-[10px] border bg-gray-100 text-gray-500 border-gray-200' },
  closed: { label: 'Clôturée', className: 'text-[10px] border bg-orange-50 text-orange-600 border-orange-200' },
}

const FIELD = 'bg-white border-[rgba(0,0,0,0.12)] text-[#1a1a1a] placeholder:text-[#B0A9A2] focus:border-[#6366F1]'

export default function CollecteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const canEdit = user?.roles.some(r => ['super_admin', 'secretary'].includes(r))
  const canAdmin = user?.roles.some(r => ['super_admin'].includes(r))

  // ── Contribution state ────────────────────────────────────────────────────
  const [openContrib, setOpenContrib] = useState(false)
  const [amount, setAmount] = useState('')
  const [contribError, setContribError] = useState<string | null>(null)

  // ── Admin actions state ───────────────────────────────────────────────────
  const [closeOpen, setCloseOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)

  // ── Edit state ────────────────────────────────────────────────────────────
  const [openEdit, setOpenEdit] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '', beneficiary_name: '', description: '', min_amount: '',
  })
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null)
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null)
  const [editPhotoUrl, setEditPhotoUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // ── Queries ───────────────────────────────────────────────────────────────
  const { data: collecte, isLoading } = useQuery({
    queryKey: ['collecte', id],
    queryFn: () => collectes.get(id),
    refetchInterval: 30_000,
  })

  const { data: contributions } = useQuery({
    queryKey: ['collecte-contributions', id],
    queryFn: () => collectes.contributions(id),
    refetchInterval: 30_000,
    enabled: !!id,
  })

  // ── Contribute mutation ───────────────────────────────────────────────────
  const { mutate: contribute, isPending: contribPending } = useMutation({
    mutationFn: (amt: number) => collectes.contribute(id, amt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collecte', id] })
      queryClient.invalidateQueries({ queryKey: ['collecte-contributions', id] })
      setOpenContrib(false)
      setAmount('')
      setContribError(null)
    },
    onError: (err: unknown) => {
      setContribError(err instanceof ApiError ? err.message : 'Erreur inattendue')
    },
  })

  // ── Admin mutations ───────────────────────────────────────────────────────
  const { mutate: closeCollecte, isPending: closePending } = useMutation({
    mutationFn: () => collectes.close(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collecte', id] })
      queryClient.invalidateQueries({ queryKey: ['collectes'] })
      setCloseOpen(false)
    },
  })

  const { mutate: archiveCollecte, isPending: archivePending } = useMutation({
    mutationFn: () => collectes.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collecte', id] })
      queryClient.invalidateQueries({ queryKey: ['collectes'] })
      setArchiveOpen(false)
    },
  })

  // ── Edit mutation ─────────────────────────────────────────────────────────
  const { mutate: updateCollecte, isPending: editPending } = useMutation({
    mutationFn: (data: Parameters<typeof collectes.update>[1]) => collectes.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collecte', id] })
      queryClient.invalidateQueries({ queryKey: ['collectes'] })
      closeEditModal()
    },
    onError: (err: unknown) => {
      setEditError(err instanceof ApiError ? err.message : 'Erreur inattendue')
    },
  })

  // ── Handlers ─────────────────────────────────────────────────────────────
  function openEditModal() {
    if (!collecte) return
    setEditForm({
      title: collecte.title,
      beneficiary_name: collecte.beneficiary_name,
      description: collecte.description ?? '',
      min_amount: String(collecte.min_amount),
    })
    setEditPhotoFile(null)
    setEditPhotoPreview(collecte.photo_url ?? null)
    setEditPhotoUrl(collecte.photo_url ?? null)
    setEditError(null)
    setOpenEdit(true)
  }

  function closeEditModal() {
    setOpenEdit(false)
    setEditPhotoFile(null)
    setEditPhotoPreview(null)
    setEditPhotoUrl(null)
    setEditError(null)
  }

  function editField(key: keyof typeof editForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setEditForm(f => ({ ...f, [key]: e.target.value }))
  }

  function handleEditFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setEditPhotoFile(file)
    setEditPhotoPreview(URL.createObjectURL(file))
    setEditPhotoUrl(null)
  }

  function removeEditPhoto() {
    setEditPhotoFile(null)
    setEditPhotoPreview(null)
    setEditPhotoUrl('')
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setEditError(null)

    let photo_url = editPhotoUrl ?? undefined

    if (editPhotoFile) {
      setUploading(true)
      try {
        const res = await upload.image(editPhotoFile)
        photo_url = res.url
      } catch (err) {
        setEditError(err instanceof ApiError ? err.message : 'Échec de l\'upload photo')
        setUploading(false)
        return
      }
      setUploading(false)
    }

    updateCollecte({
      title: editForm.title || undefined,
      beneficiary_name: editForm.beneficiary_name || undefined,
      photo_url: photo_url,
      description: editForm.description || undefined,
      min_amount: Number(editForm.min_amount) || undefined,
    })
  }

  function handleContrib(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setContribError(null)
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) {
      setContribError('Montant invalide')
      return
    }
    contribute(amt)
  }

  function closeContribModal() {
    setOpenContrib(false)
    setAmount('')
    setContribError(null)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!collecte) return null

  const remaining = daysLeft(collecte.end_date)

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">

      <Link
        href="/collectes"
        className="flex items-center gap-1.5 text-sm text-[#9B928B] hover:text-[#1a1a1a] transition-colors w-fit"
      >
        <ArrowLeft size={14} />
        Retour aux collectes
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-[rgba(200,169,110,0.18)] shadow-sm p-6">
        <div className="flex gap-5">
          <div className="w-20 h-20 rounded-full shrink-0 overflow-hidden bg-[#F0EBE2] flex items-center justify-center">
            {collecte.photo_url
              ? <img src={collecte.photo_url} alt={collecte.beneficiary_name} className="w-full h-full object-cover" />
              : <Heart size={30} className="text-[#06B6D4]" />
            }
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-xl font-semibold text-[#1a1a1a]">{collecte.title}</h1>
                <p className="text-sm text-[#9B928B] mt-0.5">En mémoire de {collecte.beneficiary_name}</p>
                {collecte.category && (
                  <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full bg-[#F0EBE2] text-[#8B6B30] border border-[rgba(200,169,110,0.3)]">
                    {CATEGORY_LABEL[collecte.category] ?? collecte.category}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge className={STATUS_BADGE[collecte.status]?.className ?? STATUS_BADGE.expired.className}>
                  {STATUS_BADGE[collecte.status]?.label ?? 'Expirée'}
                </Badge>
                {canEdit && !collecte.is_archived && (
                  <button
                    onClick={openEditModal}
                    className="p-1.5 rounded-md text-[#9B928B] hover:text-[#06B6D4] hover:bg-[#F0EBE2] transition-colors"
                    title="Modifier"
                  >
                    <Pencil size={14} />
                  </button>
                )}
              </div>
            </div>

            {collecte.description && (
              <p className="text-sm text-[#6B6560] mt-3 leading-relaxed">{collecte.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Actions admin */}
      {canAdmin && !collecte.is_archived && (
        <div className="flex gap-2 flex-wrap">
          {collecte.status !== 'closed' && (
            <Button
              variant="outline"
              onClick={() => setCloseOpen(true)}
              className="gap-1.5 text-xs border-[rgba(0,0,0,0.12)] text-[#6B6560] bg-transparent hover:border-orange-300 hover:text-orange-600"
            >
              <Lock size={13} />
              Clôturer la collecte
            </Button>
          )}
          {(collecte.status === 'closed' || collecte.status === 'expired') && (
            <Button
              variant="outline"
              onClick={() => setArchiveOpen(true)}
              className="gap-1.5 text-xs border-[rgba(0,0,0,0.12)] text-[#6B6560] bg-transparent hover:border-purple-300 hover:text-purple-600"
            >
              <Archive size={13} />
              Archiver
            </Button>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[rgba(200,169,110,0.18)] shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-[#06B6D4]">{fmtEur(collecte.total_collected)}</p>
          <p className="text-xs text-[#9B928B] mt-1">Total collecté</p>
        </div>
        <div className="bg-white rounded-xl border border-[rgba(200,169,110,0.18)] shadow-sm p-4 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <Users size={14} className="text-[#06B6D4]" />
            <p className="text-2xl font-bold text-[#1a1a1a]">{collecte.contributors_count}</p>
          </div>
          <p className="text-xs text-[#9B928B] mt-1">Contributeur{collecte.contributors_count > 1 ? 's' : ''}</p>
        </div>
        <div className="bg-white rounded-xl border border-[rgba(200,169,110,0.18)] shadow-sm p-4 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <Clock size={14} className="text-[#06B6D4]" />
            <p className="text-2xl font-bold text-[#1a1a1a]">
              {collecte.is_active ? remaining : '—'}
            </p>
          </div>
          <p className="text-xs text-[#9B928B] mt-1">
            {collecte.is_active
              ? `jour${remaining > 1 ? 's' : ''} restant${remaining > 1 ? 's' : ''}`
              : `Fin le ${fmtDate(collecte.end_date)}`
            }
          </p>
        </div>
      </div>

      {/* Bouton contribuer */}
      {collecte.is_active && (
        <Dialog open={openContrib} onOpenChange={next => { if (!next) closeContribModal(); else setOpenContrib(true) }}>
          <Button
            onClick={() => setOpenContrib(true)}
            className="w-full bg-[#6366F1] hover:bg-[#4F46E5] text-white gap-2 py-5 text-base"
          >
            <HandCoins size={18} />
            Contribuer — minimum {fmtEur(collecte.min_amount)}
          </Button>

          <DialogContent className="bg-white border-[rgba(0,0,0,0.08)] sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-[#1a1a1a]">Ma contribution</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleContrib} className="space-y-4 mt-1">
              <div className="space-y-1.5">
                <label className="text-xs text-[#6B6560]">
                  Montant <span className="text-[#B0A9A2]">(minimum {fmtEur(collecte.min_amount)})</span>
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    min={collecte.min_amount}
                    step="0.01"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    required
                    placeholder={String(collecte.min_amount)}
                    className="bg-white border-[rgba(0,0,0,0.12)] text-[#1a1a1a] pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#9B928B]">€</span>
                </div>
              </div>

              {contribError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {contribError}
                </p>
              )}

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeContribModal}
                  className="border-[rgba(0,0,0,0.12)] text-[#6B6560] bg-transparent"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={contribPending}
                  className="bg-[#6366F1] hover:bg-[#4F46E5] text-white"
                >
                  {contribPending ? 'Envoi…' : 'Confirmer'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal édition */}
      <Dialog open={openEdit} onOpenChange={next => { if (!next) closeEditModal(); else setOpenEdit(true) }}>
        <DialogContent className="bg-white border-[rgba(0,0,0,0.08)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1a1a1a]">Modifier la collecte</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 mt-1">
            <div className="space-y-1.5">
              <label className="text-xs text-[#6B6560]">Titre</label>
              <Input value={editForm.title} onChange={editField('title')} required className={FIELD} />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[#6B6560]">Nom du défunt</label>
              <Input value={editForm.beneficiary_name} onChange={editField('beneficiary_name')} required className={FIELD} />
            </div>

            {/* Photo */}
            <div className="space-y-1.5">
              <label className="text-xs text-[#6B6560]">
                Photo <span className="text-[#B0A9A2]">(JPEG, PNG, WEBP · max 5 Mo)</span>
              </label>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleEditFileChange}
              />
              {editPhotoPreview ? (
                <div className="relative w-20 h-20 rounded-full overflow-hidden bg-[#F0EBE2] group">
                  <img src={editPhotoPreview} alt="Aperçu" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={removeEditPhoto}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <X size={16} className="text-white" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-[rgba(0,0,0,0.15)] text-xs text-[#9B928B] hover:border-[#6366F1] hover:text-[#6366F1] transition-colors"
                >
                  <ImagePlus size={14} />
                  Choisir une photo
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[#6B6560]">Message</label>
              <textarea
                value={editForm.description}
                onChange={editField('description')}
                rows={3}
                className="w-full rounded-md border border-[rgba(0,0,0,0.12)] bg-white px-3 py-2 text-sm text-[#1a1a1a] placeholder:text-[#B0A9A2] focus:outline-none focus:border-[#6366F1] resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[#6B6560]">Montant minimum (€)</label>
              <Input
                type="number"
                min={1}
                value={editForm.min_amount}
                onChange={editField('min_amount')}
                className={FIELD}
              />
            </div>

            {editError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {editError}
              </p>
            )}

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeEditModal}
                className="border-[rgba(0,0,0,0.12)] text-[#6B6560] bg-transparent"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={editPending || uploading}
                className="bg-[#C8A96E] hover:bg-[#b8994e] text-white"
              >
                {uploading ? 'Upload…' : editPending ? 'Sauvegarde…' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog clôture ───────────────────────────────────────────────────── */}
      <Dialog open={closeOpen} onOpenChange={open => { if (!open) setCloseOpen(false) }}>
        <DialogContent className="bg-white border-[rgba(0,0,0,0.08)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#1a1a1a] flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-500" />
              Clôturer la collecte
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#6B6560] mt-1">
            La collecte sera clôturée immédiatement. Plus aucune contribution ne sera acceptée.
          </p>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setCloseOpen(false)} className="border-[rgba(0,0,0,0.12)] text-[#6B6560] bg-transparent">Annuler</Button>
            <Button disabled={closePending} onClick={() => closeCollecte()} className="bg-orange-500 hover:bg-orange-600 text-white">
              {closePending ? 'Clôture…' : 'Confirmer la clôture'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog archivage ─────────────────────────────────────────────────── */}
      <Dialog open={archiveOpen} onOpenChange={open => { if (!open) setArchiveOpen(false) }}>
        <DialogContent className="bg-white border-[rgba(0,0,0,0.08)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#1a1a1a] flex items-center gap-2">
              <Archive size={16} className="text-purple-500" />
              Archiver la collecte
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#6B6560] mt-1">
            La collecte sera déplacée vers l'historique. Elle restera consultable mais n'apparaîtra plus dans la liste principale.
          </p>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setArchiveOpen(false)} className="border-[rgba(0,0,0,0.12)] text-[#6B6560] bg-transparent">Annuler</Button>
            <Button disabled={archivePending} onClick={() => archiveCollecte()} className="bg-purple-500 hover:bg-purple-600 text-white">
              {archivePending ? 'Archivage…' : 'Confirmer l\'archivage'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Liste contributions */}
      <div className="bg-white rounded-xl border border-[rgba(200,169,110,0.18)] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[rgba(200,169,110,0.12)]">
          <h2 className="text-sm font-semibold text-[#1a1a1a]">Contributions</h2>
        </div>

        {!contributions && (
          <div className="px-5 py-8 text-center text-[#9B928B] text-sm">Chargement…</div>
        )}
        {contributions?.length === 0 && (
          <div className="px-5 py-10 text-center text-[#9B928B] text-sm">
            Soyez le premier à contribuer
          </div>
        )}
        {contributions && contributions.length > 0 && (
          <ul className="divide-y divide-[rgba(200,169,110,0.08)]">
            {contributions.map(c => (
              <li key={c.id} className="px-5 py-3.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#F0EBE2] flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-[#8B6B30]">
                    {c.member_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1a1a1a]">{c.member_name}</p>
                  <p className="text-xs text-[#9B928B]">{fmtDateTime(c.contributed_at)}</p>
                </div>
                <p className="text-sm font-semibold text-[#06B6D4]">{fmtEur(c.amount)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
