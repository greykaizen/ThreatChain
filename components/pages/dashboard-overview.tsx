"use client"

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"
import StatCard from "@/components/stat-card"
import { Activity, Database, Lock } from "lucide-react"

const iocsPerFeed = [
  { name: "OpenCTI", value: 1240 },
  { name: "MISP", value: 980 },
  { name: "OSINT", value: 750 },
  { name: "User", value: 420 },
]

const feedRatio = [
  { name: "OpenCTI", value: 35 },
  { name: "MISP", value: 28 },
  { name: "OSINT", value: 22 },
  { name: "User", value: 15 },
]

const trustScoreTrend = [
  { time: "Jan", score: 72 },
  { time: "Feb", score: 75 },
  { time: "Mar", score: 78 },
  { time: "Apr", score: 81 },
  { time: "May", score: 84 },
  { time: "Jun", score: 87 },
]

const COLORS = ["#93c5fd", "#86efac", "#2c2c2c", "#c084fc"]
const BAR_COLORS = ["#93c5fd", "#86efac", "#2c2c2c", "#c4b5fd", "#fbbf24"]

const cardStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "0.75rem",
}

export default function DashboardOverview() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={Database} label="Views" value="7,265" change="+11.01%" />
        <StatCard icon={Activity} label="Visits" value="3,671" change="-0.03%" />
        <StatCard icon={Lock} label="New Users" value="156" change="+15.03%" />
        <StatCard icon={Activity} label="Active Users" value="2,318" change="+6.08%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div style={cardStyle} className="p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Total Users</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trustScoreTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" stroke="#9ca3af" tick={{ fontSize: 12 }} />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "0.5rem" }}
                labelStyle={{ color: "#111827" }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#6b7280"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={cardStyle} className="p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Traffic by Location</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={feedRatio}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {feedRatio.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "0.5rem" }}
                labelStyle={{ color: "#111827" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={cardStyle} className="p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Traffic by Device</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={iocsPerFeed}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 12 }} />
            <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "0.5rem" }}
              labelStyle={{ color: "#111827" }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={60}>
              {iocsPerFeed.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
