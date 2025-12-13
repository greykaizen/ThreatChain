"use client"

import type { LucideIcon } from "lucide-react"
import { TrendingUp, TrendingDown } from "lucide-react"

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string
  change: string
  gradient?: string
  isNegativeGood?: boolean
}

export default function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  change, 
  gradient = "from-primary to-primary",
  isNegativeGood = false 
}: StatCardProps) {
  const isPositive = change.startsWith("+")
  const isGoodChange = isNegativeGood ? !isPositive : isPositive
  
  return (
    <div className="relative overflow-hidden bg-card border border-border rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 group">
      {/* Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity`}></div>
      
      {/* Icon with Gradient */}
      <div className="relative flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg bg-gradient-to-br ${gradient} shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
          isGoodChange 
            ? "bg-success/10 text-success" 
            : "bg-destructive/10 text-destructive"
        }`}>
          {isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          <span>{change}</span>
        </div>
      </div>
      
      {/* Content */}
      <div className="relative">
        <p className="text-sm text-muted-foreground font-medium mb-2">{label}</p>
        <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
      </div>
      
      {/* Hover Effect Line */}
      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
    </div>
  )
}
