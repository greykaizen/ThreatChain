"use client"

import { Search, Bell, User, Settings, Shield, Sun, Moon, Monitor, Heart, LogOut } from "lucide-react"
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
import { Button } from "./ui/button"

export default function Navbar() {
  const { logout } = useAuth()
  const { setTheme } = useTheme()

  return (
    <nav className="px-6 py-3 flex items-center justify-end bg-card border-b border-border">
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="h-9 w-9 text-slate-500 hover:text-slate-900 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-2xl border-slate-200">
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
    </nav>
  )
}
