import type { LatLngBounds } from 'leaflet'
import { latLng } from 'leaflet'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../supabase/client'
import { deleteLocation, parseLocation, upsertLocation } from '../supabase/supabaseCalls'

const POLL_INTERVAL_MS = 10_000
const MIN_DISTANCE_METERS = 10
export const STALE_THRESHOLD_MS = 30_000

type OtherUsers = Map<string, [number, number]>

export function useLocationTracking(userId: string | null) {
  const [currentPos, setCurrentPos] = useState<[number, number] | null>(null)
  const [otherUsers, setOtherUsers] = useState<OtherUsers>(new Map())

  const lastPosRef = useRef<[number, number] | null>(null)
  const lastUpdateTimeRef = useRef<number>(0)
  const boundsRef = useRef<LatLngBounds | null>(null)

  // Initial geolocation fix on mount
  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude]
      setCurrentPos(coords)
      lastPosRef.current = coords
    }, (e) => console.log(e), { enableHighAccuracy: true, maximumAge: 0 })
  }, [])

  // Polling + upload + listeners + realtime subscription
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

    // Realtime: location updates + presence disconnect detection
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
      .on('presence', { event: 'leave' }, ({ leftPresences }: { leftPresences: Array<{ user_id: string }> }) => {
        leftPresences.forEach(p => {
          setOtherUsers(prev => { const m = new Map(prev); m.delete(p.user_id); return m })
        })
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: userId })
        }
      })

    return () => {
      clearInterval(interval)
      window.removeEventListener('beforeunload', remove)
      window.removeEventListener('pagehide', remove)
      document.removeEventListener('visibilitychange', handleVisibility)
      remove()
      channel.unsubscribe()
    }
  }, [])

  return { currentPos, otherUsers, boundsRef, setOtherUsers }
}
