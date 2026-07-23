'use client'

import { useState } from 'react'
import Link from 'next/link'
import { auth } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
    <div className="min-h-screen flex items-center justify-center mboka-bg px-4">
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-2xl shadow-md border border-border p-8 space-y-6">

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-sidebar mb-4">
              <span className="text-2xl font-bold text-primary">M</span>
            </div>
            <h1 className="text-xl font-semibold text-card-foreground tracking-wide">Mot de passe oublié</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Entrez votre email, nous vous enverrons un lien de réinitialisation.
            </p>
          </div>

          {sent ? (
            <div className="text-center space-y-3 py-2">
              <MailCheck size={40} className="mx-auto text-emerald-500" />
              <p className="text-sm font-medium text-card-foreground">Email envoyé si le compte existe</p>
              <p className="text-xs text-muted-foreground">
                Vérifiez votre boîte de réception (et les indésirables). Le lien est valable 1 heure.
              </p>
              <Link href="/login" className="block text-sm text-primary hover:underline mt-2">
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
                className="w-full bg-primary hover:bg-violet-600 text-primary-foreground font-semibold h-11"
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
