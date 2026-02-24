import { useNavigate, useLocation, Outlet } from 'react-router'
import { LogOut, ArrowLeft } from 'lucide-react'
import { useLogout, useSession } from '../hooks/useAuth'

const AppLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const logout = useLogout()
  const { data: session } = useSession()

  const isLoggedIn = !!session && !session.user.is_anonymous

  const handleLogout = () => {
    navigate('/', { replace: true })
    logout.mutate()
  }

  const isHome = location.pathname === '/'

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      {isLoggedIn && (
        <nav className="flex items-center justify-between px-6 h-14 bg-gray-900 border-b border-gray-800 shrink-0">
          {isHome ? (
            <span className="text-white font-semibold tracking-wide">Grab a beer!</span>
          ) : (
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm cursor-pointer"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          )}
          <button
            onClick={handleLogout}
            disabled={logout.isPending}
            className="flex items-center gap-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm cursor-pointer"
          >
            <LogOut size={16} />
            Log out
          </button>
        </nav>
      )}

      <main className="flex-1 min-h-0">
        <Outlet />
      </main>
    </div>
  )
}

export default AppLayout
