"use client"

import { 
  LayoutDashboard, Database, Network, Shield, FileText, 
  Users, Blocks, Share2, Activity, Server, Globe, 
  BrainCircuit, Menu, LogOut, Heart, Sun, Moon, Monitor
} from "lucide-react"
import { useAuth } from "@/app/contexts/AuthContext"
import { useTheme } from "next-themes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface SidebarProps {
  currentPage: string
  setCurrentPage: (page: string) => void
}

const navItems = [
  { id: "dashboard", label: "Overview", icon: LayoutDashboard },
  { id: "blockchain", label: "Upload Reports", icon: Blocks },
  { id: "metrics", label: "Blockchain Metrics", icon: Activity },
  { id: "sharing", label: "Threat feed", icon: Share2 },
  { id: "taxii", label: "TAXII Server", icon: Server },
  { id: "feeds", label: "Feed Parser", icon: Database },
  { id: "clients", label: "Organizations", icon: Users },
  { id: "trust", label: "Trust", icon: Shield },
  { id: "rag", label: "AI Assistant", icon: BrainCircuit },
]

export default function Sidebar({ currentPage, setCurrentPage }: SidebarProps) {
  const { logout } = useAuth()
  const { setTheme } = useTheme()

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

      {/* ─── SIDEBAR FOOTER (Settings Menu) ─── */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-all group">
              <Menu className="w-5 h-5 transition-transform group-hover:rotate-90 duration-300" />
              <span className="font-bold tracking-tight">System Console</span>
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-56 rounded-xl shadow-2xl border-slate-200 mb-2">
            <DropdownMenuLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest p-3">System Controls</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-100" />
            
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="flex items-center gap-2 py-3 px-3 cursor-pointer">
                <Sun className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-bold text-slate-700">Display Theme</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="rounded-xl shadow-xl border-slate-200 ml-2">
                <DropdownMenuItem onClick={() => setTheme("light")} className="flex items-center gap-2 py-2.5 px-3 cursor-pointer">
                  <Sun className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">Light Protocol</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")} className="flex items-center gap-2 py-2.5 px-3 cursor-pointer">
                  <Moon className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">Dark Ops</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")} className="flex items-center gap-2 py-2.5 px-3 cursor-pointer">
                  <Monitor className="w-3.5 h-3.5" />
                  <span className="text-xs font-bold">System Default</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuItem asChild className="flex items-center gap-2 py-3 px-3 cursor-pointer group">
              <a href="https://github.com/josefumis-projects/threatchain" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 w-full">
                <Heart className="w-4 h-4 text-rose-500 group-hover:fill-rose-500 transition-colors" />
                <span className="text-sm font-bold text-slate-700">Sponsor on GitHub</span>
              </a>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-slate-100" />
            
            <DropdownMenuItem onClick={logout} className="flex items-center gap-2 py-3 px-3 cursor-pointer text-rose-600 hover:bg-rose-50 transition-colors">
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-black uppercase tracking-wider">Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
