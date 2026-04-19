"use client"

import { useState, useEffect } from "react"
import GraphifyVisualizer from "./v2/graphify-visualizer"
import { RefreshCw, Search, Filter, ShieldCheck, Database } from "lucide-react"

export default function KnowledgeGraph() {
  const [graphData, setGraphData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchGraphData = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/graph/graphify")
      const data = await res.json()
      setGraphData(data)
    } catch (err) {
      console.error("Failed to load graph data", err)
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    window.location.href = "/dashboard"
  }

  useEffect(() => {
    fetchGraphData()
  }, [])

  return (
    <div className="p-6 h-screen flex flex-col gap-6 bg-slate-50/50">
      {/* ... header ... */}
      <div className="flex-1 min-h-0 bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-medium animate-pulse">Mapping Global Intelligence Network...</p>
          </div>
        ) : (
          <GraphifyVisualizer data={graphData} onBack={handleBack} />
        )}
      </div>
    </div>
  )
}
