"use client"

import { useState } from "react"
import Sidebar from "@/components/sidebar"
import DashboardOverview from "@/components/pages/dashboard-overview"
import FeedManagement from "@/components/pages/feed-management"
import KnowledgeGraph from "@/components/pages/knowledge-graph"
import TrustProvenance from "@/components/pages/trust-provenance"
import PolicyValidation from "@/components/pages/policy-validation"
import Clients from "@/components/pages/clients"
import Navbar from "@/components/navbar"

export default function Home() {
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
        return <FeedManagement onProceedToGraph={handleProceedToGraph} />
      case "graph":
        return <KnowledgeGraph selectedAttributes={selectedAttributes} csvData={csvData} />
      case "trust":
        return <TrustProvenance />
      case "policy":
        return <PolicyValidation />
      case "clients":
        return <Clients />
      default:
        return <DashboardOverview />
    }
  }

  return (
    <div className="flex h-screen" style={{ backgroundColor: "#f9fafb" }}>
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-auto" style={{ backgroundColor: "#f9fafb" }}>{renderPage()}</main>
      </div>
    </div>
  )
}
