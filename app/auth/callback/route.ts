import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

/**
 * OAuth Callback Route Handler
 *
 * Handles the redirect from Google OAuth and email magic links.
 * Exchanges the auth code for a Supabase session and sets the cookie,
 * then redirects to /dashboard.
 *
 * The existing JWT/MySQL auth system is completely unaffected by this route.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    // If Supabase is not configured, redirect to login with an error
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.redirect(new URL('/login?error=supabase_not_configured', request.url));
    }

    const cookieStore = cookies();

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Safe to ignore in middleware/server components
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Safe to ignore in middleware/server components
          }
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }

    return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
  }

  // No code — redirect back to login
  return NextResponse.redirect(new URL('/login', request.url));
}
