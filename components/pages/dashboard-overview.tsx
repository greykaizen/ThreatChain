"use client"

import { useEffect, useState } from "react"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts"
import StatCard from "@/components/stat-card"
import { Shield, AlertTriangle, Database, Activity, Lock, TrendingUp, Zap, CheckCircle2 } from "lucide-react"

const THREAT_COLORS = ["#ef4444", "#f59e0b", "#dc2626", "#7c3aed", "#3b82f6"]
const FEED_COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd"]

export default function DashboardOverview() {
  const [stats, setStats] = useState({
    totalReports: 0,
    blockchainRecords: 0,
    verifiedReports: 0,
    pendingTransactions: 0,
  })
  const [blockchainActivity, setBlockchainActivity] = useState([])
  const [reportsByType, setReportsByType] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch STIX stats
      const stixRes = await fetch("/api/stix/stats")
      const stixData = await stixRes.json()

      // Fetch blockchain metrics (same as blockchain-metrics page - this works!)
      const metricsRes = await fetch("/api/blockchain/metrics")
      const metricsData = await metricsRes.json()

      // Fetch historical metrics for charts (same as blockchain-metrics page)
      const historyRes = await fetch("/api/blockchain/metrics/history?range=24h")
      const historyData = await historyRes.json()

      console.log("Dashboard Data:", { stixData, metricsData, historyData })

      // Use metrics data for ALL counts (this aggregates from entire database)
      const metrics = metricsData.data

      setStats({
        totalReports: stixData.data?.overview?.total_reports || 0,
        blockchainRecords: metrics?.block?.latestBlock || 0,
        verifiedReports: metrics?.integrity?.provenanceRecords || 0,
        pendingTransactions: metrics?.integrity?.challengeRecords || 0,
      })

      // Process blockchain activity from historical metrics
      const historical = historyData.data?.metrics || []
      if (historical.length > 0) {
        const activity = historical.map((item: any, idx: number) => ({
          time: new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          transactions: Math.round(item.tps * 60) || 0, // Convert TPS to transactions
          timestamp: item.timestamp,
        }))
        setBlockchainActivity(activity)
      } else {
        setBlockchainActivity([])
      }

      // Process reports by type
      const typeData = stixData.data?.byType || []
      if (typeData.length > 0) {
        const formatted = typeData.map((item: any, idx: number) => ({
          name: item.report_type || "Unknown",
          value: item.count,
          color: THREAT_COLORS[idx % THREAT_COLORS.length],
        }))
        setReportsByType(formatted)
      } else {
        setReportsByType([])
      }

      // Process activity timeline from historical metrics
      if (historical.length > 0) {
        const grouped: any = {}
        
        historical.forEach((item: any) => {
          const date = new Date(item.timestamp).toLocaleDateString("en-US", { 
            month: "short", 
            day: "numeric" 
          })
          const txCount = Math.round(item.tps * 60) || 0
          grouped[date] = (grouped[date] || 0) + txCount
        })
        
        const timeline = Object.entries(grouped)
          .map(([time, count]) => ({ time, count: count as number }))
          .reverse()
        
        setRecentActivity(timeline)
      } else {
        setRecentActivity([])
      }

      setLoading(false)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }
  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard 
          icon={Shield} 
          label="Threat Reports" 
          value={stats.totalReports.toLocaleString()} 
          change="+12.5%"
          gradient="from-blue-500 to-blue-600"
        />
        <StatCard 
          icon={Database} 
          label="Blockchain Blocks" 
          value={stats.blockchainRecords.toLocaleString()} 
          change="+8.3%"
          gradient="from-purple-500 to-purple-600"
        />
        <StatCard 
          icon={CheckCircle2} 
          label="Verified Reports" 
          value={stats.verifiedReports.toLocaleString()} 
          change="+15.7%"
          gradient="from-green-500 to-green-600"
        />
        {/* <StatCard 
          icon={AlertTriangle} 
          label="Pending Transactions" 
          value={stats.pendingTransactions.toLocaleString()} 
          change="-3.2%"
          gradient="from-red-500 to-red-600"
          isNegativeGood
        /> */}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blockchain Activity */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Blockchain Activity
              </h3>
              <p className="text-sm text-muted-foreground mt-1">Recent blocks and transactions</p>
            </div>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-muted-foreground">Transactions</span>
              </div>
            </div>
          </div>
          {blockchainActivity.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={blockchainActivity}>
                <defs>
                  <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))", 
                    borderRadius: "0.5rem",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                  }}
                />
                <Area type="monotone" dataKey="transactions" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorTx)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <div className="text-center">
                <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No blockchain activity yet</p>
                <p className="text-xs mt-1">Upload a report to start</p>
              </div>
            </div>
          )}
        </div>

        {/* Report Distribution */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Report Distribution
            </h3>
            <p className="text-sm text-muted-foreground mt-1">By report type</p>
          </div>
          {reportsByType.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportsByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={(entry) => `${entry.value}`}
                  >
                    {reportsByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))", 
                      borderRadius: "0.5rem" 
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {reportsByType.map((report, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: report.color }}></div>
                      <span className="text-foreground capitalize">{report.name}</span>
                    </div>
                    <span className="font-semibold text-foreground">{report.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <div className="text-center">
                <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No reports uploaded yet</p>
                <p className="text-xs mt-1">Upload STIX reports to see distribution</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity Timeline */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" />
              Recent Activity
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Transaction timeline</p>
          </div>
          {recentActivity.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={recentActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))", 
                    borderRadius: "0.5rem" 
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--success))" 
                  strokeWidth={3} 
                  dot={{ fill: "hsl(var(--success))", r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No transaction history yet</p>
                <p className="text-xs mt-1">Activity will appear here</p>
              </div>
            </div>
          )}
        </div>

        {/* Transaction Status */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Zap className="w-5 h-5 text-warning" />
              Transaction Status
            </h3>
            <p className="text-sm text-muted-foreground mt-1">Blockchain transactions</p>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-success/10 rounded-lg border border-success/20">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">Confirmed</p>
                  <p className="text-2xl font-bold text-foreground">{stats.verifiedReports}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">On Blockchain</p>
                <p className="text-sm font-semibold text-success">Verified</p>
              </div>
            </div>
            
            {/* <div className="flex items-center justify-between p-4 bg-warning/10 rounded-lg border border-warning/20">
              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-warning" />
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-foreground">{stats.pendingTransactions}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Awaiting Mining</p>
                <p className="text-sm font-semibold text-warning">Processing</p>
              </div>
            </div> */}

            <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center gap-3">
                <Database className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Blocks</p>
                  <p className="text-2xl font-bold text-foreground">{stats.blockchainRecords}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Chain Length</p>
                <p className="text-sm font-semibold text-primary">Growing</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
