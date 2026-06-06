'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm: '',
  })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await auth.setup({
        first_name: form.first_name,
        last_name:  form.last_name,
        email:      form.email,
        password:   form.password,
      })
      router.push('/login?registered=1')
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 403) {
        setError('Un compte administrateur existe déjà. Connectez-vous directement.')
      } else {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
      }
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'bg-[#1e1e1e] border-[rgba(255,255,255,0.1)] text-white placeholder:text-[#555] focus:border-[#C8A96E]'

  return (
    <div className="min-h-screen flex items-center justify-center mboka-bg">
      <div className="w-full max-w-sm space-y-8 px-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#C8A96E] mb-4">
            <span className="text-2xl font-bold text-[#141414]">M</span>
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-wide">Premier compte</h1>
          <p className="text-sm text-[#888] mt-1">Création du super-administrateur</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm text-[#c8c4bc]" htmlFor="first_name">Prénom</label>
              <Input id="first_name" value={form.first_name} onChange={set('first_name')}
                placeholder="Marie" required className={inputCls} />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[#c8c4bc]" htmlFor="last_name">Nom</label>
              <Input id="last_name" value={form.last_name} onChange={set('last_name')}
                placeholder="Dupont" required className={inputCls} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[#c8c4bc]" htmlFor="email">Adresse email</label>
            <Input id="email" type="email" value={form.email} onChange={set('email')}
              placeholder="vous@example.com" required className={inputCls} />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[#c8c4bc]" htmlFor="password">Mot de passe</label>
            <Input id="password" type="password" value={form.password} onChange={set('password')}
              placeholder="8 caractères minimum" minLength={8} required className={inputCls} />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[#c8c4bc]" htmlFor="confirm">Confirmer</label>
            <Input id="confirm" type="password" value={form.confirm} onChange={set('confirm')}
              placeholder="••••••••" required className={inputCls} />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-950/40 border border-red-800/50 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#C8A96E] hover:bg-[#b8955a] text-[#141414] font-semibold h-11"
          >
            {loading ? 'Création…' : 'Créer le compte administrateur'}
          </Button>
        </form>

        <p className="text-center text-sm text-[#555]">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-[#C8A96E] hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
