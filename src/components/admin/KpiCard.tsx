import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  label: string
  value: string | number
  sub?: string
  accent?: boolean
  className?: string
  href?: string
}

export function KpiCard({ label, value, sub, accent, className, href }: KpiCardProps) {
  const card = (
    <Card className={cn(
      'bg-white border-[rgba(99,102,241,0.15)] shadow-sm p-5 space-y-1',
      accent && 'border-t-2 border-t-[#6366F1]',
      href && 'hover:border-[rgba(99,102,241,0.35)] hover:shadow-md transition-all cursor-pointer',
      className,
    )}>
      <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
      <p className={cn(
        'text-2xl font-bold',
        accent ? 'text-[#6366F1]' : 'text-slate-800',
      )}>
        {value}
      </p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </Card>
  )

  return href ? <Link href={href} className="block">{card}</Link> : card
}
