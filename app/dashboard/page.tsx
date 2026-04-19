"use client"

import { useState } from "react"
import ProtectedRoute from "@/components/ProtectedRoute"
import Sidebar from "@/components/sidebar"
import DashboardOverview from "@/components/pages/dashboard-overview"
import FeedParser from "@/components/pages/feed-parser"
import KnowledgeGraph from "@/components/pages/knowledge-graph"
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

  const handleProceedToGraph = (attributes: any[], data: any[]) => {
    setSelectedAttributes(attributes.map((a) => a.name))
    setCsvData(data)
    setCurrentPage("graph")
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardOverview />
      case "feeds":
        return <FeedParser onProceedToGraph={handleProceedToGraph} />
      case "graph":
        return <KnowledgeGraph selectedAttributes={selectedAttributes} csvData={csvData} />
      case "trust":
        return <TrustProvenance />
      case "blockchain":
        return <ProvenanceIntelligenceHub />
      case "metrics":
        return <BlockchainMetrics />
      case "sharing":
        return <SharedReports />
      case "taxii":
        return <TaxiiServer />
      case "feed-extractor":
        return <FeedExtractor />
      case "clients":
        return <Clients />
      case "rag":
        return <RagAssistant />
      default:
        return <DashboardOverview />
    }
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-auto bg-background">{renderPage()}</main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
