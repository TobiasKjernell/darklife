import { Navigate, Outlet } from 'react-router'
import { useSession } from '../hooks/useAuth'

const ProtectedRoute = () => {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-yellow-400 border-t-transparent animate-spin" />
      </div>
    )
  }

  const isAuthenticated = !!session && !session.user.is_anonymous

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

export default ProtectedRoute
