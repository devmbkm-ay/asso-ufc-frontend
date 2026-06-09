'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth, invites, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'

const inputCls = 'bg-card border-border text-card-foreground placeholder:text-muted-foreground focus:border-primary'

type TokenState = 'loading' | 'valid' | 'invalid'

export default function RejoindreTokenPage() {
  const params = useParams<{ token: string }>()
  const router = useRouter()
  const token = params.token

  const [tokenState, setTokenState] = useState<TokenState>('loading')
  const [email, setEmail] = useState('')
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    invites.check(token)
      .then(data => { setEmail(data.email); setTokenState('valid') })
      .catch(() => setTokenState('invalid'))
  }, [token])

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
      await auth.register({
        token,
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone || undefined,
        password: form.password,
      })
      setDone(true)
      setTimeout(() => router.push('/login'), 2500)
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 409) {
        setError('Un compte avec cet email existe déjà. Connectez-vous directement.')
      } else {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center mboka-bg px-4">
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-2xl shadow-md border border-border p-8 space-y-6">

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-sidebar mb-4">
              <span className="text-2xl font-bold text-primary">M</span>
            </div>
            <h1 className="text-xl font-semibold text-card-foreground tracking-wide">Rejoindre l'association</h1>
          </div>

          {tokenState === 'loading' && (
            <div className="flex justify-center py-6">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          )}

          {tokenState === 'invalid' && (
            <div className="text-center space-y-3 py-2">
              <XCircle size={40} className="mx-auto text-red-400" />
              <p className="text-sm font-medium text-card-foreground">Lien invalide ou expiré</p>
              <p className="text-xs text-muted-foreground">
                Ce lien d'invitation n'est plus valide. Contactez l'administrateur pour en obtenir un nouveau.
              </p>
              <Link href="/login" className="block text-sm text-primary hover:underline mt-2">
                Retour à la connexion
              </Link>
            </div>
          )}

          {tokenState === 'valid' && done && (
            <div className="text-center space-y-3 py-2">
              <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
              <p className="text-sm font-medium text-card-foreground">Compte créé avec succès !</p>
              <p className="text-xs text-muted-foreground">Redirection vers la page de connexion…</p>
            </div>
          )}

          {tokenState === 'valid' && !done && (
            <>
              <p className="text-sm text-center text-muted-foreground">
                Invitation pour <strong className="text-card-foreground">{email}</strong>
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Prénom *</label>
                    <Input value={form.first_name} onChange={set('first_name')}
                      placeholder="Marie" required className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Nom *</label>
                    <Input value={form.last_name} onChange={set('last_name')}
                      placeholder="Dupont" required className={inputCls} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Téléphone</label>
                  <Input value={form.phone} onChange={set('phone')}
                    placeholder="06 00 00 00 00" className={inputCls} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Mot de passe *</label>
                  <Input type="password" value={form.password} onChange={set('password')}
                    placeholder="8 caractères min, 1 chiffre" minLength={8} required className={inputCls} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Confirmer *</label>
                  <Input type="password" value={form.confirm} onChange={set('confirm')}
                    placeholder="••••••••" required className={inputCls} />
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
                  {loading ? 'Création…' : 'Créer mon compte'}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                Déjà un compte ?{' '}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Se connecter
                </Link>
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
