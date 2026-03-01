import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
  const userIdsRef = useRef(userIds)
  // Keep ref in sync with current userIds
  useEffect(() => {
    userIdsRef.current = userIds
  }, [userIds])

  const query = useQuery({
    queryKey: ['usersProfiles', userIds],
    staleTime:0,
    queryFn: async () => {
      if (!userIds.length) return []
      const { data, error } = await getUserProfiles(userIds)
      if (error) throw new Error(error.message)
        console.log(data);
      return data as UserProfile[]
    },
    enabled: userIds.length > 0,
  })
  
  return query
}
