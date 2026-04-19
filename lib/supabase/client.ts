import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

  if (!url || !key) {
    console.error("Missing Supabase URL or Publishable Key in environment variables")
  }

  return createBrowserClient(url, key)
}
