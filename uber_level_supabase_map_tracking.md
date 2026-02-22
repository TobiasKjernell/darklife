# Uber-Level Map Tracking Architecture

**Supabase + PostGIS + Realtime + React**

------------------------------------------------------------------------

## Overview

This architecture is designed for scalable real-time user tracking
(similar to Uber, Lyft, or delivery applications).

### Core Components

-   Supabase Postgres (source of truth)
-   PostGIS (spatial indexing & geo queries)
-   Supabase Realtime (WAL-based live streaming)
-   React client-side filtering
-   Optional Redis (for very high scale)

------------------------------------------------------------------------

# Step 1 --- Database Setup

## Enable PostGIS

``` sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

## Live Location Table (1 row per user)

``` sql
CREATE TABLE user_locations (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  heading FLOAT,
  speed FLOAT
);
```

## Spatial Index (CRITICAL)

``` sql
CREATE INDEX user_locations_geo_idx
ON user_locations
USING GIST (location);
```

------------------------------------------------------------------------

# Step 2 --- Fetch Users Inside Map Bounds

## RPC Function for Bounding Box Query

``` sql
CREATE OR REPLACE FUNCTION users_in_bounds(
  min_lat FLOAT,
  min_lng FLOAT,
  max_lat FLOAT,
  max_lng FLOAT
)
RETURNS SETOF user_locations
LANGUAGE SQL
AS $$
  SELECT *
  FROM user_locations
  WHERE location && ST_MakeEnvelope(
    min_lng, min_lat,
    max_lng, max_lat,
    4326
  );
$$;
```

### When to call this:

-   On map load
-   On map pan
-   On map zoom

This prevents full-table scans.

------------------------------------------------------------------------

# Step 3 --- Client Location Update Logic

Do NOT blindly update every 5 seconds.

Only update when:

-   User moved more than 10 meters\
    **OR**
-   10 seconds have elapsed

### Example:

``` js
if (distanceMoved > 10 || timeSinceLastUpdate > 10000) {
  supabase.from('user_locations').upsert({
    user_id: user.id,
    location: `POINT(${lng} ${lat})`,
    updated_at: new Date()
  })
}
```

This dramatically reduces database writes.

------------------------------------------------------------------------

# Step 4 --- Realtime Subscription (One Channel Per Client)

Use ONE subscription per connected client.

``` js
supabase
  .channel('live-locations')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'user_locations'
    },
    handleRealtimeUpdate
  )
  .subscribe()
```

### Do NOT:

-   Create a channel per region
-   Create a channel per user
-   Re-subscribe on every map pan

------------------------------------------------------------------------

# Step 5 --- Client-Side Filtering Logic

Maintain:

-   `currentBounds`
-   `markers` (Map of user_id → marker)

## Bounds Check

``` js
function isInsideBounds(lat, lng, bounds) {
  return (
    lat >= bounds.minLat &&
    lat <= bounds.maxLat &&
    lng >= bounds.minLng &&
    lng <= bounds.maxLng
  )
}
```

## Realtime Handler

``` js
function handleRealtimeUpdate(payload) {
  const row = payload.new
  const [lng, lat] = row.location.coordinates
  const userId = row.user_id

  const inside = isInsideBounds(lat, lng, currentBounds)

  if (inside) {
    if (markers.has(userId)) {
      updateMarker(userId, lat, lng)
    } else {
      createMarker(userId, lat, lng)
    }
  } else {
    removeMarker(userId)
  }
}
```

This avoids expensive spatial DB filtering per subscriber.

------------------------------------------------------------------------

# Optional Cleanup Strategy

Instead of frequent deletes, filter active users:

``` sql
WHERE updated_at > now() - interval '30 seconds'
```

Optional periodic cleanup:

``` sql
CREATE OR REPLACE FUNCTION remove_inactive_users()
RETURNS VOID
LANGUAGE SQL
AS $$
  DELETE FROM user_locations
  WHERE updated_at < now() - interval '5 minutes';
$$;
```

------------------------------------------------------------------------

# Scaling Strategy

## Under 5k Active Users

-   PostGIS + Realtime is sufficient

## 5k--20k Active Users

-   Throttle client updates
-   Keep live table small
-   Separate history table

## 20k+ Users

-   Add Redis GEO indexing
-   Consider tile-based broadcasting
-   Possibly introduce geo-routing microservice

------------------------------------------------------------------------

# Key Performance Rules

1.  Always use GiST index on geography column\
2.  Never run full-table spatial scans\
3.  Use ONE realtime subscription per client\
4.  Filter spatially in client\
5.  Keep live table small (1 row per user)\
6.  Separate history table if needed

------------------------------------------------------------------------

**End of Document**
