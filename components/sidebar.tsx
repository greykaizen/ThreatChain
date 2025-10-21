"use client"

import { LayoutDashboard, Database, Network, Shield, FileText, Users } from "lucide-react"

interface SidebarProps {
  currentPage: string
  setCurrentPage: (page: string) => void
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "feeds", label: "Feeds", icon: Database },
  { id: "graph", label: "Graph", icon: Network },
  { id: "trust", label: "Trust", icon: Shield },
  { id: "policy", label: "Policy", icon: FileText },
  { id: "clients", label: "Clients", icon: Users },
]

export default function Sidebar({ currentPage, setCurrentPage }: SidebarProps) {
  return (
    <aside
      style={{
        backgroundColor: "#ffffff",
        borderRight: "1px solid #e5e7eb",
      }}
      className="w-64 flex flex-col"
    >
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Dashboards</h2>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id

          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm ${
                isActive
                  ? "bg-gray-100 text-gray-900 font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
              style={{ transition: "all 150ms ease" }}
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
