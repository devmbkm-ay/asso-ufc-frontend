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
      const me = await login(email, password)
      const isElevated = me.roles.some(r =>
        ['super_admin', 'president', 'treasurer', 'secretary'].includes(r),
      )
      router.push(isElevated ? '/dashboard' : '/mon-espace')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Identifiants incorrects')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'bg-card border-border text-card-foreground placeholder:text-muted-foreground focus:border-primary'

  return (
    <div className="min-h-screen flex items-center justify-center mboka-bg px-4">
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-2xl shadow-md border border-border p-8 space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-sidebar mb-4">
              <span className="text-2xl font-bold text-primary">M</span>
            </div>
            <h1 className="text-2xl font-semibold text-card-foreground tracking-wide">Mboka</h1>
            <p className="text-sm text-muted-foreground mt-1">Bienvenue dans votre espace</p>
          </div>

          {justRegistered && (
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-center">
              Compte créé ! Connectez-vous.
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground" htmlFor="email">Adresse email</label>
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
              <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground" htmlFor="password">Mot de passe</label>
                <Link href="/mot-de-passe-oublie" className="text-xs text-primary hover:underline">
                  Mot de passe oublié ?
                </Link>
              </div>
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
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-violet-600 text-primary-foreground font-semibold h-11"
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-primary hover:underline font-medium">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen mboka-bg" />}>
      <LoginForm />
    </Suspense>
  )
}
