import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a dummy client during build time
    // This should never actually be used - real requests need env vars
    throw new Error('Supabase environment variables not configured')
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
