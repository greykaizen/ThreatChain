"use client"

import { LayoutDashboard, Database, Network, Shield, FileText, Users, Blocks, Share2, Activity, Server, Globe } from "lucide-react"

interface SidebarProps {
  currentPage: string
  setCurrentPage: (page: string) => void
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "blockchain", label: "Upload Reports", icon: Blocks },
  // { id: "graph", label: "Graph", icon: Network }, // Commented - redundant with Feed Parser preview
  { id: "metrics", label: "Blockchain Metrics", icon: Activity },
  { id: "sharing", label: "Threat feed", icon: Share2 },
  { id: "taxii", label: "TAXII Server", icon: Server },
  { id: "feeds", label: "Feed Parser", icon: Database },
  { id: "clients", label: "Organizations", icon: Users },
  { id: "trust", label: "Trust", icon: Shield },
  { id: "feed-extractor", label: "Feed Extractor", icon: Globe },
]

export default function Sidebar({ currentPage, setCurrentPage }: SidebarProps) {
  return (
    <aside className="w-64 flex flex-col bg-sidebar border-r border-sidebar-border">
      <div className="p-6 border-b border-sidebar-border">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dashboards</h2>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id

          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
