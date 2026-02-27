import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router'
import { authSchema, type AuthFormData } from '../../schemas/schemas'
import { useLogin, useRegister } from '../../hooks/useAuth'

const LoginPage = () => {
  const [isRegister, setIsRegister] = useState(false)
  const navigate = useNavigate()

  const login = useLogin()
  const register_ = useRegister()
  const mutation = isRegister ? register_ : login

  const { register, handleSubmit, formState: { errors }, reset } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
  })

  const onSubmit = (data: AuthFormData) => {
    mutation.mutate(data, {
      onSuccess: () => navigate('/'),
    })
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-gray-900 rounded-2xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          {isRegister ? 'Create account' : 'Sign in'}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-400" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 placeholder-gray-600"
              placeholder="you@example.com"
              {...register('email')}
            />
            {errors.email && (
              <span className="text-red-400 text-xs">{errors.email.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-400" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              className="bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 placeholder-gray-600"
              placeholder="••••••••"
              {...register('password')}
            />
            {errors.password && (
              <span className="text-red-400 text-xs">{errors.password.message}</span>
            )}
          </div>

          {mutation.error && (
            <p className="text-red-400 text-sm text-center">{mutation.error.message}</p>
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="mt-2 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-950 font-semibold rounded-lg py-2.5 transition-colors cursor-pointer"
          >
            {mutation.isPending ? 'Loading…' : isRegister ? 'Register' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-gray-500 text-sm mt-6">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister)
              mutation.reset()
              reset()
            }}
            className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors cursor-pointer"
          >
            {isRegister ? 'Sign in' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
