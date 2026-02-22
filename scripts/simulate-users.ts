/**
 * Fake user simulator for local development.
 *
 * Setup:
 *   1. Add your service role key to .env.local:
 *        SUPABASE_SERVICE_ROLE_KEY=eyJ...
 *      (find it in Supabase dashboard → Project Settings → API → service_role)
 *
 *   2. Run:
 *        npx tsx --env-file=.env.local scripts/simulate-users.ts
 *
 * Ctrl+C cleans up all created users and their locations.
 */

import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Config — adjust to test around a specific area
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const NUM_USERS = 4
const CENTER_LAT = 59.26439208941466 // change to your area
const CENTER_LNG = 18.08178814254219
const SPREAD_DEG = 0.01     // initial scatter radius (~1 km)
const STEP_DEG = 0.002     // movement per tick (~30 m)
const TICK_MS = 2_000

// ---------------------------------------------------------------------------
// Client (service role bypasses RLS; FK still enforced — we create real users)
// ---------------------------------------------------------------------------
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

type FakeUser = { id: string; lat: number; lng: number }

function jitter() {
  return (Math.random() - 0.5) * 2 * STEP_DEG
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.')
    process.exit(1)
  }

  // Create fake auth users so the FK constraint on user_locations is satisfied
  console.log(`Creating ${NUM_USERS} fake users...`)
  const users: FakeUser[] = []

  for (let i = 0; i < NUM_USERS; i++) {
    const tag = `${i}-${Date.now()}`
    const { data, error } = await supabase.auth.admin.createUser({
      email: `fake-${tag}@simulate.test`,
      password: 'simulate',
      email_confirm: true,
    })
    if (error || !data.user) {
      console.error(`Failed to create user ${i}:`, error?.message)
      process.exit(1)
    }
    users.push({
      id: data.user.id,
      lat: CENTER_LAT + (Math.random() - 0.5) * 2 * SPREAD_DEG,
      lng: CENTER_LNG + (Math.random() - 0.5) * 2 * SPREAD_DEG,
    })
    console.log(`  user ${i}: ${data.user.id}`)
  }

  // Initial insert
  for (const u of users) {
    await supabase.from('user_locations').upsert({
      user_id: u.id,
      location: `POINT(${u.lng} ${u.lat})`,
      updated_at: new Date().toISOString(),
    })
  }

  console.log(`\nMoving ${NUM_USERS} users every ${TICK_MS}ms — Ctrl+C to stop.\n`)

  const interval = setInterval(async () => {
    for (const u of users) {
      u.lat += jitter()
      u.lng += jitter()
      await supabase.from('user_locations').upsert({
        user_id: u.id,
        location: `POINT(${u.lng} ${u.lat})`,
        updated_at: new Date().toISOString(),
      })
    }
    console.log(`[${new Date().toLocaleTimeString()}] positions updated`)
  }, TICK_MS)

  const cleanup = async () => {
    clearInterval(interval)
    console.log('\nCleaning up...')
    for (const u of users) {
      await supabase.from('user_locations').delete().eq('user_id', u.id)
      await supabase.auth.admin.deleteUser(u.id)
    }
    console.log('Done.')
    process.exit(0)
  }

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)
}

main()
