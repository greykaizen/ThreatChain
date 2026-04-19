"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseSession, supabaseSignOut } from '@/lib/supabaseAuth'

interface User {
  id: string
  email: string
  type: 'user' | 'organization' | 'oauth'
  firstName?: string
  lastName?: string
  orgName?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (token: string, userType: string, email: string) => void
  logout: () => void
  clearAuthOnly: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // ── PATH 1: Existing JWT auth (completely unchanged) ──────────────────
    const storedToken = localStorage.getItem('token')
    const userType = localStorage.getItem('userType')
    const userEmail = localStorage.getItem('userEmail')

    if (storedToken) {
      // JWT exists — verify with the existing backend, exactly as before
      verifyToken(storedToken, userType, userEmail)
      return
    }

    // ── PATH 2: Supabase OAuth fallback (only runs if no JWT) ─────────────
    // This never interferes with JWT users because we return early above.
    checkSupabaseSession()
  }, [])

  // ── Existing JWT verification — NOT modified ────────────────────────────
  const verifyToken = async (token: string, userType: string | null, email: string | null) => {
    try {
      const response = await fetch('http://localhost:3001/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUser(data.data)
          setToken(token)
        } else {
          clearAuth()
        }
      } else {
        clearAuth()
      }
    } catch (error) {
      console.error('Token verification failed:', error)
      clearAuth()
    } finally {
      setIsLoading(false)
    }
  }

  // ── New: Supabase session check (only runs when no JWT present) ──────────
  const checkSupabaseSession = async () => {
    try {
      const session = await getSupabaseSession()
      if (session?.user) {
        // Supabase user is authenticated — map to the existing User shape
        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          type: 'oauth',
          firstName: session.user.user_metadata?.full_name?.split(' ')[0],
          lastName: session.user.user_metadata?.full_name?.split(' ').slice(1).join(' '),
        })
        // No JWT token for OAuth users — token stays null
        setToken(null)
      }
    } catch (error) {
      // Supabase not configured or session check failed — silently ignore
      console.debug('Supabase session check skipped:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // ── Existing login — NOT modified ───────────────────────────────────────
  const login = (newToken: string, userType: string, email: string) => {
    localStorage.setItem('token', newToken)
    localStorage.setItem('userType', userType)
    localStorage.setItem('userEmail', email)
    verifyToken(newToken, userType, email)
  }

  // ── Logout — clears both JWT and Supabase session ───────────────────────
  const logout = () => {
    clearAuth()
    // Also sign out from Supabase if the user came via OAuth
    supabaseSignOut().catch(() => {
      // Silently ignore if Supabase is not configured
    })
    router.push('/login')
  }

  const clearAuth = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userType')
    localStorage.removeItem('userEmail')
    setToken(null)
    setUser(null)
  }

  // clearAuthOnly is used by the login page on failed attempts — unchanged
  const clearAuthOnly = () => {
    clearAuth()
  }

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      login,
      logout,
      clearAuthOnly,
      // isAuthenticated is true for both JWT users (token set) and OAuth users (user set, no token)
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
