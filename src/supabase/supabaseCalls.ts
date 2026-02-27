import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { supabase } from './client'

export type UserLocation = {
  user_id: string
  location: unknown
  updated_at: string
  heading: number | null
  speed: number | null
}

/**
 * Parses a PostGIS EWKB hex string (sent by Supabase Realtime) into [lat, lng].
 * Also handles GeoJSON objects (sent by the REST API).
 */
function parseWKBPoint(hex: string): [number, number] | null {
  try {
    const bytes = new Uint8Array(hex.match(/.{2}/g)!.map(b => parseInt(b, 16)))
    const view = new DataView(bytes.buffer)
    const isLE = view.getUint8(0) === 1
    const geomType = view.getUint32(1, isLE)
    let offset = 5
    if (geomType & 0x20000000) offset += 4 // skip SRID bytes if present
    const lng = view.getFloat64(offset, isLE)
    const lat = view.getFloat64(offset + 8, isLE)
    return [lat, lng]
  } catch {
    return null
  }
}

/** Parses a location value from either REST (GeoJSON object) or Realtime (WKB hex string). */
export function parseLocation(location: unknown): [number, number] | null {
  if (!location) return null

  if (typeof location === 'string') return parseWKBPoint(location)

  if (typeof location === 'object') {
    const g = location as { type?: string; coordinates?: [number, number] }
    if (g.type === 'Point' && Array.isArray(g.coordinates)) {
      const [lng, lat] = g.coordinates
      return [lat, lng]
    }
  }

  return null
}

/** Remove the current user's row — called on tab close to mark them offline immediately. */
export function deleteLocation(userId: string) {
  return supabase.from('user_locations').delete().eq('user_id', userId)
}

/** Upsert the current user's location. Uses WKT format: POINT(lng lat). */
export async function upsertLocation(userId: string, lat: number, lng: number) {
  return supabase.from('user_locations').upsert({
    user_id: userId,
    location: `POINT(${lng} ${lat})`,
    updated_at: new Date().toISOString(),
  })
}

/** Fetch all users whose location falls inside the given map bounding box. */
export async function getUsersInBounds(
  minLat: number,
  minLng: number,
  maxLat: number,
  maxLng: number,
) {
  return supabase.rpc('users_in_bounds', { min_lat: minLat, min_lng: minLng, max_lat: maxLat, max_lng: maxLng })
}

/** Open a single Realtime channel that streams all changes to user_locations. */
export function subscribeToLocations(
  handler: (payload: RealtimePostgresChangesPayload<UserLocation>) => void,
): RealtimeChannel {
  return supabase
    .channel('live-locations')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'user_locations' }, handler as never)
    .subscribe()
}

export type UserProfile = {
  user_id: string
  nickname: string
  description?: string
  bar_name?: string
  status: 'on_the_way' | 'at_place' | 'lurking'
  updated_at: string
  created_at: string
}

/** Fetch the current user's profile. */
export async function getUserProfile(userId: string) {
  return supabase.from('user_profiles' as never).select('*').eq('user_id', userId).single()
}

/** Fetch multiple user profiles by user IDs. */
export async function getUserProfiles(userIds: string[]) {
  return supabase.from('user_profiles' as never).select('user_id, nickname, status').in('user_id', userIds)
}

/** Upsert the current user's profile. */
export async function upsertUserProfile(
  userId: string,
  data: Omit<UserProfile, 'user_id' | 'updated_at' | 'created_at'>,
) {
  return supabase.from('user_profiles' as never).upsert(
    {
      user_id: userId,
      ...data,
      updated_at: new Date().toISOString(),
    } as never,
  ).select()
}
