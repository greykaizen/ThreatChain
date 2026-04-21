import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Default to dashboard v2
  const next = searchParams.get('next') ?? '/dashboard/v2'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Server Component context
            }
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Force absolute URL to avoid root redirects
      // Iforigin is not reliable (e.g. proxy), we use the request URL's origin
      const redirectUrl = new URL(next, origin)
      console.log('Auth Callback Success, redirecting to:', redirectUrl.toString())
      return NextResponse.redirect(redirectUrl)
    } else {
      console.error('Auth Callback Exchange Error:', error)
    }
  }

  // If something went wrong, go to login
  console.warn('Auth Callback Failed or No Code, redirecting to login')
  return NextResponse.redirect(new URL('/login?error=auth_callback_failed', origin))
}
