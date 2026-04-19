"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, Building2, User } from "lucide-react"
// import { FcGoogle } from "react-icons/fc"                      // TODO: re-enable when Supabase is configured
// import { signInWithGoogle, sendMagicLink } from "@/lib/supabaseAuth"  // TODO: re-enable when Supabase is configured

export default function LoginPage() {
  const [role, setRole] = useState<"individual" | "organization">("individual")
  const [isLoading, setIsLoading] = useState(false)
  // const [oauthLoading, setOauthLoading] = useState(false)      // TODO: re-enable with OAuth
  // const [magicEmail, setMagicEmail] = useState("")             // TODO: re-enable with magic link
  // const [magicLinkSent, setMagicLinkSent] = useState(false)    // TODO: re-enable with magic link
  // const [magicLoading, setMagicLoading] = useState(false)      // TODO: re-enable with magic link
  const { login, clearAuthOnly } = useAuth()
  const router = useRouter()

  // ── Existing JWT login — NOT modified ────────────────────────────────────
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

      if (response.ok && data.success && data.data && data.data.token) {
        login(data.data.token, role, data.data.email)
        alert('Login successful!')
        router.push("/dashboard")
      } else {
        clearAuthOnly()
        alert(data.error || 'Invalid credentials. Please try again.')
      }
    } catch (error) {
      console.error('Login error:', error)
      clearAuthOnly()
      alert('Failed to login. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // TODO: Re-enable when Supabase Site URL is configured to localhost:3000
  // const handleGoogleLogin = async () => {
  //   setOauthLoading(true)
  //   try {
  //     await signInWithGoogle()
  //   } catch (error: any) {
  //     alert(error.message || 'Failed to sign in with Google.')
  //     setOauthLoading(false)
  //   }
  // }

  // TODO: Re-enable when Supabase is configured
  // const handleMagicLink = async (e: React.FormEvent<HTMLFormElement>) => {
  //   e.preventDefault()
  //   setMagicLoading(true)
  //   try {
  //     await sendMagicLink(magicEmail)
  //     setMagicLinkSent(true)
  //   } catch (error: any) {
  //     alert(error.message || 'Failed to send magic link.')
  //   } finally {
  //     setMagicLoading(false)
  //   }
  // }

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
          {/* ── OAuth & Magic Link section — commented out until Supabase is configured ──
          <div className="space-y-3 mb-6">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={oauthLoading || isLoading}
            >
              <FcGoogle className="mr-2 h-5 w-5" />
              {oauthLoading ? 'Redirecting...' : 'Continue with Google'}
            </Button>

            {!magicLinkSent ? (
              <form onSubmit={handleMagicLink} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Email magic link"
                  value={magicEmail}
                  onChange={(e) => setMagicEmail(e.target.value)}
                  required
                  disabled={magicLoading}
                  className="flex-1"
                />
                <Button type="submit" variant="outline" disabled={magicLoading || !magicEmail}>
                  <Mail className="h-4 w-4 mr-1" />
                  {magicLoading ? '...' : 'Send'}
                </Button>
              </form>
            ) : (
              <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg text-sm">
                <Mail className="h-5 w-5 text-green-600 mx-auto mb-1" />
                <p className="font-medium text-green-700 dark:text-green-400">Check your email</p>
                <p className="text-xs text-muted-foreground mt-1">Sign-in link sent to {magicEmail}</p>
                <button
                  onClick={() => { setMagicLinkSent(false); setMagicEmail('') }}
                  className="text-xs text-primary underline mt-2"
                >
                  Use a different email
                </button>
              </div>
            )}
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or sign in with password
              </span>
            </div>
          </div>
          ── end OAuth section ── */}

          {/* ── Existing email/password forms — NOT modified ──────────────── */}
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
