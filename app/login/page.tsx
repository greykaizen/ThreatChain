"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Building2, User } from "lucide-react"

export default function LoginPage() {
  const [role, setRole] = useState<"individual" | "organization">("individual")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const formData = new FormData(e.currentTarget)
      
      let endpoint = ''
      let payload = {}

      if (role === 'individual') {
        endpoint = 'http://localhost:3001/api/auth/login/individual'
        payload = {
          email: formData.get('email'),
          password: formData.get('password')
        }
      } else {
        endpoint = 'http://localhost:3001/api/auth/login/organization'
        payload = {
          email: formData.get('org-email'),
          password: formData.get('org-password')
        }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (data.success) {
        // Store token in localStorage
        localStorage.setItem('token', data.data.token)
        localStorage.setItem('userType', role)
        localStorage.setItem('userEmail', data.data.email)
        
        alert('Login successful!')
        window.location.href = "/dashboard"
      } else {
        alert(data.error || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      alert('Failed to login. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>Sign in to your ThreadChain account</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={role} onValueChange={(v) => setRole(v as "individual" | "organization")} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="individual" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Individual
              </TabsTrigger>
              <TabsTrigger value="organization" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Organization
              </TabsTrigger>
            </TabsList>

            <TabsContent value="individual">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="organization">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="org-email">Organization Email</Label>
                  <Input
                    id="org-email"
                    name="org-email"
                    type="email"
                    placeholder="admin@company.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="org-password">Password</Label>
                    <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="org-password"
                    name="org-password"
                    type="password"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
