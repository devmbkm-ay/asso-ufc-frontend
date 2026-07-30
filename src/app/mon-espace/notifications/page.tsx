'use client'

import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { memberNotifications } from '@/lib/api'
import { useMemberNotifications } from '@/hooks/useMemberNotifications'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCheck, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MemberNotification } from '@/lib/types'

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function NotificationsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data, isLoading } = useMemberNotifications()

  const { mutate: markRead } = useMutation({
    mutationFn: memberNotifications.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['member-notifications'] }),
  })

  const { mutate: markAllRead, isPending: markingAll } = useMutation({
    mutationFn: memberNotifications.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['member-notifications'] }),
  })

  const unreadCount = data?.filter(n => !n.read).length ?? 0

  function handleClick(n: MemberNotification) {
    if (!n.read) markRead(n.id)
    if (n.link) router.push(n.link)
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? '—' : `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            size="sm"
            variant="outline"
            disabled={markingAll}
            onClick={() => markAllRead()}
            className="gap-1.5 border-border text-muted-foreground bg-transparent"
          >
            <CheckCheck size={14} />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      <div className="bg-card rounded-xl border border-primary/15 shadow-sm overflow-hidden">
        {isLoading && (
          <div className="space-y-3 px-5 py-5">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}

        {!isLoading && data?.length === 0 && (
          <div className="px-5 py-5">
            <EmptyState
              title="Aucune notification"
              description="Les mises à jour concernant vos désignations et signalements apparaîtront ici."
              icon={<Bell className="size-5" />}
            />
          </div>
        )}

        {!isLoading && data && data.length > 0 && (
          <ul className="divide-y divide-border">
            {data.map(n => (
              <li key={n.id}>
                <button
                  onClick={() => handleClick(n)}
                  className={cn(
                    'w-full text-left px-5 py-3.5 flex items-start gap-3 hover:bg-muted transition-colors',
                    !n.read && 'bg-primary/5',
                  )}
                >
                  {!n.read && (
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />
                  )}
                  <div className={cn('min-w-0 flex-1', n.read && 'pl-5')}>
                    <p className={cn('text-sm text-foreground', !n.read && 'font-medium')}>
                      {n.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{fmtDateTime(n.created_at)}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
