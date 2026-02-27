import { Users } from 'lucide-react'

interface Props {
  onClick: () => void
  userCount: number
  isOpen: boolean
}

const PeopleButton = ({ onClick, userCount, isOpen }: Props) => {
  return (
    <div className={`absolute top-20 right-4 z-1000 cursor-pointer ${isOpen ? 'hidden' : ''}`}>
      <button
        onClick={onClick}
        className="relative bg-gray-900 hover:bg-gray-800 text-white p-3 rounded-full shadow-lg transition-colors"
      >
        <Users size={22} />
        {userCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {userCount}
          </span>
        )}
      </button>
    </div>
  )
}

export default PeopleButton
