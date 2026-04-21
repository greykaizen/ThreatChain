"use client"

import { 
  LayoutDashboard, Database, Network, Shield, FileText, 
  Users, Blocks, Share2, Activity, Server, Globe, 
  BrainCircuit, Menu, LogOut, Heart, Sun, Moon, Monitor
} from "lucide-react"
import { useAuth } from "@/app/contexts/AuthContext"
import { useTheme } from "next-themes"

interface SidebarProps {
  currentPage: string
  setCurrentPage: (page: string) => void
}

const navItems = [
  { id: "dashboard", label: "Overview", icon: LayoutDashboard },
  // { id: "blockchain", label: "Upload Reports", icon: Blocks },
  { id: "metrics", label: "Blockchain Metrics", icon: Activity },
  { id: "sharing", label: "Discover", icon: Share2 },
  { id: "taxii", label: "Provenance Engine", icon: Server },
  { id: "feeds", label: "Feed Parser", icon: Database },
  // { id: "clients", label: "Organizations", icon: Users },
  { id: "trust", label: "Trust", icon: Shield },
  { id: "rag", label: "AI Assistant", icon: BrainCircuit },
]

export default function Sidebar({ currentPage, setCurrentPage }: SidebarProps) {
  const { logout } = useAuth()

  return (
    <aside className="w-64 flex flex-col bg-white border-r border-slate-200 h-screen shadow-sm">
      {/* ─── SIDEBAR HEADER ─── */}
      <div className="p-6 border-b border-slate-100 flex items-center gap-2">
         <div className="p-1.5 bg-indigo-600 rounded-lg shadow-md shadow-indigo-100">
            <Shield className="w-4 h-4 text-white" />
         </div>
         <h2 className="text-sm font-black text-slate-900 uppercase tracking-tighter">ThreadChain</h2>
      </div>

      {/* ─── NAVIGATION ─── */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-2">Core Modules</p>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id

          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-300 group ${
                isActive
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 font-bold"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
              <span className="tracking-tight">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
            </button>
          )
        })}
      </nav>

      {/* ─── SIDEBAR FOOTER (Branding Only) ─── */}
      <div className="p-6 border-t border-slate-100 bg-slate-50/50">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-[10px] font-black text-indigo-600">
               TC
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-900 uppercase leading-none">Intelligence v4.2</p>
               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Verified Node</p>
            </div>
         </div>
      </div>
    </aside>
  )
}
