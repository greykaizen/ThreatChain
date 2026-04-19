"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, Github, Mail, Lock, ArrowRight, Loader2, Zap, Terminal, Activity, Server, Database } from "lucide-react"

const INTEL_MESSAGES = [
  "Initializing ThreadChain secure core...",
  "Establishing blockchain provenance layer...",
  "Syncing decentralized threat intelligence...",
  "Calibrating multi-dimensional trust models...",
  "AI Analysis Engine: Status Operational",
  "Ready for analyst authentication..."
];

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [text, setText] = useState("")
  const [msgIdx, setMsgIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  // Terminal Typing Animation
  useEffect(() => {
    const currentMsg = INTEL_MESSAGES[msgIdx];
    
    if (charIdx < currentMsg.length) {
      const timeout = setTimeout(() => {
        setText(prev => prev + currentMsg[charIdx]);
        setCharIdx(prev => prev + 1);
      }, 40);
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => {
        setText("");
        setCharIdx(0);
        setMsgIdx(prev => (prev + 1) % INTEL_MESSAGES.length);
      }, 3500);
      return () => clearTimeout(timeout);
    }
  }, [charIdx, msgIdx]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        router.push("/dashboard/v2")
      }
    } catch (error: any) {
      alert(error.message || 'Invalid credentials. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error: any) {
      alert(error.message)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#f8fafc] overflow-hidden selection:bg-indigo-100">
      {/* ─── LEFT PANEL: LIGHT TERMINAL STREAM (60%) ─── */}
      <div className="hidden lg:flex w-[60%] flex-col relative bg-white overflow-hidden p-16 border-r border-slate-200 shadow-2xl">
        {/* Decorative Light Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1.5px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1.5px,transparent_1px)] bg-[size:60px_60px] opacity-40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#4f46e505_0%,transparent_70%)]" />
        
        {/* Pinned Top Left: Brand */}
        <div className="relative z-20 self-start">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100">
                <Shield className="w-8 h-8 text-white" />
             </div>
             <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">ThreadChain</h2>
                <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-[0.5em] mt-0.5 font-mono">Core_System_v4.0</p>
             </div>
          </div>
        </div>

        {/* Central Terminal area */}
        <div className="flex-1 flex items-center relative z-20">
          <div className="w-full space-y-12 text-left">
            <div className="min-h-[300px]">
               <div className="flex items-start gap-8 font-mono">
                  <p className="text-7xl font-normal text-slate-900 tracking-tighter leading-[0.95] max-w-4xl min-h-[180px] uppercase">
                    {text}
                    <span className="inline-block w-6 h-16 bg-indigo-600 ml-3 animate-pulse align-middle" />
                  </p>
               </div>
            </div>
          </div>
        </div>

        {/* Pinned Bottom Left: Unified Status Hub (SINGLE ROW) */}
        <div className="relative z-20 self-start space-y-6">
           <div className="flex items-center gap-8">
              <div className="flex items-center gap-3 px-4 py-2 bg-green-50 rounded-xl border border-green-200 w-fit shadow-sm">
                 <Activity className="w-4 h-4 text-green-600 animate-pulse" />
                 <span className="text-[11px] font-bold text-green-700 uppercase tracking-widest font-mono">Sync: Optimal</span>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest">
                   <Server className="w-4 h-4 text-green-500/40" />
                   <span>ALCH_NODE: READY</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest">
                   <Database className="w-4 h-4 text-green-500/40" />
                   <span>SUPA_DB: SYNCED</span>
                </div>
              </div>
           </div>
           
           <div className="opacity-20 font-mono">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.6em] leading-relaxed text-left">
                IDENTITY LAYER SECURED <br />
                FEDERATION ACTIVE v4.2
              </p>
           </div>
        </div>
      </div>

      {/* ─── RIGHT PANEL: CLEAN LOGIN (40%) ─── */}
      <div className="flex-1 lg:w-[40%] relative flex items-center justify-center p-8 bg-slate-50/30 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 w-full max-w-[400px]"
        >
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
              Login
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Access your ThreadChain account
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-[0_30px_60px_rgba(0,0,0,0.05)] relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-[4px] bg-indigo-600" />
            
            <div className="space-y-6">
              {/* OAuth Buttons at Top */}
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => handleOAuthLogin('github')} 
                  className="bg-white border-slate-200 h-12 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-2xl flex items-center gap-2 transition-all font-bold text-xs shadow-sm"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleOAuthLogin('google')} 
                  className="bg-white border-slate-200 h-12 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-2xl flex items-center gap-2 transition-all font-bold text-xs shadow-sm"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.32v2.77h3.57c2.08-3.3 3.28-8.17 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335" />
                  </svg>
                  Google
                </Button>
              </div>

              {/* OR Divider */}
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-[0.2em] text-slate-300">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
                <span className="relative bg-white px-3">OR</span>
              </div>

              <form onSubmit={handleLogin} className="space-y-6 text-left">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Email Address</Label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-300 group-focus-within:text-indigo-600 transition-colors">
                      <Mail className="h-5 w-5" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-slate-50 border-slate-200 h-14 pl-12 text-slate-900 rounded-2xl focus:ring-indigo-600/20 focus:border-indigo-600 transition-all border shadow-sm placeholder:text-slate-300"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <Label htmlFor="password" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Password</Label>
                    <button 
                      type="button"
                      onClick={() => router.push("/forgot-password")}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors outline-none"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-300 group-focus-within:text-indigo-600 transition-colors">
                      <Lock className="h-5 w-5" />
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-slate-50 border-slate-200 h-14 pl-12 text-slate-900 rounded-2xl focus:ring-indigo-600/20 focus:border-indigo-600 transition-all border shadow-sm placeholder:text-slate-300"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 group active:scale-95"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Login
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-10 text-center"
          >
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
              Don't have an account?{" "}
              <Link href="/signup" className="text-indigo-600 hover:text-indigo-700 font-black transition-all ml-1 underline underline-offset-8 decoration-indigo-600/20">
                Sign Up
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Signature detail */}
      <div className="absolute bottom-6 right-8 pointer-events-none opacity-40">
         <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <Zap className="w-4 h-4 text-indigo-600 fill-indigo-600/10 animate-pulse" />
            <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">SECURE_NODE_19.04.26</span>
         </div>
      </div>
    </div>
  )
}
