"use client"

import { useEffect, useState } from "react"
import {
  BarChart, Bar, PieChart, Pie, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
} from "recharts"
import StatCard from "@/components/stat-card"
import { Shield, AlertTriangle, Database, Activity, Zap, CheckCircle2, TrendingUp, Globe, Server, Cpu } from "lucide-react"

const THREAT_COLORS = ["#ef4444", "#f59e0b", "#dc2626", "#7c3aed", "#3b82f6"]

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
    const interval = setInterval(fetchData, 15000); // Live refresh every 15s
    return () => clearInterval(interval);
  }, [])

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-full min-h-[600px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-slate-500 font-medium animate-pulse uppercase tracking-widest text-xs">Connecting to Alchemy Node...</p>
      </div>
    </div>
  )

  return (
    <div className="p-6 space-y-6 bg-slate-50/30">
      {/* ─── INFRASTRUCTURE HEALTH ROW (New!) ─── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white p-4 rounded-xl shadow-lg border border-slate-800">
           <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alchemy Request Health</p>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
           </div>
           <p className="text-2xl font-black">{data?.stats.infra.totalRequests}</p>
           <p className="text-[10px] text-green-400 mt-1 font-bold">100% SUCCESS RATE</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
           <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gas Price (Sepolia)</p>
           </div>
           <p className="text-xl font-bold text-slate-900">{data?.stats.infra.gasPrice} <span className="text-xs font-medium text-slate-400">Gwei</span></p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
           <div className="flex items-center gap-2 mb-2">
              <Server className="w-4 h-4 text-indigo-500" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Block</p>
           </div>
           <p className="text-xl font-bold text-slate-900">#{data?.stats.infra.latestBlock.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
           <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4 text-blue-500" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Load</p>
           </div>
           <p className="text-xl font-bold text-slate-900">2.4% <span className="text-xs font-medium text-slate-400">Stable</span></p>
        </div>
      </div>

      {/* ─── THREAT INTEL STATS ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={Shield} 
          label="Total Threat Reports" 
          value={data?.stats.totalReports || 0} 
          change="+12.5%"
          gradient="from-blue-600 to-blue-700" 
        />
        <StatCard 
          icon={CheckCircle2} 
          label="Verified on Chain" 
          value={data?.stats.verifiedReports || 0} 
          change="+15.7%"
          gradient="from-green-600 to-green-700" 
        />
        <StatCard 
          icon={Globe} 
          label="Global Shared Feeds" 
          value={12} 
          change="LIVE"
          gradient="from-indigo-600 to-indigo-700" 
        />
      </div>

      {/* ─── DUAL CHARTS ROW ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* API Usage & Blockchain activity (Merged!) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                Infrastucture Activity
              </h3>
              <p className="text-xs text-slate-500 mt-1">Real-time requests to Alchemy Sepolia Node</p>
            </div>
            <div className="flex gap-4">
               <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-indigo-600" />
                  <span className="text-[10px] font-bold text-slate-600 uppercase">Requests</span>
               </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={data?.activity || []}>
              <defs>
                <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: "#fff", 
                  border: "1px solid #e2e8f0", 
                  borderRadius: "0.75rem",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)"
                }}
              />
              <Area type="monotone" dataKey="requests" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorUsage)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Report Distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              Intelligence Mix
            </h3>
            <p className="text-xs text-slate-500 mt-1">Distribution of incoming STIX types</p>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={data?.stats.byType || []}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={8}
                dataKey="value"
              >
                {(data?.stats.byType || []).map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={THREAT_COLORS[index % THREAT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
