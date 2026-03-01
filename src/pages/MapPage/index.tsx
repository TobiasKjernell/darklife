import type { LatLngBounds, LatLngExpression } from 'leaflet'
import { divIcon, latLng } from 'leaflet'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { getUsersInBounds, parseLocation, type UserProfile } from '../../supabase/supabaseCalls'
import { useSession } from '../../hooks/useAuth'
import { useUsersProfiles } from '../../hooks/useProfile'
import { useLocationTracking, STALE_THRESHOLD_MS } from '../../hooks/useLocationTracking'
import UserPanel from '../../components/UserPanel'
import PeoplePanel from '../../components/PeoplePanel'
import PeopleButton from '../../components/PeopleButton'
import SettingsButton from '../../components/SettingsButton'
import { supabase } from '../../supabase/client'
import { useQueryClient } from '@tanstack/react-query'

const DEFAULT_CENTER: LatLngExpression = [51.505, -0.09]

const selfIcon = divIcon({
  className: '',
  html: '<div style="width:20px;height:20px;border-radius:50%;background:#facc15;border:2px solid #a16207;"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

const getOtherUserIcon = (status: string) => {
  const statusColors: Record<string, { bg: string; border: string }> = {
    lurking: { bg: '#9ca3af', border: '#6b7280' },
    at_place: { bg: '#32cd32', border: '#228b22' },
    on_the_way: { bg: '#ffeb3b', border: '#f57f17' },
  }

  const colors = statusColors[status] ?? { bg: '#a855f7', border: '#6b21a8' }

  return divIcon({
    className: '',
    html: `<div style="width:15px;height:15px;border-radius:50%;background:${colors.bg};border:2px solid ${colors.border};"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  })
}

const RADIUS_KM = 5

const STATUS_LABELS: Record<string, string> = {
  on_the_way: 'On the way',
  at_place: 'At place',
  lurking: 'Lurking',
}

// ---------------------------------------------------------------------------
// Child: init recenter
// ---------------------------------------------------------------------------
function RecenterMap({ pos }: { pos: LatLngExpression }) {
  const map = useMap()
  const hasCentered = useRef(false)
  useEffect(() => {
    if (hasCentered.current) return
    hasCentered.current = true
    map.setView(pos)
  }, [pos, map])
  return null
}

// ---------------------------------------------------------------------------
// Child: fetches users in bounds on load + every map pan/zoom
// ---------------------------------------------------------------------------
type OtherUsers = Map<string, [number, number]>

function MapBoundsHandler({
  userId,
  currentPos,
  onUsersLoaded,
  boundsRef,
}: {
  userId: string
  currentPos: [number, number]
  onUsersLoaded: (users: OtherUsers) => void
  boundsRef: React.RefObject<LatLngBounds | null>
}) {
  const fetchInRadius = useCallback(async () => {
    const radiusBounds = latLng(currentPos).toBounds(RADIUS_KM * 2000)
    boundsRef.current = radiusBounds
    const { data } = await getUsersInBounds(
      radiusBounds.getSouth(),
      radiusBounds.getWest(),
      radiusBounds.getNorth(),
      radiusBounds.getEast(),
    )
    if (!data) return
    const now = Date.now()
    const users: OtherUsers = new Map()
    for (const row of data) {
      if (row.user_id === userId) continue
      if (now - new Date(row.updated_at).getTime() > STALE_THRESHOLD_MS) continue
      const pos = parseLocation(row.location)
      if (pos) users.set(row.user_id, pos)
    }
    onUsersLoaded(users)
  }, [userId, currentPos, onUsersLoaded, boundsRef])

  useEffect(() => { fetchInRadius() }, [fetchInRadius])

  return null
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
const MapPage = () => {
  const { data: session } = useSession()
  const userId = session?.user.id ?? null
  const queryClient = useQueryClient()

  const { currentPos, otherUsers, boundsRef, setOtherUsers } = useLocationTracking(userId)
  const otherUserIds = [...otherUsers.keys()]

  const { data: profiles } = useUsersProfiles(otherUserIds)
  const profilesMap = new Map(profiles?.map(p => [p.user_id, p]) ?? [])

  const [panelOpen, setPanelOpen] = useState(false)
  const [peopleOpen, setPeopleOpen] = useState(false)

  useEffect(() => {

    const channel = supabase
      .channel(`live-profiles`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'user_profiles' },
        (payload) => {
          const updated = payload.new as UserProfile

          queryClient.setQueryData(
            ['usersProfiles', otherUserIds],
            (prev: UserProfile[] | undefined) => {
              if (!prev) return prev
              return prev.map(p => p.user_id === updated.user_id ? updated : p)
            },
          )
          queryClient.invalidateQueries(
            { queryKey: ['usersProfile'] }
          )
        },
      )
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [])


  // ------------------------------------------------------------------
  // Spinner while waiting for first geolocation fix
  // ------------------------------------------------------------------
  if (!currentPos) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-full w-full relative overflow-hidden">
      {/* Top-center button container */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-1000 flex items-center gap-3">
        <PeopleButton onClick={() => setPeopleOpen(!peopleOpen)} userCount={otherUserIds.length} isOpen={peopleOpen} />
        <SettingsButton onClick={() => setPanelOpen(!panelOpen)} isOpen={panelOpen} />
      </div>

      <UserPanel isOpen={panelOpen} onClose={() => setPanelOpen(false)} />
      <PeoplePanel isOpen={peopleOpen} onClose={() => setPeopleOpen(false)} userIds={otherUserIds} />

      <MapContainer center={DEFAULT_CENTER} zoom={12} scrollWheelZoom attributionControl={false} className="h-full w-full">
        <TileLayer
          attribution=''
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          detectRetina
        />

        <RecenterMap pos={currentPos} />

        {/* Fetches users in viewport on load and after every pan/zoom */}
        {userId && (
          <MapBoundsHandler
            userId={userId}
            currentPos={currentPos}
            onUsersLoaded={setOtherUsers}
            boundsRef={boundsRef}
          />
        )}

        {/* Own marker + radius circle */}
        <Marker position={currentPos} icon={selfIcon}>
          <Popup>You are here.</Popup>
        </Marker>
        <Circle
          center={currentPos}
          radius={RADIUS_KM * 1000}
          pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.05 }}
        />

        {/* Other users' markers */}
        {[...otherUsers.entries()].map(([id, pos]) => {
          const profile = profilesMap.get(id)
          return (
            <Marker key={id} position={pos} icon={getOtherUserIcon(profile?.status ?? 'lurking')}>
              <Popup>
                <div className="w-48">
                  <p className="font-semibold text-sm">{profile?.nickname ?? 'Unknown'}</p>
                  {profile?.status && (
                    <p className="text-xs text-gray-600">{STATUS_LABELS[profile.status]}</p>
                  )}
                  {profile?.description && (
                    <p className="text-xs mt-2">{profile.description}</p>
                  )}
                  {profile?.bar_name && (
                    <p className="text-xs text-gray-600 mt-1">📍 {profile.bar_name}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}

export default MapPage
