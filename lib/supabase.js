// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient("https://mjtwikohjkfngnadmumr.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qdHdpa29oamtmbmduYWRtdW1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMTgzNjUsImV4cCI6MjA2NjY5NDM2NX0.046y73toESI4IGAkR7V0dzL8L4JYGisdj3D0-JKXsxk")
