'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth, ApiError } from '@/lib/api'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Toast } from '@/components/ui/toast'
import { CheckCircle2 } from 'lucide-react'

const inputCls = 'bg-card border-border text-card-foreground placeholder:text-muted-foreground focus:border-primary'

export default function ResetPasswordPage() {
  const params = useParams<{ token: string }>()
  const router = useRouter()
  const token = params.token

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await auth.resetPassword(token, password)
      setDone(true)
      setTimeout(() => router.push('/login'), 2500)
    } catch (err: unknown) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Une erreur est survenue.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center brand-bg px-4">
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-2xl shadow-md border border-border p-8 space-y-6">

          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Logo variant="icon" size="md" />
            </div>
            <h1 className="text-xl font-semibold text-card-foreground tracking-wide">Nouveau mot de passe</h1>
          </div>

          {done ? (
            <div className="space-y-3">
              <Toast
                variant="success"
                title="Mot de passe réinitialisé !"
                description="Redirection vers la page de connexion…"
              />
              <div className="text-center">
                <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground" htmlFor="password">Nouveau mot de passe</label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="8 caractères min, 1 chiffre"
                  minLength={8}
                  required
                  className={inputCls}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground" htmlFor="confirm">Confirmer</label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={inputCls}
                />
              </div>

              {error && (
                <Toast
                  variant="error"
                  title="Réinitialisation impossible"
                  description={error}
                />
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-semibold h-11"
              >
                {loading ? 'Réinitialisation…' : 'Réinitialiser mon mot de passe'}
              </Button>
            </form>
          )}

        </div>
      </div>
    </div>
  )
}
