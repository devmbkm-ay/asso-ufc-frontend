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
      'bg-white border-[rgba(200,169,110,0.18)] shadow-sm p-5 space-y-1',
      className,
    )}>
      <p className="text-xs text-[#9B928B] uppercase tracking-wide">{label}</p>
      <p className={cn(
        'text-2xl font-bold',
        accent ? 'text-[#C8A96E]' : 'text-[#1a1a1a]',
      )}>
        {value}
      </p>
      {sub && <p className="text-xs text-[#B0A9A2]">{sub}</p>}
    </Card>
  )
}
