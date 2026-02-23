## Database 
 - Database/Supabase information can be found in uber_level_supabase_map_tracking.md

 ## Framework
 - We use React with React-Router decleratives.
 - useQuery for fetching (tanstack)
 - useMutation (tanstack)
 - forms - useForm (React forms)
 - ZOD for validation
 - Auth: Supabase Auth.
 - CSS: Tailwind
 - Icons: Lucide React
 - Zustand: for global states / information

 ## Structure
  - try to avoid useEffects for apicalls to supabase and make it use tanstack queries. 
  make a custom 'useHook' and create a 'hook' folder if there's none. 
  - all zod schemas goes under 'schemas' folder in schemas.ts
   