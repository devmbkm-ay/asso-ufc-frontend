import Link from 'next/link'
import { Heart } from 'lucide-react'

const LEGAL_LINKS = [
  { href: '/mentions-legales', label: 'Mentions légales' },
  { href: '/politique-confidentialite', label: 'Politique de confidentialité' },
  { href: '/cgu', label: "Conditions générales d'utilisation" },
]

export function Footer() {
  return (
    <footer className="border-t border-border px-4 py-4 sm:px-8">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          {LEGAL_LINKS.map(link => (
            <Link key={link.href} href={link.href} className="hover:text-foreground transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="flex items-center gap-1">
          Made with <Heart size={11} className="text-red-400 fill-red-400" /> by Ricardo MBK
        </p>
      </div>
    </footer>
  )
}
