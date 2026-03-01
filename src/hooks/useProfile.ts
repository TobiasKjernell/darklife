import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase/client'
import { getUserProfile, getUserProfiles, upsertUserProfile, type UserProfile } from '../supabase/supabaseCalls'
import type { ProfileFormData } from '../schemas/schemas'

export function useUserProfile(userId: string | null) {
  return useQuery({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      if (!userId) return null
      const { data, error } = await getUserProfile(userId)
      if (error) throw new Error(error.message)
      return data
    },
    enabled: !!userId,
  })
}

export function useUpdateUserProfile(userId: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: ProfileFormData) => {
      if (!userId) throw new Error('Not authenticated')
      const { error } = await upsertUserProfile(userId, {
        nickname: data.nickname,
        description: data.description,
        bar_name: data.barName,
        status: data.status,
      } as never)
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: (data) => {
      if (userId) {
        queryClient.setQueryData(['userProfile', userId], data)
      }
    },
  })
}

export function useUsersProfiles(userIds: string[]) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['usersProfiles', userIds],
    queryFn: async () => {
      if (!userIds.length) return []
      const { data, error } = await getUserProfiles(userIds)
      if (error) throw new Error(error.message)
      return data as UserProfile[]
    },
    enabled: userIds.length > 0,
  })

  // Subscribe to realtime profile changes for visible users
  useEffect(() => {
    if (!userIds.length) return

    const channel = supabase
      .channel('live-profiles')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'user_profiles' },
        (payload) => {
          const updated = payload.new as UserProfile
          if (!userIds.includes(updated.user_id)) return

          queryClient.setQueryData(
            ['usersProfiles', userIds],
            (prev: UserProfile[] | undefined) => {
              if (!prev) return prev
              return prev.map(p => p.user_id === updated.user_id ? updated : p)
            },
          )
        },
      )
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [userIds, queryClient])

  return query
}
