"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, Mail, ArrowRight, Loader2, Terminal, Activity, Server, Database, ArrowLeft } from "lucide-react"

const RECOVERY_MESSAGES = [
  "Initializing identity recovery protocol...",
  "Searching encrypted analyst database...",
  "Verifying security clearance level...",
  "Generating one-time reset token...",
  "Awaiting email authorization...",
  "Ready for recovery request..."
];

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [isSent, setIsSent] = useState(false)
  const [text, setText] = useState("")
  const [msgIdx, setMsgIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const supabase = createClient()

  // Terminal Typing Animation
  useEffect(() => {
    const currentMsg = RECOVERY_MESSAGES[msgIdx];
    
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
        setMsgIdx(prev => (prev + 1) % RECOVERY_MESSAGES.length);
      }, 3500);
      return () => clearTimeout(timeout);
    }
  }, [charIdx, msgIdx]);

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      })

      if (error) throw error
      setIsSent(true)
    } catch (error: any) {
      alert(error.message || 'Failed to send reset link. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[#f8fafc] overflow-hidden selection:bg-indigo-100">
      {/* ─── LEFT PANEL: TERMINAL STREAM (60%) ─── */}
      <div className="hidden lg:flex w-[60%] flex-col relative bg-white overflow-hidden p-16 border-r border-slate-200 shadow-2xl">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1.5px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1.5px,transparent_1px)] bg-[size:60px_60px] opacity-40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#4f46e505_0%,transparent_70%)]" />
        
        <div className="relative z-20 self-start">
          <Link href="/login" className="flex items-center gap-4 group">
             <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100 group-hover:scale-105 transition-transform">
                <Shield className="w-8 h-8 text-white" />
             </div>
             <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">ThreadChain</h2>
                <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-[0.5em] mt-0.5 font-mono">Recovery_Module_v1.0</p>
             </div>
          </Link>
        </div>

        <div className="flex-1 flex items-center relative z-20">
          <div className="w-full space-y-12">
            <div className="min-h-[300px]">
               <div className="flex items-start gap-8 font-mono">
                  <span className="text-indigo-600 font-black text-6xl mt-2">&gt;</span>
                  <p className="text-7xl font-normal text-slate-900 tracking-tighter leading-[0.95] max-w-4xl min-h-[180px] uppercase text-left">
                    {text}
                    <span className="inline-block w-6 h-16 bg-indigo-600 ml-3 animate-pulse align-middle" />
                  </p>
               </div>
            </div>
          </div>
        </div>

        <div className="relative z-20 self-start space-y-8">
           <div className="flex items-center gap-8">
              <div className="flex items-center gap-3 px-5 py-2.5 bg-indigo-50 rounded-xl border border-indigo-200 w-fit shadow-sm">
                 <Activity className="w-4 h-4 text-indigo-600 animate-pulse" />
                 <span className="text-xs font-bold text-slate-600 uppercase tracking-widest font-mono">System: Recovery Active</span>
              </div>
           </div>
           <div className="opacity-30 font-mono text-left">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.6em] leading-relaxed">
                SECURE AUTHENTICATION BRIDGE <br />
                ID_RECOVERY_PROTOCOL_READY
              </p>
           </div>
        </div>
      </div>

      {/* ─── RIGHT PANEL: RECOVERY FORM (40%) ─── */}
      <div className="flex-1 lg:w-[40%] relative flex items-center justify-center p-8 bg-slate-50/30 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 w-full max-w-[400px]"
        >
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
              Recover Access
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Request a security reset link
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-[0_30px_60px_rgba(0,0,0,0.05)] relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-[4px] bg-indigo-600" />
            
            {isSent ? (
              <div className="text-center space-y-6 py-4 animate-in fade-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto border border-green-100">
                   <Mail className="w-10 h-10 text-green-500" />
                </div>
                <div className="space-y-2">
                   <h3 className="text-xl font-bold text-slate-900">Link Dispatched</h3>
                   <p className="text-sm text-slate-500 leading-relaxed">
                     Check your secure inbox for instructions to reset your access key.
                   </p>
                </div>
                <Button 
                  asChild
                  className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all"
                >
                  <Link href="/login">Return to Login</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-8">
                <div className="space-y-2 text-left">
                  <Label htmlFor="email" className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Terminal ID</Label>
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

                <Button 
                  type="submit" 
                  className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 group active:scale-95"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Send Reset Link
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
                
                <Link 
                  href="/login" 
                  className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest mt-4"
                >
                   <ArrowLeft className="w-4 h-4" /> Back to Login
                </Link>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
