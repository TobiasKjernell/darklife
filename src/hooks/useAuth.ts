import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase/client'
import type { AuthFormData } from '../schemas/schemas'

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
