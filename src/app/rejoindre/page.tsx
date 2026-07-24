'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { auth, joinCode, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'

const inputCls = 'bg-card border-border text-card-foreground placeholder:text-muted-foreground focus:border-primary'

type CodeState = 'entry' | 'checking' | 'valid' | 'invalid'

function RejoindreCodeForm() {
  const searchParams = useSearchParams()
  const prefilledCode = (searchParams.get('code') ?? '').toUpperCase()

  const [codeState, setCodeState] = useState<CodeState>('entry')
  const [code, setCode] = useState(prefilledCode)
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (prefilledCode) validateCode(prefilledCode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function validateCode(value: string) {
    if (!value.trim()) return
    setCodeState('checking')
    setError('')
    try {
      await joinCode.check(value.trim())
      setCode(value.trim().toUpperCase())
      setCodeState('valid')
    } catch {
      setCodeState('invalid')
    }
  }

  function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    validateCode(code)
  }

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
      await auth.registerViaCode({
        code,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
      })
      setDone(true)
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
    <div className="min-h-screen flex items-center justify-center brand-bg px-4">
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-2xl shadow-md border border-border p-8 space-y-6">

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-sidebar mb-4">
              <span className="text-2xl font-bold text-primary">M</span>
            </div>
            <h1 className="text-xl font-semibold text-card-foreground tracking-wide">Rejoindre l&apos;association</h1>
          </div>

          {(codeState === 'entry' || codeState === 'checking') && (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Code d&apos;adhésion *</label>
                <Input
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="EX: A1B2C3D4"
                  required
                  className={`${inputCls} tracking-widest font-mono text-center`}
                />
              </div>
              <Button type="submit" disabled={codeState === 'checking'} className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-semibold h-11">
                {codeState === 'checking' ? <Loader2 size={16} className="animate-spin" /> : 'Valider le code'}
              </Button>
            </form>
          )}

          {codeState === 'invalid' && (
            <div className="text-center space-y-3 py-2">
              <XCircle size={40} className="mx-auto text-error" />
              <p className="text-sm font-medium text-card-foreground">Code invalide ou expiré</p>
              <p className="text-xs text-muted-foreground">
                Vérifiez le code ou contactez l&apos;administrateur pour en obtenir un nouveau.
              </p>
              <Button variant="outline" onClick={() => setCodeState('entry')} className="mt-2 border-border text-muted-foreground">
                Réessayer
              </Button>
            </div>
          )}

          {codeState === 'valid' && done && (
            <div className="text-center space-y-3 py-2">
              <CheckCircle2 size={40} className="mx-auto text-success" />
              <p className="text-sm font-medium text-card-foreground">Demande envoyée !</p>
              <p className="text-xs text-muted-foreground">
                Votre compte a été créé et est en attente de validation par un administrateur.
                Vous recevrez un accès dès son approbation.
              </p>
              <Link href="/login" className="block text-sm text-primary hover:underline mt-2">
                Retour à la connexion
              </Link>
            </div>
          )}

          {codeState === 'valid' && !done && (
            <>
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
                  <label className="text-xs text-muted-foreground">Email *</label>
                  <Input type="email" value={form.email} onChange={set('email')}
                    placeholder="marie.dupont@example.com" required className={inputCls} />
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
                  <p className="text-sm text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-semibold h-11"
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

export default function RejoindreCodePage() {
  return (
    <Suspense fallback={<div className="min-h-screen brand-bg" />}>
      <RejoindreCodeForm />
    </Suspense>
  )
}
