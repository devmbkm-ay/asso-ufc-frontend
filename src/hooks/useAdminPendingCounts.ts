import { useQuery } from '@tanstack/react-query'
import { adminOverview } from '@/lib/api'
import { useAuth } from '@/providers/AuthProvider'

export function useAdminPendingCounts() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['admin-pending-counts'],
    queryFn: adminOverview.pendingCounts,
    refetchInterval: 30_000,
    enabled: !!user,
  })
}
