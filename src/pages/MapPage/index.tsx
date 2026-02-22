import type { LatLngBounds, LatLngExpression } from 'leaflet'
import { divIcon, latLng } from 'leaflet'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { supabase } from '../../supabase/client'
import { deleteLocation, getUsersInBounds, parseLocation, upsertLocation } from '../../supabase/supabaseCalls'

const DEFAULT_CENTER: LatLngExpression = [51.505, -0.09]

const selfIcon = divIcon({
  className: '',
  html: '<div style="width:20px;height:20px;border-radius:50%;background:#facc15;border:2px solid #a16207;"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

const otherIcon = divIcon({
  className: '',
  html: '<div style="width:15px;height:15px;border-radius:50%;background:#a855f7;border:2px solid #6b21a8;"></div>',
  iconSize: [10, 10],
  iconAnchor: [5, 5],
})
const POLL_INTERVAL_MS = 10_000
const MIN_DISTANCE_METERS = 10
const RADIUS_KM = 5
const STALE_THRESHOLD_MS = 30_000 // users not updated in 30s are treated as gone

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
    const radiusBounds = latLng(currentPos).toBounds(RADIUS_KM * 1000)
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
  const [currentPos, setCurrentPos] = useState<[number, number] | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [otherUsers, setOtherUsers] = useState<OtherUsers>(new Map())

  const lastPosRef = useRef<[number, number] | null>(null)
  const lastUpdateTimeRef = useRef<number>(0)
  const boundsRef = useRef<LatLngBounds | null>(null)

  // ------------------------------------------------------------------
  // 1. Anonymous auth — gives us a stable user_id linked to auth.users
  // ------------------------------------------------------------------
  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) return setUserId(session.user.id)
      const { data } = await supabase.auth.signInAnonymously()
      if (data.user) setUserId(data.user.id)
    }
    init()
  }, [])

  // ------------------------------------------------------------------
  // 2. Initial geolocation — show map ASAP, independent of auth
  // ------------------------------------------------------------------
  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude]
      setCurrentPos(coords)
      lastPosRef.current = coords   
        console.log(coords); 
    })
  }, [])

  // ------------------------------------------------------------------
  // 3. Upload interval — starts once userId is ready.
  //    Uploads only when moved >10 m OR >10 s since last upload.
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!userId) return

    const upload = (coords: [number, number]) => {
      lastPosRef.current = coords
      lastUpdateTimeRef.current = Date.now()
      upsertLocation(userId, coords[0], coords[1])
    }

    // Upload the position we already have (if geolocation resolved first)
    if (lastPosRef.current) upload(lastPosRef.current)
      
    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition((pos) => {
        const newCoords: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        const distanceMoved = lastPosRef.current
          ? latLng(lastPosRef.current).distanceTo(latLng(newCoords))
          : Infinity
        const timeSinceUpdate = Date.now() - lastUpdateTimeRef.current

        setCurrentPos(newCoords)

        if (distanceMoved > MIN_DISTANCE_METERS || timeSinceUpdate > POLL_INTERVAL_MS) {
          upload(newCoords)
        }
      })
    }, POLL_INTERVAL_MS)

    const remove = () => deleteLocation(userId)

    // Desktop: fires on tab close / navigation
    window.addEventListener('beforeunload', remove)
    // Mobile (iOS/Android): fires when app is backgrounded or closed
    window.addEventListener('pagehide', remove)
    // Visibility: delete when hidden, re-upload immediately when visible again
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        remove()
      } else if (document.visibilityState === 'visible' && lastPosRef.current) {
        upsertLocation(userId, lastPosRef.current[0], lastPosRef.current[1])
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearInterval(interval)
      window.removeEventListener('beforeunload', remove)
      window.removeEventListener('pagehide', remove)
      document.removeEventListener('visibilitychange', handleVisibility)
      remove()
    }
  }, [userId])

  // ------------------------------------------------------------------
  // 4. Realtime subscription — one channel, client-side bounds filtering
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!userId) return

    const handleDbEvent = (payload: { eventType: string; new: { user_id: string; location: unknown }; old: { user_id?: string } }) => {
      if (payload.eventType === 'DELETE') {
        const id = payload.old.user_id
        if (id) setOtherUsers(prev => { const m = new Map(prev); m.delete(id); return m })
        return
      }

      const row = payload.new
      if (row.user_id === userId) return

      const pos = parseLocation(row.location)
      if (!pos) return

      const bounds = boundsRef.current
      const inside = !bounds || (
        pos[0] >= bounds.getSouth() && pos[0] <= bounds.getNorth() &&
        pos[1] >= bounds.getWest() && pos[1] <= bounds.getEast()
      )

      setOtherUsers(prev => {
        const m = new Map(prev)
        if (inside) m.set(row.user_id, pos)
        else m.delete(row.user_id)
        return m
      })
    }

    const channel = supabase
      .channel('live-locations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_locations' }, handleDbEvent as never)
      // Presence: fires reliably when any client disconnects (mobile included)
      .on('presence', { event: 'leave' }, ({ leftPresences }: { leftPresences: Array<{ user_id: string }> }) => {
        leftPresences.forEach(p => {
          setOtherUsers(prev => { const m = new Map(prev); m.delete(p.user_id); return m })
        })
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          // Announce own presence — Supabase removes it automatically on disconnect
          await channel.track({ user_id: userId })
        }
      })

    return () => { channel.unsubscribe() }
  }, [userId])

  // ------------------------------------------------------------------
  // Spinner while waiting for first geolocation fix
  // ------------------------------------------------------------------
  if (!currentPos) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-screen w-screen">
      <MapContainer center={DEFAULT_CENTER} zoom={13} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
        {[...otherUsers.entries()].map(([id, pos]) => (
          <Marker key={id} position={pos} icon={otherIcon}>
            <Popup>User {id.slice(0, 8)}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

export default MapPage
