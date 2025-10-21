"use client"

import type { LucideIcon } from "lucide-react"
import { TrendingUp } from "lucide-react"

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string
  change: string
}

export default function StatCard({ icon: Icon, label, value, change }: StatCardProps) {
  const isPositive = change.startsWith("+")
  
  return (
    <div
      style={{
        backgroundColor: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: "0.75rem",
      }}
      className="p-5"
    >
      <div className="flex flex-col">
        <p className="text-xs text-gray-500 font-medium mb-3">{label}</p>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className={`text-xs font-medium ${isPositive ? "text-gray-900" : "text-red-600"}`}>
                {change}
              </span>
              {isPositive && <TrendingUp className="w-3 h-3 text-gray-900" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
