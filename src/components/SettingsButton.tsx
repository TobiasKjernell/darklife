import { Settings } from 'lucide-react'

interface Props {
  onClick: () => void
  isOpen: boolean
}

const SettingsButton = ({ onClick, isOpen }: Props) => {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-full shadow-lg transition-colors cursor-pointer ${
        isOpen
          ? 'bg-yellow-400 hover:bg-yellow-300 text-gray-950'
          : 'bg-gray-900 hover:bg-gray-800 text-white'
      }`}
    >
      <Settings size={22} />
    </button>
  )
}

export default SettingsButton
