import { Settings } from 'lucide-react'

interface Props {
  onClick: () => void
  isOpen: boolean
}

const SettingsButton = ({ onClick, isOpen }: Props) => {
  return (
    <button
      onClick={onClick}
      className={`absolute top-4 right-4 z-1000 bg-gray-900 hover:bg-gray-800 text-white p-3 rounded-full shadow-lg transition-colors cursor-pointer ${isOpen ? 'hidden' : ''}`}
    >
      <Settings size={22} />
    </button>
  )
}

export default SettingsButton
