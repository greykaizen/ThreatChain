"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"
import { Shield, Lock, ArrowRight, Loader2, Terminal, Activity, Server, Database } from "lucide-react"

const RESET_MESSAGES = [
  "Session authorized via secure token...",
  "Validating recovery environment...",
  "Preparing cryptographic reset flow...",
  "Awaiting new security credentials...",
  "Ready to finalize access update..."
];

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [text, setText] = useState("")
  const [msgIdx, setMsgIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  // Terminal Typing Animation
  useEffect(() => {
    const currentMsg = RESET_MESSAGES[msgIdx];
    
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
        setMsgIdx(prev => (prev + 1) % RESET_MESSAGES.length);
      }, 3500);
      return () => clearTimeout(timeout);
    }
  }, [charIdx, msgIdx]);

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      alert("Passwords do not match.")
      return
    }
    setIsLoading(true)
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) throw error
      alert('Security key successfully updated! Redirecting to dashboard...')
      router.push("/dashboard/v2")
    } catch (error: any) {
      alert(error.message || 'Failed to update access key. Please try again.')
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
          <div className="flex items-center gap-4">
             <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100">
                <Shield className="w-8 h-8 text-white" />
             </div>
             <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">ThreadChain</h2>
                <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-[0.5em] mt-0.5 font-mono">Reset_Auth_v2.0</p>
             </div>
          </div>
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
                 <span className="text-xs font-bold text-slate-600 uppercase tracking-widest font-mono">Status: Secure Reset Active</span>
              </div>
           </div>
           <div className="opacity-30 font-mono text-left">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.6em] leading-relaxed">
                SESSION ENCRYPTED <br />
                AWAITING AUTH_UPDATE_PROTOCOLS
              </p>
           </div>
        </div>
      </div>

      {/* ─── RIGHT PANEL: RESET FORM (40%) ─── */}
      <div className="flex-1 lg:w-[40%] relative flex items-center justify-center p-8 bg-slate-50/30 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 w-full max-w-[400px]"
        >
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
              New Access Key
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Update your security credentials
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-[0_30px_60px_rgba(0,0,0,0.05)] relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-[4px] bg-indigo-600" />
            
            <form onSubmit={handleUpdate} className="space-y-6 text-left">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-bold text-slate-600 ml-1">New Access Key</Label>
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

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-xs font-bold text-slate-600 ml-1">Confirm New Key</Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-300 group-focus-within:text-indigo-600 transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                    Finalize Identity Update
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
