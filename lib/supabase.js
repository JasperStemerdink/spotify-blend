// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient("https://mjtwikohjkfngnadmumr.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qdHdpa29oamtmbmduYWRtdW1yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTExODM2NSwiZXhwIjoyMDY2Njk0MzY1fQ.q_Nl4CNPd_of2wz2NCigWUHqi1e9s1C4P_BFLpTdtu8")