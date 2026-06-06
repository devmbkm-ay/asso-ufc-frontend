'use client'

import { useState } from 'react'
import { useAuth } from '@/providers/AuthProvider'
import { members, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle2, AlertCircle, User, Phone, MapPin } from 'lucide-react'

type Status = 'idle' | 'loading' | 'success' | 'error'

const inputCls = 'bg-[#252525] border-[rgba(255,255,255,0.08)] text-white placeholder:text-[#444] focus:border-[#C8A96E] h-9 text-sm'

export default function ParametresPage() {
  const { user } = useAuth()

  const [form, setForm] = useState({
    first_name: user?.first_name ?? '',
    last_name:  user?.last_name  ?? '',
    phone:      (user as Record<string, unknown>)?.phone as string ?? '',
    address:    (user as Record<string, unknown>)?.address as string ?? '',
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
        last_name:  form.last_name,
        phone:      form.phone || undefined,
        address:    form.address || undefined,
      })
      setStatus('success')
      setTimeout(() => setStatus('idle'), 3000)
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof ApiError ? err.message : 'Erreur lors de la sauvegarde.')
    }
  }

  return (
    <div className="p-8 max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-white">Paramètres</h1>
        <p className="text-sm text-[#888] mt-1">Gérez votre profil et vos informations de contact.</p>
      </div>

      {/* Avatar / identity */}
      <div className="mboka-card bg-[#1e1e1e] border rounded-xl p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-[#2D5016] flex items-center justify-center shrink-0">
          <span className="text-xl font-bold text-white">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{user?.first_name} {user?.last_name}</p>
          <p className="text-xs text-[#888]">{user?.email}</p>
          <p className="text-xs text-[#C8A96E] mt-0.5">{((user?.roles ?? []) as string[])[0] ?? 'Membre'}</p>
        </div>
      </div>

      {/* Profile form */}
      <form onSubmit={handleSubmit} className="mboka-card bg-[#1e1e1e] border rounded-xl p-6 space-y-5">
        <p className="text-xs font-semibold tracking-widest text-[#555] uppercase">Informations personnelles</p>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-[#888] flex items-center gap-1.5">
              <User size={11} />Prénom
            </label>
            <Input value={form.first_name} onChange={set('first_name')} required className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-[#888] flex items-center gap-1.5">
              <User size={11} />Nom
            </label>
            <Input value={form.last_name} onChange={set('last_name')} required className={inputCls} />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-[#888] flex items-center gap-1.5">
            <Phone size={11} />Téléphone
          </label>
          <Input value={form.phone} onChange={set('phone')} placeholder="+33 6 00 00 00 00" type="tel" className={inputCls} />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-[#888] flex items-center gap-1.5">
            <MapPin size={11} />Adresse
          </label>
          <Input value={form.address} onChange={set('address')} placeholder="12 rue des Lilas, 75010 Paris" className={inputCls} />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-[#888]">Email</label>
          <Input value={user?.email ?? ''} disabled className={`${inputCls} opacity-50 cursor-not-allowed`} />
          <p className="text-[11px] text-[#555]">L'email ne peut pas être modifié pour l'instant.</p>
        </div>

        {status === 'success' && (
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 rounded-lg px-3 py-2">
            <CheckCircle2 size={13} />
            Profil mis à jour avec succès.
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/30 border border-red-800/40 rounded-lg px-3 py-2">
            <AlertCircle size={13} />
            {errorMsg}
          </div>
        )}

        <Button
          type="submit"
          disabled={status === 'loading'}
          size="sm"
          className="bg-[#C8A96E] hover:bg-[#b8955a] text-[#141414] font-semibold"
        >
          {status === 'loading' ? 'Sauvegarde…' : 'Enregistrer les modifications'}
        </Button>
      </form>

      {/* Danger zone */}
      <div className="mboka-card bg-[#1e1e1e] border border-red-900/30 rounded-xl p-5 space-y-3">
        <p className="text-xs font-semibold tracking-widest text-[#555] uppercase">Zone sensible</p>
        <p className="text-xs text-[#666]">La suppression de compte et la réinitialisation du mot de passe seront disponibles dans une prochaine version.</p>
      </div>
    </div>
  )
}
