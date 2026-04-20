import { useNavigate } from 'react-router'
import { Beer, MapPin, Users } from 'lucide-react'

const WelcomePage = () => {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(./beerbackground.webp)' }} />
            <div className="absolute inset-0 bg-gray-950/75 backdrop-blur-sm" />

            <div className="relative z-10 flex flex-col items-center gap-12 max-w-lg w-full text-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-400/15 border border-yellow-400/30">
                        <Beer size={32} className="text-yellow-400" />
                    </div>
                    <div>
                        <h1 className="text-5xl font-bold tracking-tight text-white">Grab a Beer</h1>
                        <p className="text-yellow-400 font-medium mt-1 text-sm tracking-wide uppercase">Find your next afterwork</p>
                    </div>
                </div>

                <p className="text-gray-300 text-lg leading-relaxed">
                    Had a long day? See who's nearby and up for a drink right now — no planning, no group chats. Just open the map and go.
                </p>

                <div className="flex gap-8 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-yellow-400" />
                        <span>Live map</span>
                    </div>
                    <div className="w-px bg-gray-700" />
                    <div className="flex items-center gap-2">
                        <Users size={16} className="text-yellow-400" />
                        <span>Real people nearby</span>
                    </div>
                    <div className="w-px bg-gray-700" />
                    <div className="flex items-center gap-2">
                        <Beer size={16} className="text-yellow-400" />
                        <span>No planning needed</span>
                    </div>
                </div>

                <button
                    onClick={() => navigate('/map')}
                    className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-gray-950 font-semibold px-10 py-4 rounded-2xl text-lg transition-all cursor-pointer shadow-lg shadow-yellow-400/20"
                >
                    <MapPin size={20} />
                    Open the map
                </button>

                <p className="text-gray-400 text-xs">
                    By continuing you agree to share your location while the app is open.
                </p>
            </div>
        </div>
    )
}

export default WelcomePage
