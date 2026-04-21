"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User as SupabaseUser } from '@supabase/supabase-js'

interface User {
  id: string
  email: string
  type: 'user' | 'organization'
  fullName?: string
  orgName?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  logout: () => void
  isAuthenticated: boolean
  supabaseUser: SupabaseUser | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          setSupabaseUser(session.user)
          
          // Fetch additional profile data from our user_profiles table
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          setUser({
            id: session.user.id,
            email: session.user.email!,
            type: (profile?.role === 'admin' ? 'organization' : 'user') as 'user' | 'organization',
            fullName: profile?.full_name,
            orgName: profile?.organization_id // In a real app, join with organizations table
          })
        }
      } catch (error) {
        console.error('Error fetching auth session:', error)
      } finally {
        setIsLoading(false)
      }

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          setSupabaseUser(session.user)
          // Re-fetch profile on sign in
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          setUser({
            id: session.user.id,
            email: session.user.email!,
            type: (profile?.role === 'admin' ? 'organization' : 'user') as 'user' | 'organization',
            fullName: profile?.full_name
          })
        } else {
          setSupabaseUser(null)
          setUser(null)
        }
        setIsLoading(false)
      })

      return () => subscription.unsubscribe()
    }

    getUser()
  }, [])

  const logout = async () => {
    try {
      // Clear local state first for immediate UI response
      setSupabaseUser(null)
      setUser(null)
      
      // Use local scope for faster sign out (doesn't wait for server invalidation)
      await supabase.auth.signOut({ scope: 'local' })
      
      // Clear any potential leftover auth tokens in localStorage
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      
      router.replace('/login')
    } catch (error) {
      console.error('Logout error:', error)
      // Fallback redirect
      window.location.href = '/login'
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      supabaseUser,
      isLoading,
      logout,
      isAuthenticated: !!supabaseUser
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
