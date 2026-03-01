import { Users } from 'lucide-react'

interface Props {
  onClick: () => void
  userCount: number
  isOpen: boolean
}

const PeopleButton = ({ onClick, userCount, isOpen }: Props) => {
  return (
    <button
      onClick={onClick}
      className={`relative p-3 rounded-full shadow-lg transition-colors cursor-pointer ${
        isOpen
          ? 'bg-yellow-400 hover:bg-yellow-300 text-gray-950'
          : 'bg-gray-900 hover:bg-gray-800 text-white'
      }`}
    >
      <Users size={22} />
      {userCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
          {userCount}
        </span>
      )}
    </button>
  )
}

export default PeopleButton
