import { z } from 'zod'

export const authSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export type AuthFormData = z.infer<typeof authSchema>

export const profileSchema = z.object({
  nickname: z.string().min(1, 'Nickname is required'),
  description: z.string().optional(),
  barName: z.string().optional(),
  status: z.enum(['on_the_way', 'at_place', 'lurking']),
})

export type ProfileFormData = z.infer<typeof profileSchema>
