"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  type: 'user' | 'organization'
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
    // Check for existing token on mount
    const storedToken = localStorage.getItem('token')
    const userType = localStorage.getItem('userType')
    const userEmail = localStorage.getItem('userEmail')

    if (storedToken) {
      // Verify token with backend
      verifyToken(storedToken, userType, userEmail)
    } else {
      setIsLoading(false)
    }
  }, [])

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
          // Invalid token, clear storage
          clearAuth()
        }
      } else {
        // Token verification failed
        clearAuth()
      }
    } catch (error) {
      console.error('Token verification failed:', error)
      clearAuth()
    } finally {
      setIsLoading(false)
    }
  }

  const login = (newToken: string, userType: string, email: string) => {
    localStorage.setItem('token', newToken)
    localStorage.setItem('userType', userType)
    localStorage.setItem('userEmail', email)
    // Don't set token immediately - wait for verification
    verifyToken(newToken, userType, email)
  }

  const logout = () => {
    clearAuth()
    router.push('/login')
  }

  const clearAuth = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userType')
    localStorage.removeItem('userEmail')
    setToken(null)
    setUser(null)
  }

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
      isAuthenticated: !!token && !!user
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
