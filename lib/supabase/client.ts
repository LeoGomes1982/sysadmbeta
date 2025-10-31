import { createBrowserClient } from "@supabase/ssr"

export { createBrowserClient }

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("[v0] Supabase environment variables not found. Client creation skipped.")
    return null
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
