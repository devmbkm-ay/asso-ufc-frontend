'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/providers/AuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function LoginForm() {
  const { login } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const justRegistered = params.get('registered') === '1'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Identifiants incorrects')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'bg-[#1e1e1e] border-[rgba(255,255,255,0.1)] text-white placeholder:text-[#555] focus:border-[#C8A96E] focus:ring-[#C8A96E]'

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#141414]">
      <div className="w-full max-w-sm space-y-8 px-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#C8A96E] mb-4">
            <span className="text-2xl font-bold text-[#141414]">M</span>
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-wide">Mboka</h1>
          <p className="text-sm text-[#888] mt-1">Espace administration</p>
        </div>

        {justRegistered && (
          <p className="text-sm text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 rounded-md px-3 py-2 text-center">
            Compte créé ! Connectez-vous.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-[#c8c4bc]" htmlFor="email">Adresse email</label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="vous@example.com"
              required
              className={inputCls}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-[#c8c4bc]" htmlFor="password">Mot de passe</label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className={inputCls}
            />
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
            {loading ? 'Connexion…' : 'Se connecter'}
          </Button>
        </form>

        <p className="text-center text-sm text-[#555]">
          Pas encore de compte ?{' '}
          <Link href="/register" className="text-[#C8A96E] hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    // <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#141414] text-white">Chargement...</div>}>
    <Suspense fallback={<div className="min-h-screen bg-[#141414]" />}>
      <LoginForm />
    </Suspense>
  )
}