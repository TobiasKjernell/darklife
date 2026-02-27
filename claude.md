## Database
 - Supabase for backend and authentication
 - Tables: user_locations (with PostGIS POINT), user_profiles
 - See uber_level_supabase_map_tracking.md for detailed schema and RLS policies

## Framework & Libraries
 - React with React-Router v7 declaratives routing
 - TanStack Query (React Query) for data fetching and caching
 - useMutation for mutations
 - react-hook-form for form handling
 - ZOD for schema validation
 - Supabase Auth (email/password)
 - Leaflet + react-leaflet v5 for maps
 - Tailwind CSS for styling
 - Lucide React for icons

## Project Structure
 - src/
   - pages/ - Page components (LoginPage, WelcomePage, MapPage)
   - components/ - Reusable components (AppLayout, ProtectedRoute, UserPanel, etc.)
   - hooks/ - Custom hooks (useAuth, useSession, useLogin, useRegister, useLogout, useUserProfile, useUpdateUserProfile)
   - schemas/ - ZOD validation schemas (all in schemas.ts)
   - supabase/ - Supabase client and database calls

## Code Standards
 - Avoid useEffect for Supabase API calls - use TanStack Query hooks instead
 - Create custom hooks in /hooks folder for any reusable logic
 - All ZOD schemas go in /schemas/schemas.ts
 - Use arrow functions when possible
 - Use enums for status values (on_the_way, at_place, lurking)
 - Prefer interfaces over types for object shapes
 - Keep code readable with spacing around error handling
 - Refetch queries when opening panels/modals to ensure fresh data
 - If there's html blockets in page, make a component and make sure page files are clean.

## Key Features
 - Geolocation tracking: 10-second polling, 20m movement threshold
 - Real-time location updates via Supabase Realtime subscriptions
 - Presence detection: Users auto-remove on tab close (deleteLocation on beforeunload)
 - User profiles with editable fields (nickname, description, bar_name, status)
 - Protected routes - only authenticated, non-anonymous users can access /map
 - UserPanel auto-refetches profile when opened to show latest data
 - Upsert queries include .select() to return inserted/updated data

## Code Examples

### Form with react-hook-form + ZOD
```typescript
const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileFormData>({
  resolver: zodResolver(profileSchema),
  defaultValues: { status: 'lurking' },
})
```

### Custom Hook for TanStack Query
```typescript
export function useUserProfile(userId: string | null) {
  return useQuery({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      if (!userId) return null
      const { data, error } = await getUserProfile(userId)
      if (error) throw new Error(error.message)
      return data
    },
    enabled: !!userId,
  })
}
```

### Arrow Functions
- Single line: `const functionName = () => returnValue`
- Multi-line:
```typescript
const functionName = () => {
  // local variables at top
  const localVar = value

  // logic below
  return result
}
```
   