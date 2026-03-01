import { X } from 'lucide-react'
import { useUsersProfiles } from '../hooks/useProfile'

interface Props {
  isOpen: boolean
  onClose: () => void
  userIds: string[]
}

const STATUS_COLORS = {
  on_the_way: 'bg-yellow-400',
  at_place: 'bg-green-400',
  lurking: 'bg-gray-400',
}

const STATUS_LABELS = {
  on_the_way: 'On the way',
  at_place: 'At place',
  lurking: 'Lurking',
}

const PeoplePanel = ({ isOpen, onClose, userIds }: Props) => {
  const { data: profiles, isLoading } = useUsersProfiles(userIds)

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="absolute inset-0 z-[1000]"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`absolute top-0 left-0 h-full w-80 bg-gray-900 border-r border-gray-800 z-[1001] flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="text-white font-semibold">Active users ({userIds.length})</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400 text-sm">Loading...</p>
            </div>
          ) : profiles && profiles.length > 0 ? (
            <div className="flex flex-col gap-2 p-4">
              {profiles.map((profile) => (
                <div
                  key={profile.user_id}
                  className="bg-gray-800 rounded-lg p-3 flex items-center justify-between hover:bg-gray-750 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {profile.nickname || 'Unknown'}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      {STATUS_LABELS[profile.status]}
                    </p>
                  </div>

                  <div className={`ml-3 w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLORS[profile.status]}`} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400 text-sm">No active users nearby</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default PeoplePanel
