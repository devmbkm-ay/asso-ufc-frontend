'use client'

import { useState } from 'react'
import Link from 'next/link'
import { auth } from '@/lib/api'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Toast } from '@/components/ui/toast'
import { MailCheck } from 'lucide-react'

const inputCls = 'bg-card border-border text-card-foreground placeholder:text-muted-foreground focus:border-primary'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await auth.forgotPassword(email)
    } finally {
      // Toujours afficher le même état de succès, que l'email existe ou non.
      setLoading(false)
      setSent(true)
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
            <h1 className="text-xl font-semibold text-card-foreground tracking-wide">Mot de passe oublié</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Entrez votre email, nous vous enverrons un lien de réinitialisation.
            </p>
          </div>

          {sent ? (
            <div className="space-y-3">
              <Toast
                variant="success"
                title="Email envoyé"
                description="Si le compte existe, vous recevrez un lien de réinitialisation valable 1 heure."
              />
              <div className="text-center">
                <MailCheck size={40} className="mx-auto text-emerald-500" />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Vérifiez votre boîte de réception (et les indésirables).
              </p>
              <Link href="/login" className="block text-sm text-primary hover:underline mt-2 text-center">
                Retour à la connexion
              </Link>
            </div>
          ) : (
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

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/80 text-primary-foreground font-semibold h-11"
              >
                {loading ? 'Envoi…' : 'Envoyer le lien'}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                <Link href="/login" className="text-primary hover:underline font-medium">
                  Retour à la connexion
                </Link>
              </p>
            </form>
          )}

        </div>
      </div>
    </div>
  )
}
