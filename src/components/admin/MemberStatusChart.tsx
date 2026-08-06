'use client'

import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { members } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { PieChart } from 'lucide-react'
import type { MemberStatusCounts } from '@/lib/types'

// Ordre fixe — chaque statut garde toujours le même jeton --chart-N,
// jamais réassigné (voir globals.css).
const STATUS_SERIES: { key: keyof MemberStatusCounts; label: string; color: string }[] = [
  { key: 'active', label: 'Actifs', color: 'var(--chart-1)' },
  { key: 'inactive', label: 'Inactifs', color: 'var(--chart-2)' },
  { key: 'suspended', label: 'Suspendus', color: 'var(--chart-3)' },
  { key: 'honorary', label: 'Honoraires', color: 'var(--chart-4)' },
  { key: 'pending', label: 'En attente', color: 'var(--chart-5)' },
  { key: 'deceased', label: 'Décédés', color: 'var(--chart-6)' },
]

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number; color: string }[] }) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md flex items-center gap-2">
      <span className="inline-block size-2 rounded-full" style={{ backgroundColor: entry.color }} />
      <p className="text-sm font-semibold text-card-foreground">{entry.value}</p>
      <p className="text-xs text-muted-foreground">{entry.name}</p>
    </div>
  )
}

export function MemberStatusChart() {
  const { data: counts } = useQuery({
    queryKey: ['members', 'status-counts'],
    queryFn: members.statusCounts,
  })

  const total = counts ? Object.values(counts).reduce((sum, n) => sum + n, 0) : 0
  const row = { name: 'Membres', ...(counts ?? {}) } as { name: string } & Partial<MemberStatusCounts>

  return (
    <Card className="bg-card border-border shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <PieChart size={15} className="text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Répartition des membres</h2>
      </div>
      {!counts ? (
        <Skeleton className="h-[120px] w-full" />
      ) : (
        <>
          <div className="rounded-full overflow-hidden">
            <ResponsiveContainer width="100%" height={28}>
              <BarChart data={[row]} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barCategoryGap={0}>
                <XAxis type="number" hide domain={[0, total || 1]} />
                <YAxis type="category" dataKey="name" hide />
                <Tooltip content={<CustomTooltip />} cursor={false} />
                {STATUS_SERIES.map(s => (
                  <Bar
                    key={s.key}
                    dataKey={s.key}
                    stackId="a"
                    fill={s.color}
                    stroke="var(--card)"
                    strokeWidth={2}
                    name={s.label}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
            {STATUS_SERIES.map(s => (
              <li key={s.key} className="flex items-center gap-2 text-xs">
                <span className="inline-block size-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-muted-foreground flex-1 truncate">{s.label}</span>
                <span className="font-semibold text-card-foreground">{counts[s.key]}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  )
}
