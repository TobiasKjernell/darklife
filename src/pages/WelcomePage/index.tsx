import { useNavigate } from 'react-router'
import { Beer } from 'lucide-react'

const WelcomePage = () => {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-6 gap-10">

            <div className="text-center">
                <h1 className="text-5xl font-bold tracking-tight mb-3">Find a beer friend</h1>
                <p className="text-gray-400 text-lg">See who's nearby and up for a drink right now.</p>
            </div>

            <div className="max-w-md text-center text-gray-400 leading-relaxed">
                <p>
                    Had a long day? Looking for someone to wind down with over a cold beer?
                    <span className='italic'> Grab a beer!</span> shows you people in your area who are up for an afterwork, a casual
                    chat, or just someone to sit with and relax. No planning needed — just open
                    the map, see who's around, and go.
                </p>
            </div>

            <button
                onClick={() => navigate('/map')}
                className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-gray-950 font-semibold px-8 py-3 rounded-xl text-lg transition-colors cursor-pointer"
            >
                <Beer size={22} />
                Visit map
            </button>

        </div>
    )
}

export default WelcomePage
