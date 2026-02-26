import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase/client'
import { getUserProfile, upsertUserProfile } from '../supabase/supabaseCalls'
import type { AuthFormData, ProfileFormData } from '../schemas/schemas'

export function useSession() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession()
      return data.session
    },
  })

  // onAuthStateChange is a subscription (not an API call) so useEffect is appropriate
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      queryClient.setQueryData(['session'], session)
    })
    return () => subscription.unsubscribe()
  }, [queryClient])

  return query
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: AuthFormData) => {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      if (error) throw new Error(error.message)
      return authData.session
    },
    onSuccess: (session) => {
      queryClient.setQueryData(['session'], session)
    },
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: AuthFormData) => {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      })
      if (error) throw new Error(error.message)
      return authData.session
    },
    onSuccess: (session) => {
      queryClient.setQueryData(['session'], session)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut()
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      queryClient.setQueryData(['session'], null)
    },
  })
}

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
