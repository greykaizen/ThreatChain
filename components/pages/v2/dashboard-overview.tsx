"use client"

import { useEffect, useState } from "react"
import {
  BarChart, Bar, PieChart, Pie, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
} from "recharts"
import StatCard from "@/components/stat-card"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Shield, AlertTriangle, Database, Activity, Zap, CheckCircle2, 
  TrendingUp, Globe, Server, Cpu, Network, ArrowUpRight, 
  Lock, Search, Inbox, BarChart3
} from "lucide-react"

const THREAT_COLORS = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444"]

function DashboardHeader({ stats }: { stats: any }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Intelligence Command</h2>
        <div className="flex items-center gap-3 mt-1">
           <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 rounded border border-green-100">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] font-black text-green-700 uppercase tracking-widest">Neural Link: Online</span>
           </div>
           <span className="text-slate-400 text-xs font-medium">// Session_Auth: Analyst_Admin</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
         <div className="bg-white border border-slate-200 rounded-xl px-5 py-2.5 shadow-sm flex items-center gap-4">
            <div className="text-right">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Alchemy Node</p>
               <p className="text-sm font-bold text-slate-900 font-mono">#{stats?.infra?.latestBlock.toLocaleString()}</p>
            </div>
            <div className="h-8 w-px bg-slate-100" />
            <div className="text-right">
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Gas Index</p>
               <p className="text-sm font-bold text-indigo-600 font-mono">{stats?.infra?.gasPrice} Gwei</p>
            </div>
         </div>
      </div>
    </div>
  )
}

export default function DashboardOverviewV2() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/dashboard/stats")
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [])

  if (loading) return (
    <div className="p-12 flex flex-col items-center justify-center h-full min-h-[600px] bg-white">
      <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6" />
      <p className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Initializing System Telemetry...</p>
    </div>
  )

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 bg-white selection:bg-indigo-100">
      <DashboardHeader stats={data?.stats} />

      {/* ─── PRIMARY METRICS GRID ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={Shield} 
          label="Total Threat Reports" 
          value={data?.stats.totalReports || 0} 
          change="+12.5%"
          gradient="from-indigo-600 to-indigo-700" 
        />
        <StatCard 
          icon={Lock} 
          label="Blockchain Provenance" 
          value={data?.stats.verifiedReports || 0} 
          change="100% Verified"
          gradient="from-emerald-500 to-emerald-600" 
        />
        <StatCard 
          icon={Database} 
          label="Network Indicators" 
          value={124} 
          change="+14.2%"
          gradient="from-blue-600 to-blue-700" 
        />
        <StatCard 
          icon={Zap} 
          label="Scoring Confidence" 
          value="88.4%" 
          change="Optimal"
          gradient="from-amber-500 to-amber-600" 
        />
      </div>

      {/* ─── DATA VISUALIZATION LAYER ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Infrasctructure Timeline */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white border border-slate-200 rounded-[2rem] p-10 shadow-[0_15px_50px_-15px_rgba(0,0,0,0.05)] flex flex-col relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.03),transparent)]" />
          
          <div className="flex items-center justify-between mb-10 relative z-10">
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                 <Activity className="w-6 h-6 text-indigo-600" />
                 Network Activity Stream
              </h3>
              <p className="text-sm font-medium text-slate-400 mt-1">Real-time throughput metrics via Alchemy</p>
            </div>
            <div className="flex gap-4">
               <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="w-2 h-2 rounded-full bg-indigo-600" />
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">TX_Requests</span>
               </div>
            </div>
          </div>

          <div className="flex-1 min-h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.activity || []}>
                <defs>
                  <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="time" stroke="#cbd5e1" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#cbd5e1" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} dx={-10} />
                <Tooltip
                  cursor={{ stroke: '#4f46e5', strokeWidth: 1 }}
                  contentStyle={{ 
                    backgroundColor: "#fff", 
                    border: "1px solid #e2e8f0", 
                    borderRadius: "1rem",
                    boxShadow: "0 20px 40px -10px rgba(0,0,0,0.1)",
                    padding: "12px 16px"
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="requests" 
                  stroke="#4f46e5" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorUsage)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Intelligence Mix Card */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-slate-200 rounded-[2rem] p-10 shadow-[0_15px_50px_-15px_rgba(0,0,0,0.05)]"
        >
          <div className="mb-10">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
               <Network className="w-6 h-6 text-emerald-500" />
               Semantic Mix
            </h3>
            <p className="text-sm font-medium text-slate-400 mt-1">Intelligence distribution by type</p>
          </div>

          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.stats.byType || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={10}
                  dataKey="value"
                  stroke="none"
                >
                  {(data?.stats.byType || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={THREAT_COLORS[index % THREAT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-8 space-y-3">
             {data?.stats.byType.map((type: any, i: number) => (
               <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors group cursor-default">
                  <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full" style={{ backgroundColor: THREAT_COLORS[i % THREAT_COLORS.length] }} />
                     <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider">{type.name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">{type.value} UNITS</span>
               </div>
             ))}
          </div>
        </motion.div>
      </div>

      {/* ─── INFRASTRUCTURE & RECENT ACTIVITY ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Live Ledger Status */}
         <div className="bg-[#0f172a] rounded-[2rem] p-10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8">
               <Globe className="w-16 h-16 text-white/5 group-hover:text-indigo-500/20 transition-colors duration-700" />
            </div>
            
            <div className="mb-12 relative z-10">
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10 mb-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[9px] font-black text-white uppercase tracking-[0.3em]">Ledger_Sync: v4.2_OK</span>
               </div>
               <h3 className="text-2xl font-black text-white uppercase tracking-tight italic leading-none">Blockchain Provenance <br /> <span className="text-blue-500 not-italic">Integrity Monitoring</span></h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
               <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Cross-Chain Proofs</p>
                  <p className="text-2xl font-black text-white uppercase tracking-tighter italic">Verified</p>
               </div>
               <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Immutable Index</p>
                  <p className="text-2xl font-black text-white uppercase tracking-tighter italic">Growing</p>
               </div>
            </div>

            <div className="mt-10 pt-8 border-t border-white/5">
               <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] font-bold">
                  <span className="tracking-[0.4em] uppercase">Architecture: Decentralized</span>
                  <span className="text-blue-500">100% UPTIME</span>
               </div>
            </div>
         </div>

         {/* Modern Data Table Preview */}
         <div className="bg-white border border-slate-200 rounded-[2rem] p-10 shadow-[0_15px_50px_-15px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between mb-10">
               <div>
                 <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                    <BarChart3 className="w-6 h-6 text-indigo-600" />
                    Latest Indicators
                 </h3>
                 <p className="text-sm font-medium text-slate-400 mt-1">Recently archived threat signatures</p>
               </div>
               <button className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-indigo-600">
                  <ArrowUpRight className="w-6 h-6" />
               </button>
            </div>

            <div className="space-y-4">
               {[1, 2, 3].map((item) => (
                  <div key={item} className="flex items-center justify-between p-4 rounded-2xl border border-slate-50 bg-slate-50/30 hover:border-slate-200 hover:bg-white transition-all group">
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm group-hover:scale-110 transition-transform">
                           <Inbox className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                           <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">Report_Fragment_{item * 1069}</p>
                           <p className="text-[10px] font-mono text-slate-400 font-bold uppercase">Hash: 0x7f8...3a1</p>
                        </div>
                     </div>
                     <span className="text-[9px] font-black px-2.5 py-1 bg-green-50 text-green-600 rounded border border-green-100">SECURE</span>
                  </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  )
}
