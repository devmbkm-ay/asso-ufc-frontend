import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  label: string
  value: string | number
  sub?: string
  accent?: boolean
  className?: string
}

export function KpiCard({ label, value, sub, accent, className }: KpiCardProps) {
  return (
    <Card className={cn(
      'bg-[#1e1e1e] border-[rgba(255,255,255,0.06)] p-5 space-y-1',
      className,
    )}>
      <p className="text-xs text-[#888] uppercase tracking-wide">{label}</p>
      <p className={cn(
        'text-2xl font-bold',
        accent ? 'text-[#C8A96E]' : 'text-white',
      )}>
        {value}
      </p>
      {sub && <p className="text-xs text-[#555]">{sub}</p>}
    </Card>
  )
}
