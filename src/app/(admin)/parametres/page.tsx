'use client'

import { useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { members, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { CheckCircle2, AlertCircle, User, Phone, MapPin, KeyRound } from 'lucide-react'

type Status = 'idle' | 'loading' | 'success' | 'error'

const inputCls = 'bg-white border-slate-200 text-slate-800 placeholder:text-muted-foreground focus:border-primary h-9 text-sm'

export default function ParametresPage() {
  const { user } = useAuth()

  const [form, setForm] = useState({
    first_name: user?.first_name ?? '',
    last_name: user?.last_name ?? '',
    phone: user?.phone ?? '',
    address: user?.address ?? '',
  })
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user?.id) return
    setStatus('loading')
    setErrorMsg('')
    try {
      await members.update(user.id, {
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone || undefined,
        address: form.address || undefined,
      })
      setStatus('success')
      setTimeout(() => setStatus('idle'), 3000)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof ApiError ? err.message : 'Erreur lors de la sauvegarde.')
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Paramètres</h1>
        <p className="text-sm text-muted-foreground mt-1">Gérez votre profil et vos informations de contact.</p>
      </div>

      <div className="bg-white border border-primary/15 rounded-xl p-5 flex items-center gap-4 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-linear-to-br from-primary to-primary/80 flex items-center justify-center shrink-0">
          <span className="text-xl font-bold text-white">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">{user?.first_name} {user?.last_name}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
          <p className="text-xs text-primary mt-0.5">{((user?.roles ?? []) as string[])[0] ?? 'Membre'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-primary/15 rounded-xl p-6 space-y-5 shadow-sm">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">Informations personnelles</p>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="first_name" className="text-xs text-slate-500 flex items-center gap-1.5">
              <User size={11} />Prénom
            </label>
            <Input id="first_name" value={form.first_name} onChange={set('first_name')} required className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="last_name" className="text-xs text-slate-500 flex items-center gap-1.5">
              <User size={11} />Nom
            </label>
            <Input id="last_name" value={form.last_name} onChange={set('last_name')} required className={inputCls} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="phone" className="text-xs text-slate-500 flex items-center gap-1.5">
            <Phone size={11} />Téléphone
          </label>
          <Input id="phone" value={form.phone} onChange={set('phone')} placeholder="+33 6 00 00 00 00" type="tel" className={inputCls} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="address" className="text-xs text-slate-500 flex items-center gap-1.5">
            <MapPin size={11} />Adresse
          </label>
          <Input id="address" value={form.address} onChange={set('address')} placeholder="12 rue des Lilas, 75010 Paris" className={inputCls} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-xs text-slate-500">Email</label>
          <Input id="email" value={user?.email ?? ''} disabled className={`${inputCls} opacity-50 cursor-not-allowed`} />
          <p className="text-[11px] text-muted-foreground">L&apos;email ne peut pas être modifié pour l&apos;instant.</p>
        </div>

        {status === 'success' && (
          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
            <CheckCircle2 size={13} />
            Profil mis à jour avec succès.
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle size={13} />
            {errorMsg}
          </div>
        )}

        <Button
          type="submit"
          disabled={status === 'loading'}
          size="sm"
          className="bg-primary hover:bg-primary/80 text-white font-semibold"
        >
          {status === 'loading' ? 'Sauvegarde…' : 'Enregistrer les modifications'}
        </Button>
      </form>

      <div className="bg-white border border-primary/15 rounded-xl p-5 flex items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <KeyRound size={15} className="text-primary" />
          <div>
            <p className="text-sm font-medium text-slate-800">Mot de passe</p>
            <p className="text-xs text-muted-foreground">Recevez un lien par email pour le réinitialiser.</p>
          </div>
        </div>
        <Link href="/mot-de-passe-oublie" className="text-sm text-primary hover:underline font-medium shrink-0">
          Changer
        </Link>
      </div>
    </div>
  )
}
