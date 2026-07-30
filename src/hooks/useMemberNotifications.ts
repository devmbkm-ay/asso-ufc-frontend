import { useQuery } from '@tanstack/react-query'
import { memberNotifications } from '@/lib/api'
import { useAuth } from '@/providers/AuthProvider'

export function useMemberNotifications() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['member-notifications'],
    queryFn: memberNotifications.mine,
    refetchInterval: 30_000,
    enabled: !!user,
  })
}
