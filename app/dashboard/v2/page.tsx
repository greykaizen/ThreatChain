"use client"

import { useState, useEffect } from "react"
import ProtectedRoute from "@/components/ProtectedRoute"
import Sidebar from "@/components/sidebar"
import DashboardOverview from "@/components/pages/v2/dashboard-overview"
import FeedParser from "@/components/pages/feed-parser"
import KnowledgeGraph from "@/components/pages/v2/knowledge-graph"
import TrustProvenance from "@/components/pages/trust-provenance"
import ProvenanceIntelligenceHub from "@/components/pages/provenance-hub"
import BlockchainMetrics from "@/components/pages/blockchain-metrics"
import SharedReports from "@/components/pages/shared-reports"
import TaxiiServer from "@/components/pages/taxii-server"
import FeedExtractor from "@/components/pages/feed-extractor"
import Clients from "@/components/pages/clients"
import RagAssistant from "@/components/pages/rag-assistant"
import Navbar from "@/components/navbar"

export default function DashboardPage() {
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([])
  const [csvData, setCsvData] = useState<any[]>([])
  
  // Keep track of which tabs have been visited to lazy-mount them
  const [visitedTabs, setVisitedTabs] = useState<Record<string, boolean>>({
    dashboard: true
  })

  useEffect(() => {
    setVisitedTabs(prev => ({ ...prev, [currentPage]: true }))
  }, [currentPage])

  const handleProceedToGraph = (attributes: any[], data: any[]) => {
    setSelectedAttributes(attributes.map((a) => a.name))
    setCsvData(data)
    setVisitedTabs(prev => ({ ...prev, graph: true }))
    setCurrentPage("graph")
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-auto bg-background relative">
            {/* Optimized Lazy Keep-Alive: Components only mount when first needed */}
            <div className={currentPage === "dashboard" ? "block h-full" : "hidden h-0 overflow-hidden"}>
              <DashboardOverview />
            </div>
            
            {visitedTabs.feeds && (
              <div className={currentPage === "feeds" ? "block h-full" : "hidden h-0 overflow-hidden"}>
                <FeedParser onProceedToGraph={handleProceedToGraph} />
              </div>
            )}
            
            {visitedTabs.graph && (
              <div className={currentPage === "graph" ? "block h-full" : "hidden h-0 overflow-hidden"}>
                <KnowledgeGraph initialAttributes={selectedAttributes} initialData={csvData} />
              </div>
            )}
            
            {visitedTabs.trust && (
              <div className={currentPage === "trust" ? "block h-full" : "hidden h-0 overflow-hidden"}>
                <TrustProvenance />
              </div>
            )}
            
            {visitedTabs.blockchain && (
              <div className={currentPage === "blockchain" ? "block h-full" : "hidden h-0 overflow-hidden"}>
                <ProvenanceIntelligenceHub />
              </div>
            )}
            
            {visitedTabs.metrics && (
              <div className={currentPage === "metrics" ? "block h-full" : "hidden h-0 overflow-hidden"}>
                <BlockchainMetrics />
              </div>
            )}
            
            {visitedTabs.sharing && (
              <div className={currentPage === "sharing" ? "block h-full" : "hidden h-0 overflow-hidden"}>
                <SharedReports setCurrentPage={setCurrentPage} />
              </div>
            )}
            
            {visitedTabs.taxii && (
              <div className={currentPage === "taxii" ? "block h-full" : "hidden h-0 overflow-hidden"}>
                <TaxiiServer />
              </div>
            )}
            
            {visitedTabs["feed-extractor"] && (
              <div className={currentPage === "feed-extractor" ? "block h-full" : "hidden h-0 overflow-hidden"}>
                <FeedExtractor />
              </div>
            )}
            
            {visitedTabs.clients && (
              <div className={currentPage === "clients" ? "block h-full" : "hidden h-0 overflow-hidden"}>
                <Clients />
              </div>
            )}
            
            {visitedTabs.rag && (
              <div className={currentPage === "rag" ? "block h-full" : "hidden h-0 overflow-hidden"}>
                <RagAssistant />
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
