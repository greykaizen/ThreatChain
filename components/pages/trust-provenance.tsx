"use client"

import {
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Shield, Lock, FileCheck, Share2 } from "lucide-react"

const trustMetrics = [
  { metric: "Source Reputation", value: 92 },
  { metric: "Fake Pattern Detection", value: 88 },
  { metric: "Timeliness", value: 85 },
  { metric: "Validation", value: 90 },
]

const blockchainAudit = [
  { id: 1, txId: "0x7f3a...", hash: "a1b2c3d4", timestamp: "2024-01-15 10:30", verified: "Yes" },
  { id: 2, txId: "0x8e4b...", hash: "e5f6g7h8", timestamp: "2024-01-15 09:45", verified: "Yes" },
  { id: 3, txId: "0x9d5c...", hash: "i9j0k1l2", timestamp: "2024-01-15 08:20", verified: "Yes" },
]

const cardStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "0.75rem",
}

export default function TrustProvenance() {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Trust & Provenance</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div style={cardStyle} className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Trust Metrics</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={trustMetrics}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="metric" stroke="#6b7280" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
              <Radar name="Trust Score" dataKey="value" stroke="#3b82f6" fill="#93c5fd" fillOpacity={0.5} />
              <Tooltip
                contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "0.5rem" }}
                labelStyle={{ color: "#111827" }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div style={cardStyle} className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trust Score Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trustMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="metric" stroke="#6b7280" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 11 }} />
              <YAxis stroke="#6b7280" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "0.5rem" }}
                labelStyle={{ color: "#111827" }}
              />
              <Bar dataKey="value" fill="#93c5fd" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div style={cardStyle} className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-gray-600">Non-repudiation</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">Enabled</p>
        </div>
        <div style={cardStyle} className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Lock className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-gray-600">Immutability</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">Verified</p>
        </div>
        <div style={cardStyle} className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <FileCheck className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-gray-600">Forensic Audit</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">Active</p>
        </div>
        <div style={cardStyle} className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Share2 className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-gray-600">Distributed</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">3 Nodes</p>
        </div>
      </div>

      <div style={cardStyle} className="overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Blockchain Audit Trail</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Tx ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Hash</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Timestamp</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Verified By</th>
              </tr>
            </thead>
            <tbody>
              {blockchainAudit.map((record) => (
                <tr
                  key={record.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                  style={{ transition: "all 150ms ease" }}
                >
                  <td className="px-6 py-4 text-gray-900 font-mono text-sm">{record.txId}</td>
                  <td className="px-6 py-4 text-gray-600 font-mono text-sm">{record.hash}</td>
                  <td className="px-6 py-4 text-gray-900 text-sm">{record.timestamp}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      {record.verified}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
