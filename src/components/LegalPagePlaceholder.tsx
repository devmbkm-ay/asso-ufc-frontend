import Link from 'next/link'
import { AlertTriangle, ArrowLeft } from 'lucide-react'

export function LegalPagePlaceholder({ title }: { title: string }) {
  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:py-16">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={14} />
          Retour à l'accueil
        </Link>

        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>

        <div className="flex items-start gap-3 bg-warning/10 border border-warning/30 rounded-xl p-4 text-sm text-warning">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <p>
            Cette page est en cours de rédaction. Le contenu définitif sera publié
            prochainement — la version actuelle est provisoire et ne peut pas être
            considérée comme le document officiel.
          </p>
        </div>
      </div>
    </div>
  )
}
