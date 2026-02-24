import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { profileSchema, type ProfileFormData } from '../schemas/schemas'

const STATUS_OPTIONS: { value: ProfileFormData['status']; label: string }[] = [
  { value: 'on_the_way', label: 'On the way' },
  { value: 'at_place', label: 'At place' },
  { value: 'lurking', label: 'Lurking' },
]

interface Props {
  isOpen: boolean
  onClose: () => void
}

const UserPanel = ({ isOpen, onClose }: Props) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { status: 'lurking' },
  })

  const onSubmit = (data: ProfileFormData) => {
    console.log(data)
    onClose()
  }

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
        className={`absolute top-0 right-0 h-full w-80 bg-gray-900 border-l border-gray-800 z-[1001] flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="text-white font-semibold">Your profile</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 p-5 flex-1 overflow-y-auto">

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-400">Nickname</label>
            <input
              type="text"
              placeholder="e.g. BeerLover42"
              className="bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 placeholder-gray-600 text-sm"
              {...register('nickname')}
            />
            {errors.nickname && (
              <span className="text-red-400 text-xs">{errors.nickname.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-400">Description</label>
            <textarea
              rows={3}
              placeholder="Tell others a bit about yourself..."
              className="bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 placeholder-gray-600 text-sm resize-none"
              {...register('description')}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-400">Bar / venue name</label>
            <input
              type="text"
              placeholder="e.g. The Crown"
              className="bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-yellow-400 placeholder-gray-600 text-sm"
              {...register('barName')}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-400">Status</label>
            <div className="flex flex-col gap-2">
              {STATUS_OPTIONS.map(({ value, label }) => (
                <label
                  key={value}
                  className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-2.5 cursor-pointer hover:bg-gray-750 transition-colors"
                >
                  <input
                    type="radio"
                    value={value}
                    className="accent-yellow-400"
                    {...register('status')}
                  />
                  <span className="text-white text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="mt-auto bg-yellow-400 hover:bg-yellow-300 text-gray-950 font-semibold rounded-lg py-2.5 text-sm transition-colors cursor-pointer"
          >
            Save
          </button>

        </form>
      </div>
    </>
  )
}

export default UserPanel
